import { Router } from "express";
import { pool, transaction } from "./db.js";
import { allow } from "./auth.js";
import { assert, parse } from "./errors.js";
import * as schemas from "./schemas.js";
import {
  newId,
  get,
  audit,
  paginate,
  json,
  scoped,
  incidentView,
  noteView,
} from "./store.js";
import { checkVersion } from "./knowledge.js";

export const fieldRoutes = Router();
fieldRoutes.get("/incidents", async (req, res) => {
  const options = parse(schemas.list, req.query);
  res.json(
    await paginate(
      `SELECT * FROM incidents${options.status ? " WHERE status=?" : ""}`,
      options.status ? [options.status] : [],
      options,
      incidentView,
    ),
  );
});
fieldRoutes.post("/incidents", async (req, res) => {
  const input = parse(schemas.incident, req.body);
  const id = newId("INC");
  await transaction(async (db) => {
    if (input.knowledgeId)
      await checkVersion(db, input.knowledgeId, input.version, input.scope);
    await db.execute(
      "INSERT INTO incidents (id,query,machine,station,product,feedback,reason,knowledge_id,knowledge_version,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [
        id,
        input.query,
        input.scope.machine,
        input.scope.station,
        input.scope.product,
        input.feedback,
        input.reason,
        input.knowledgeId ?? null,
        input.version ?? null,
        req.user.id,
      ],
    );
    if (input.reason === "ineffective" && input.knowledgeId)
      await db.execute(
        'INSERT INTO feedback (id,knowledge_id,version,incident_id,result,comment,created_by) VALUES (?,?,?,?,"ineffective",?,?)',
        [
          newId("FB"),
          input.knowledgeId,
          input.version,
          id,
          input.feedback,
          req.user.id,
        ],
      );
    await audit(db, req.user, "incident.created", id);
  });
  res
    .status(201)
    .json({ data: incidentView(await get(pool, "incidents", id)) });
});
fieldRoutes.get("/incidents/:id", async (req, res) =>
  res.json({ data: incidentView(await get(pool, "incidents", req.params.id)) }),
);
fieldRoutes.patch("/incidents/:id", async (req, res) => {
  const input = parse(schemas.incidentPatch, req.body);
  const data = await transaction(async (db) => {
    const incident = await get(db, "incidents", req.params.id, true);
    const isEngineer = ["engineer", "admin"].includes(req.user.role);
    assert(
      isEngineer || incident.created_by === req.user.id,
      "Chỉ người tạo hoặc kỹ sư được sửa sự cố.",
      403,
      "FORBIDDEN",
    );
    assert(
      !input.status || isEngineer,
      "Chỉ kỹ sư được cập nhật trạng thái.",
      403,
      "FORBIDDEN",
    );
    if (input.attachmentId) {
      const file = await get(db, "files", input.attachmentId);
      assert(
        file.incident_id === incident.id,
        "Ảnh không thuộc sự cố này.",
        422,
        "INVALID_ATTACHMENT",
      );
    }
    await db.execute(
      "UPDATE incidents SET feedback=?,status=?,assigned_to=? WHERE id=?",
      [
        input.feedback ?? incident.feedback,
        input.status ?? incident.status,
        input.status === "in_progress" ? req.user.id : incident.assigned_to,
        incident.id,
      ],
    );
    await audit(db, req.user, "incident.updated", incident.id);
    return incidentView(await get(db, "incidents", incident.id));
  });
  res.json({ data });
});
fieldRoutes.post("/feedback", async (req, res) => {
  const input = parse(schemas.feedback, req.body);
  const id = newId("FB");
  await transaction(async (db) => {
    await checkVersion(db, input.knowledgeId, input.version);
    if (input.incidentId) {
      const incident = await get(db, "incidents", input.incidentId);
      assert(
        incident.knowledge_id === input.knowledgeId &&
          incident.knowledge_version === input.version,
        "Phiên bản phản hồi không khớp sự cố.",
        422,
        "INVALID_VERSION",
      );
    }
    await db.execute(
      "INSERT INTO feedback (id,knowledge_id,version,incident_id,result,comment,created_by) VALUES (?,?,?,?,?,?,?)",
      [
        id,
        input.knowledgeId,
        input.version,
        input.incidentId ?? null,
        input.result,
        input.comment,
        req.user.id,
      ],
    );
    await audit(db, req.user, "feedback.created", id);
  });
  res.status(201).json({ data: { id, ...input, createdBy: req.user.id } });
});
fieldRoutes.get("/incidents/:id/notes", async (req, res) => {
  await get(pool, "incidents", req.params.id);
  res.json(
    await paginate(
      "SELECT * FROM notes WHERE incident_id=?",
      [req.params.id],
      parse(schemas.list, req.query),
      noteView,
    ),
  );
});
fieldRoutes.post(
  "/incidents/:id/notes",
  allow("engineer"),
  async (req, res) => {
    const input = parse(schemas.note, req.body);
    const id = newId("NOTE");
    const data = await transaction(async (db) => {
      const incident = await get(db, "incidents", req.params.id, true);
      assert(incident.status !== "resolved", "Sự cố đã đóng.");
      const [pending] = await db.execute(
        'SELECT id FROM notes WHERE incident_id=? AND status="draft"',
        [incident.id],
      );
      assert(!pending.length, "Sự cố đã có ghi chú chờ duyệt.");
      let baseVersion = null;
      if (incident.knowledge_id) {
        const knowledge = await get(db, "knowledge", incident.knowledge_id);
        baseVersion = input.baseVersion ?? knowledge.current_version;
        assert(
          baseVersion === knowledge.current_version,
          "Hướng dẫn đã có phiên bản mới; đối chiếu lại trước khi tạo ghi chú.",
        );
      } else
        assert(
          input.baseVersion === undefined,
          "Sự cố chưa có hướng dẫn gốc.",
          422,
          "INVALID_VERSION",
        );
      for (const fileId of input.evidenceIds) {
        const file = await get(db, "files", fileId);
        assert(
          file.incident_id === incident.id,
          "Bằng chứng không thuộc sự cố này.",
          422,
          "INVALID_ATTACHMENT",
        );
      }
      await db.execute(
        "INSERT INTO notes (id,incident_id,cause,action,conditions,evidence_ids,base_version,created_by) VALUES (?,?,?,?,?,?,?,?)",
        [
          id,
          incident.id,
          input.cause,
          input.action,
          input.conditions,
          JSON.stringify(input.evidenceIds),
          baseVersion,
          req.user.id,
        ],
      );
      await db.execute(
        'UPDATE incidents SET status="in_progress",assigned_to=? WHERE id=?',
        [req.user.id, incident.id],
      );
      await audit(db, req.user, "note.created", id);
      return noteView(await get(db, "notes", id));
    });
    res.status(201).json({ data });
  },
);
fieldRoutes.post("/notes/:id/revisions", allow("expert"), async (req, res) => {
  const input = parse(schemas.revision, req.body);
  const data = await transaction(async (db) => {
    const note = await get(db, "notes", req.params.id, true);
    assert(note.status === "draft", "Chỉ trả lại ghi chú đang chờ duyệt.");
    await db.execute(
      'UPDATE notes SET status="revision_requested",revision_reason=? WHERE id=?',
      [input.reason, note.id],
    );
    await audit(db, req.user, "note.revision_requested", note.id);
    return noteView(await get(db, "notes", note.id));
  });
  res.status(201).json({ data });
});
fieldRoutes.post("/notes/:id/approvals", allow("expert"), async (req, res) => {
  parse(schemas.noteApproval, req.body);
  const data = await transaction(async (db) => {
    const note = await get(db, "notes", req.params.id, true);
    assert(note.status === "draft", "Ghi chú chưa sẵn sàng hoặc đã phát hành.");
    const incident = await get(db, "incidents", note.incident_id, true);
    let knowledgeId = incident.knowledge_id;
    let version = 1;
    let document;
    if (knowledgeId) {
      const knowledge = await get(db, "knowledge", knowledgeId, true);
      assert(
        knowledge.is_active &&
          (!knowledge.valid_until ||
            new Date(knowledge.valid_until + "Z") > new Date()),
        "Hướng dẫn gốc không còn hiệu lực.",
      );
      assert(
        knowledge.current_version === note.base_version,
        "Ghi chú dựa trên phiên bản cũ; trả lại để kỹ sư đối chiếu.",
      );
      const [rows] = await db.execute(
        "SELECT document FROM knowledge_versions WHERE knowledge_id=? AND version=?",
        [knowledgeId, knowledge.current_version],
      );
      document = json(rows[0].document);
      version = knowledge.current_version + 1;
      await db.execute("UPDATE knowledge SET current_version=? WHERE id=?", [
        version,
        knowledgeId,
      ]);
    } else {
      knowledgeId = newId("KB");
      const errorCode =
        incident.query
          .match(/\bE-[A-Z0-9]+-[A-Z0-9]+\b/i)?.[0]
          ?.toUpperCase() ?? "FIELD";
      document = {
        mode: "field",
        meetingId: null,
        errorCode,
        scope: scoped(incident),
        decision: note.action,
        sources: [],
        stopCondition: note.conditions,
      };
      await db.execute(
        "INSERT INTO knowledge (id,error_code,title,machine,station,product,current_version) VALUES (?,?,?,?,?,?,1)",
        [
          knowledgeId,
          errorCode,
          incident.query.slice(0, 300),
          incident.machine,
          incident.station,
          incident.product,
        ],
      );
      await db.execute("UPDATE incidents SET knowledge_id=? WHERE id=?", [
        knowledgeId,
        incident.id,
      ]);
    }
    const fieldNote = {
      id: note.id,
      incidentId: incident.id,
      cause: note.cause,
      action: note.action,
      conditions: note.conditions,
      evidenceIds: json(note.evidence_ids),
      createdBy: note.created_by,
    };
    document = {
      ...document,
      fieldNote,
      fieldNotes: [...(document.fieldNotes ?? []), fieldNote],
    };
    await db.execute(
      "INSERT INTO knowledge_versions (knowledge_id,version,document,source_note_id,approved_by,approved_at) VALUES (?,?,?,?,?,UTC_TIMESTAMP(3))",
      [knowledgeId, version, JSON.stringify(document), note.id, req.user.id],
    );
    await db.execute(
      'UPDATE notes SET status="approved",approved_by=?,approved_at=UTC_TIMESTAMP(3) WHERE id=?',
      [req.user.id, note.id],
    );
    await audit(db, req.user, "note.approved", note.id);
    return {
      note: noteView(await get(db, "notes", note.id)),
      knowledgeId,
      version,
    };
  });
  res.status(201).json({ data });
});
