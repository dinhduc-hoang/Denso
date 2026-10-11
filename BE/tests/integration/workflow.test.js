import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createApp } from "../../src/app.js";
import { config } from "../../src/config.js";
import { pool } from "../../src/db.js";
import { hashPassword } from "../../src/auth.js";
import { sampleMeeting } from "../../src/sample.js";

if (!config.DB_NAME.endsWith("_test"))
  throw new Error(
    "Integration tests require a separate DB_NAME ending in _test. Run migration first.",
  );
const runId = randomUUID().slice(0, 8);
const password = `Integration-${randomUUID()}`;
const tokens = {};
let server;
let base;
async function api(path, role = "admin", body, method = body ? "POST" : "GET") {
  const result = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      ...(role ? { Authorization: `Bearer ${tokens[role]}` } : {}),
      ...(body && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
    },
    ...(body
      ? { body: body instanceof FormData ? body : JSON.stringify(body) }
      : {}),
  });
  return {
    status: result.status,
    headers: result.headers,
    ...(result.status === 204 ? {} : await result.json()),
  };
}
before(async () => {
  for (const role of ["admin", "coordinator", "expert", "engineer", "worker"])
    await pool.execute(
      "INSERT INTO users (id,email,name,role,password_hash) VALUES (?,?,?,?,?)",
      [
        `test-${runId}-${role}`,
        `${runId}-${role}@test.local`,
        `Test ${role}`,
        role,
        await hashPassword(password),
      ],
    );
  server = createApp().listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  for (const role of ["admin", "coordinator", "expert", "engineer", "worker"]) {
    const result = await api("/auth/login", null, {
      email: `${runId}-${role}@test.local`,
      password,
    });
    assert.equal(result.status, 200);
    tokens[role] = result.data.token;
  }
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await pool.end();
});
async function createReport() {
  const meeting = await api("/meetings", "coordinator", sampleMeeting);
  assert.equal(meeting.status, 201);
  const report = await api(
    `/meetings/${meeting.data.id}/reports`,
    "coordinator",
    { mode: "sample" },
  );
  assert.equal(report.status, 201);
  return { meeting: meeting.data, report: report.data };
}
async function approve(report) {
  const result = await api(`/reports/${report.id}/approvals`, "expert", {
    confirmed: true,
    ack: true,
    revision: report.revision,
  });
  assert.equal(result.status, 201);
  return result.data.knowledgeId;
}

test("authentication, roles, strict input, pagination and session revocation", async () => {
  assert.equal((await api("/meetings", null)).status, 401);
  assert.equal(
    (
      await api("/auth/login", null, {
        email: `${runId}-worker@test.local`,
        password: "wrong",
      })
    ).status,
    401,
  );
  assert.equal((await api("/meetings", "worker", sampleMeeting)).status, 403);
  const listing = await api("/meetings?page=1&pageSize=2");
  assert.equal(listing.status, 200);
  assert.equal(listing.pagination.pageSize, 2);
  assert.equal((await api("/meetings?pageSize=10000")).status, 422);
  assert.equal(
    (
      await api("/meetings", "coordinator", {
        ...sampleMeeting,
        approved: true,
      })
    ).status,
    422,
  );
  assert.equal((await api("/auth/me", "worker")).data.role, "worker");
  const session = await api("/auth/login", null, {
    email: `${runId}-worker@test.local`,
    password,
  });
  const original = tokens.worker;
  tokens.worker = session.data.token;
  assert.equal((await api("/auth/logout", "worker", {}, "POST")).status, 204);
  assert.equal((await api("/auth/me", "worker")).status, 401);
  tokens.worker = original;
});
test("report revisions, stale edits, locking sources and concurrent approvals", async () => {
  const { meeting, report } = await createReport();
  assert.equal(
    (
      await api(
        `/meetings/${meeting.id}`,
        "coordinator",
        { title: "replace" },
        "PATCH",
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await api(`/reports/${report.id}/approvals`, "worker", {
        confirmed: true,
        ack: true,
        revision: 1,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await api(`/reports/${report.id}/approvals`, "expert", {
        confirmed: false,
        ack: true,
        revision: 1,
      })
    ).status,
    422,
  );
  const revised = await api(`/reports/${report.id}/revisions`, "expert", {
    reason: "Đối chiếu lại nguồn",
    revision: 1,
  });
  assert.equal(revised.status, 201);
  assert.equal(
    (
      await api(`/reports/${report.id}/approvals`, "expert", {
        confirmed: true,
        ack: true,
        revision: revised.data.revision,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await api(
        `/reports/${report.id}`,
        "expert",
        { decision: "test", revision: 1 },
        "PATCH",
      )
    ).status,
    409,
  );
  const edited = await api(
    `/reports/${report.id}`,
    "expert",
    {
      decision: "Kiểm tra theo SOP đã đối chiếu.",
      revision: revised.data.revision,
    },
    "PATCH",
  );
  assert.equal(edited.status, 200);
  const outcomes = await Promise.all(
    [1, 2].map(() =>
      api(`/reports/${report.id}/approvals`, "expert", {
        confirmed: true,
        ack: true,
        revision: edited.data.revision,
      }),
    ),
  );
  assert.deepEqual(outcomes.map((x) => x.status).sort(), [201, 409]);
  assert.equal(
    (
      await api(
        `/reports/${report.id}`,
        "expert",
        { decision: "overwrite", revision: edited.data.revision },
        "PATCH",
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await api(`/meetings/${meeting.id}/reports`, "coordinator", {
        mode: "sample",
      })
    ).status,
    409,
  );
});
test("full MySQL v1 → ineffective feedback → engineer note → reviewed v2 → immutable history", async () => {
  const { meeting, report } = await createReport();
  const beforeApproval = await api("/retrievals", "worker", {
    query: "E-VIS-07",
    scope: { ...sampleMeeting.scope, product: "unique-no-match" },
  });
  assert.equal(beforeApproval.data.cards.length, 0);
  const knowledgeId = await approve(report);
  const found = await api("/retrievals", "worker", {
    query: "E-VIS-07",
    scope: sampleMeeting.scope,
  });
  assert(
    found.data.cards.some(
      (card) => card.id === knowledgeId && card.version === 1,
    ),
  );
  const created = await api("/incidents", "worker", {
    query: "E-VIS-07",
    scope: sampleMeeting.scope,
    feedback: "Ảnh vẫn mờ",
    reason: "ineffective",
    knowledgeId,
    version: 1,
  });
  assert.equal(created.status, 201);
  const incidentId = created.data.id;
  assert.equal(
    (
      await api(
        `/incidents/${incidentId}`,
        "worker",
        { status: "resolved" },
        "PATCH",
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await api(`/incidents/${incidentId}/notes`, "worker", {
        cause: "Ánh sáng",
        action: "Kiểm tra SOP",
        conditions: "Cùng phạm vi",
      })
    ).status,
    403,
  );
  const draft = await api(`/incidents/${incidentId}/notes`, "engineer", {
    cause: "Ánh sáng đã kiểm tra",
    action: "Đối chiếu ảnh chuẩn theo SOP",
    conditions: "Cùng máy và sản phẩm; không thay đổi PLC",
  });
  assert.equal(draft.status, 201);
  assert.equal((await api(`/knowledge/${knowledgeId}`)).data.version, 1);
  assert.equal(
    (
      await api(`/notes/${draft.data.id}/approvals`, "engineer", {
        reviewed: true,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await api(`/notes/${draft.data.id}/approvals`, "expert", {
        reviewed: false,
      })
    ).status,
    422,
  );
  const published = await api(`/notes/${draft.data.id}/approvals`, "expert", {
    reviewed: true,
  });
  assert.equal(published.status, 201);
  assert.equal(published.data.version, 2);
  const history = await api(`/knowledge/${knowledgeId}/versions`);
  assert.deepEqual(
    history.data.map((v) => [v.version, v.status]),
    [
      [1, "superseded"],
      [2, "active"],
    ],
  );
  assert.equal(history.data[0].document.fieldNote, null);
  assert.equal(history.data[1].document.fieldNote.cause, draft.data.cause);
  assert.equal(history.data[1].approvedBy.id, `test-${runId}-expert`);
  const exportData = await api(`/knowledge/${knowledgeId}/export`);
  assert.equal(exportData.version, 2);
  assert.equal(exportData.history.length, 2);
  assert.match(exportData.headers.get("content-disposition"), /attachment/);
  const workspace = await api(
    `/workspace?meetingId=${meeting.id}&incidentId=${incidentId}`,
  );
  assert.equal(workspace.data.note.status, "approved");
  assert.equal(workspace.data.knowledge.version, 2);
  assert.equal(
    (
      await api("/feedback", "worker", {
        knowledgeId,
        version: 1,
        result: "effective",
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await api("/feedback", "worker", {
        knowledgeId,
        version: 99,
        result: "effective",
      })
    ).status,
    422,
  );
  const [audit] = await pool.execute(
    "SELECT action FROM audit_events WHERE resource_id=?",
    [draft.data.id],
  );
  assert(audit.some((event) => event.action === "note.approved"));
});
test("retrieval excludes draft, expired, revoked and wrong-scope knowledge and does not guess unknown codes", async () => {
  const { report } = await createReport();
  const knowledgeId = await approve(report);
  for (const query of ["E-NEW-99 ảnh mờ", "E-VIS-07"]) {
    const result = await api("/retrievals", "worker", {
      query,
      scope: { ...sampleMeeting.scope, machine: "WRONG-MACHINE" },
    });
    assert.equal(result.data.cards.length, 0);
  }
  assert.equal(
    (
      await api("/retrievals", "worker", {
        query: `E-UNKNOWN-${runId.toUpperCase()} ảnh mờ`,
        scope: sampleMeeting.scope,
      })
    ).data.cards.length,
    0,
  );
  await pool.execute(
    'UPDATE knowledge SET valid_until="2000-01-01" WHERE id=?',
    [knowledgeId],
  );
  assert(
    !(
      await api("/retrievals", "worker", {
        query: "E-VIS-07",
        scope: sampleMeeting.scope,
      })
    ).data.cards.some((card) => card.id === knowledgeId),
  );
  await pool.execute(
    "UPDATE knowledge SET valid_until=NULL,is_active=FALSE WHERE id=?",
    [knowledgeId],
  );
  assert(
    !(await api("/knowledge")).data.some((card) => card.id === knowledgeId),
  );
  const { report: draft } = await createReport();
  const [unpublished] = await pool.execute(
    "SELECT id FROM knowledge WHERE report_id=?",
    [draft.id],
  );
  assert.equal(unpublished.length, 0);
});
test("unknown fault notes can be returned, corrected and released as new guidance", async () => {
  const incident = await api("/incidents", "worker", {
    query: "E-NEW-99",
    scope: sampleMeeting.scope,
    feedback: "Chưa có hướng dẫn",
    reason: "unknown",
  });
  const first = await api(`/incidents/${incident.data.id}/notes`, "engineer", {
    cause: "Đã kiểm tra",
    action: "Phương án theo SOP",
    conditions: "Giới hạn đã xác nhận",
  });
  assert.equal(
    (
      await api(`/notes/${first.data.id}/revisions`, "expert", {
        reason: "Bổ sung bằng chứng",
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await api(`/notes/${first.data.id}/approvals`, "expert", {
        reviewed: true,
      })
    ).status,
    409,
  );
  const second = await api(`/incidents/${incident.data.id}/notes`, "engineer", {
    cause: "Nguyên nhân đã kiểm tra lại",
    action: "Hướng dẫn mới đã kiểm tra",
    conditions: "Chỉ cùng phạm vi",
  });
  const published = await api(`/notes/${second.data.id}/approvals`, "expert", {
    reviewed: true,
  });
  assert.equal(published.status, 201);
  assert.equal(published.data.version, 1);
  assert(
    (
      await api("/retrievals", "worker", {
        query: "E-NEW-99",
        scope: sampleMeeting.scope,
      })
    ).data.cards.some((card) => card.id === published.data.knowledgeId),
  );
});
test("stale field drafts cannot overwrite a newer approved knowledge version", async () => {
  const { report } = await createReport();
  const knowledgeId = await approve(report);
  const drafts = [];
  for (const label of ["A", "B"]) {
    const incident = await api("/incidents", "worker", {
      query: "E-VIS-07",
      scope: sampleMeeting.scope,
      feedback: `Case ${label}`,
      reason: "ineffective",
      knowledgeId,
      version: 1,
    });
    const note = await api(`/incidents/${incident.data.id}/notes`, "engineer", {
      cause: `Cause ${label}`,
      action: `Action ${label}`,
      conditions: "Same scope",
      baseVersion: 1,
    });
    assert.equal(note.status, 201);
    drafts.push(note.data);
  }
  assert.equal(
    (
      await api(`/notes/${drafts[0].id}/approvals`, "expert", {
        reviewed: true,
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await api(`/notes/${drafts[1].id}/approvals`, "expert", {
        reviewed: true,
      })
    ).status,
    409,
  );
  const current = await api(`/knowledge/${knowledgeId}`);
  assert.equal(current.data.version, 2);
  assert.equal(current.data.document.fieldNote.action, "Action A");
});

test("file upload saves bytes and metadata and rejects forged or foreign evidence", async () => {
  const meeting = await api("/meetings", "coordinator", sampleMeeting);
  const bad = new FormData();
  bad.append("meetingId", meeting.data.id);
  bad.append(
    "file",
    new Blob(["<script>bad</script>"], { type: "image/png" }),
    "fake.png",
  );
  assert.equal((await api("/files", "coordinator", bad)).status, 422);
  const bytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZvoAAAAASUVORK5CYII=",
    "base64",
  );
  const body = new FormData();
  body.append("meetingId", meeting.data.id);
  body.append("file", new Blob([bytes], { type: "image/png" }), "evidence.png");
  const upload = await api("/files", "coordinator", body);
  assert.equal(upload.status, 201);
  const download = await fetch(`${base}/api/files/${upload.data.id}`, {
    headers: { Authorization: `Bearer ${tokens.worker}` },
  });
  assert.equal(download.status, 200);
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), bytes);
  const incident = await api("/incidents", "worker", {
    query: "E-NEW-02",
    scope: sampleMeeting.scope,
    feedback: "Không rõ",
    reason: "unknown",
  });
  assert.equal(
    (
      await api(`/incidents/${incident.data.id}/notes`, "engineer", {
        cause: "Test",
        action: "Test",
        conditions: "Test",
        evidenceIds: [upload.data.id],
      })
    ).status,
    422,
  );
});
