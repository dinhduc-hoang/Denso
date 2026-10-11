import { sampleMeeting } from "./sample.js";
import { generateSampleReport } from "./reports.js";

export const seedUsers = [
  {
    id: "user-admin",
    email: "admin@demo.local",
    name: "Quản trị",
    role: "admin",
  },
  {
    id: "user-coordinator",
    email: "coordinator@demo.local",
    name: "Hà · Điều phối",
    role: "coordinator",
  },
  {
    id: "user-expert",
    email: "expert@demo.local",
    name: "Nam · Chuyên gia",
    role: "expert",
  },
  {
    id: "user-engineer",
    email: "engineer@demo.local",
    name: "Minh · Kỹ sư",
    role: "engineer",
  },
  {
    id: "user-worker",
    email: "worker@demo.local",
    name: "An · Công nhân",
    role: "worker",
  },
  {
    id: "user-quality",
    email: "quality@demo.local",
    name: "Lan · Chất lượng",
    role: "expert",
  },
  {
    id: "user-engineer-b",
    email: "engineer.b@demo.local",
    name: "Bình · Kỹ sư ca B",
    role: "engineer",
  },
  {
    id: "user-worker-b",
    email: "worker.b@demo.local",
    name: "Mai · Công nhân ca B",
    role: "worker",
  },
];

export function buildSeedData(now = new Date()) {
  const at = (minutes) => new Date(now.getTime() - minutes * 60000);
  const data = {
    meetings: [],
    reports: [],
    knowledge: [],
    incidents: [],
    files: [],
    notes: [],
    knowledge_versions: [],
    feedback: [],
    audit_events: [],
  };
  const event = (actor, action, resource, minutes) =>
    data.audit_events.push({
      actor_id: actor,
      action,
      resource_id: resource,
      created_at: at(minutes),
    });
  const mainScope = sampleMeeting.scope;
  const otherScope = { machine: "CAM-03", station: "Demo B", product: "S-02" };
  const meetingRow = (id, scope, minutes, title = sampleMeeting.title) => ({
    id,
    title,
    ...scope,
    segments: sampleMeeting.segments,
    created_by: "user-coordinator",
    created_at: at(minutes),
  });
  data.meetings.push(meetingRow("DR-024", mainScope, 14400));
  for (const [suffix, status, scope, minutes, active, validUntil] of [
    ["024", "approved", mainScope, 10, true, null],
    ["023", "approved", otherScope, 1440, true, null],
    ["025", "draft", mainScope, 60, null, null],
    ["026", "revision_requested", mainScope, 120, null, null],
    ["021", "approved", mainScope, 4320, true, at(1440)],
    ["022", "approved", mainScope, 2880, false, null],
  ]) {
    const meetingId = `DR-DEMO-${suffix}`;
    const reportId = `REP-DEMO-${suffix}`;
    const knowledgeId = `KB-VIS-${suffix}`;
    const document = generateSampleReport({ id: meetingId, ...sampleMeeting });
    // Other scopes are fixtures for retrieval filtering; each source explicitly describes that scope.
    const segments = structuredClone(sampleMeeting.segments);
    if (scope !== mainScope) {
      for (const segment of segments)
        segment.text = segment.text
          .replaceAll("CAM-02", scope.machine)
          .replaceAll("demo A", "demo B");
      document.summary = document.summary.replaceAll("CAM-02", scope.machine);
      document.scope = scope;
      document.decisions[0].scope = scope;
    }
    data.meetings.push({ ...meetingRow(meetingId, scope, minutes), segments });
    data.reports.push({
      id: reportId,
      meeting_id: meetingId,
      status,
      revision: status === "revision_requested" ? 2 : 1,
      document,
      decision: document.decisions[0].action,
      approved_by: status === "approved" ? "user-expert" : null,
      approved_at: status === "approved" ? at(minutes - 1) : null,
      revision_reason:
        status === "revision_requested"
          ? "Cần đối chiếu lại bằng chứng và làm rõ điều kiện dừng trước khi duyệt."
          : null,
      created_at: at(minutes),
    });
    event("user-coordinator", "meeting.created", meetingId, minutes);
    event("user-coordinator", "report.generated", reportId, minutes);
    if (status === "revision_requested")
      event("user-expert", "report.revision_requested", reportId, minutes - 1);
    if (status !== "approved") continue;
    const published = {
      ...structuredClone(document),
      demo: true,
      decision: document.decisions[0].action,
      sources: segments,
      fieldNote: null,
    };
    data.knowledge.push({
      id: knowledgeId,
      report_id: reportId,
      error_code: "E-VIS-07",
      title: "E-VIS-07 · Ảnh kiểm tra bị mờ",
      ...scope,
      current_version: suffix === "024" ? 2 : 1,
      is_active: active,
      valid_until: validUntil,
      created_at: at(minutes),
    });
    data.knowledge_versions.push({
      knowledge_id: knowledgeId,
      version: 1,
      document: published,
      source_note_id: null,
      approved_by: "user-expert",
      approved_at: at(minutes - 1),
    });
    event("user-expert", "report.approved", reportId, minutes - 1);
  }
  const incident = (
    id,
    query,
    scope,
    knowledgeId,
    version,
    status,
    reason,
    feedback,
    minutes,
  ) => {
    const row = {
      id,
      query,
      ...scope,
      knowledge_id: knowledgeId,
      knowledge_version: version,
      status,
      reason,
      feedback,
      created_by: "user-worker",
      assigned_to: status === "open" ? null : "user-engineer",
      created_at: at(minutes),
    };
    data.incidents.push(row);
    event("user-worker", "incident.created", id, minutes);
    return row;
  };
  incident(
    "INC-DEMO-01",
    "E-VIS-07 — ảnh kiểm tra bị mờ",
    mainScope,
    "KB-VIS-024",
    1,
    "in_progress",
    "ineffective",
    "Ảnh vẫn mờ sau khi kiểm tra ống kính. Kỹ sư đã bổ sung kiểm tra ánh sáng; chờ xác nhận chất lượng cuối cùng.",
    5,
  );
  incident(
    "INC-DEMO-02",
    "E-VIS-07 — ảnh kiểm tra bị mờ",
    otherScope,
    "KB-VIS-023",
    1,
    "in_progress",
    "ineffective",
    "Ảnh chưa đạt tại CAM-03. Ghi chú kỹ sư đang chờ chuyên gia đối chiếu.",
    180,
  );
  incident(
    "INC-DEMO-03",
    "E-NEW-99 — lỗi chưa được ghi nhận",
    mainScope,
    null,
    null,
    "open",
    "unknown",
    "Không tìm thấy hướng dẫn đã duyệt phù hợp. Đã giữ xử lý theo SOP và chuyển kỹ sư.",
    30,
  );
  incident(
    "INC-DEMO-04",
    "E-VIS-07 — ảnh kiểm tra bị mờ",
    mainScope,
    "KB-VIS-024",
    2,
    "resolved",
    "ineffective",
    "Sau khi đối chiếu hướng dẫn v2, chất lượng ảnh đã đạt và người có thẩm quyền xác nhận.",
    240,
  );
  incident(
    "INC-DEMO-05",
    "E-VIS-07 — ảnh kiểm tra bị mờ",
    mainScope,
    "KB-VIS-024",
    2,
    "in_progress",
    "out_of_scope",
    "Phương án cần tháo cụm bảo vệ; ngoài quyền hạn công nhân. Chuyên gia yêu cầu bổ sung bằng chứng.",
    120,
  );
  incident(
    "INC-DEMO-06",
    "E-LIGHT-02 — ánh sáng tại trạm kiểm tra không ổn định",
    mainScope,
    "KB-LIGHT-001",
    null,
    "resolved",
    "unknown",
    "Kỹ sư đã kiểm tra theo SOP; chuyên gia duyệt hướng dẫn mới từ hiện trường.",
    720,
  );

  const fieldNote = {
    id: "NOTE-DEMO-01",
    incidentId: "INC-DEMO-01",
    cause:
      "Dữ liệu mẫu: điều kiện ánh sáng tại trạm thay đổi; ảnh vẫn mờ sau kiểm tra ống kính.",
    action:
      "Trong cùng cấu hình CAM-02 / Demo A / S-01, kiểm tra điều kiện ánh sáng theo SOP-VIS-02 và đối chiếu ảnh chuẩn. Không tự đổi tham số máy; chuyển người có thẩm quyền nếu ảnh chưa đạt.",
    conditions:
      "Chỉ CAM-02 / Demo A / S-01; chỉ thao tác đã được đào tạo. Không thay đổi PLC.",
    evidenceIds: ["FILE-DEMO-FIELD-01"],
    createdBy: "user-engineer",
  };
  const addNote = (
    id,
    incidentId,
    status,
    baseVersion,
    cause,
    action,
    evidenceId,
    minutes,
  ) => {
    const row = {
      id,
      incident_id: incidentId,
      cause,
      action,
      conditions: fieldNote.conditions,
      evidence_ids: [evidenceId],
      base_version: baseVersion,
      status,
      created_by: "user-engineer",
      approved_by: status === "approved" ? "user-expert" : null,
      approved_at: status === "approved" ? at(minutes - 1) : null,
      revision_reason:
        status === "revision_requested"
          ? "Bổ sung ảnh sau kiểm tra và giới hạn quyền hạn thực hiện."
          : null,
      created_at: at(minutes),
    };
    if (incidentId === "INC-DEMO-02")
      row.conditions =
        "Chỉ CAM-03 / Demo B / S-02; thực hiện theo SOP hiện hành, không thay đổi PLC.";
    data.notes.push(row);
    event("user-engineer", "note.created", id, minutes);
    if (status !== "draft")
      event(
        "user-expert",
        status === "approved" ? "note.approved" : "note.revision_requested",
        id,
        minutes - 1,
      );
    return row;
  };
  addNote(
    fieldNote.id,
    fieldNote.incidentId,
    "approved",
    1,
    fieldNote.cause,
    fieldNote.action,
    fieldNote.evidenceIds[0],
    4,
  );
  addNote(
    "NOTE-DEMO-02",
    "INC-DEMO-02",
    "draft",
    1,
    "Mẫu: kiểm tra bước đầu cho thấy ánh sáng không ổn định.",
    "Đối chiếu ảnh chuẩn và ghi kết quả kiểm tra theo SOP; chưa cho phép áp dụng như hướng dẫn chuẩn.",
    "FILE-DEMO-FIELD-02",
    170,
  );
  addNote(
    "NOTE-DEMO-03",
    "INC-DEMO-05",
    "revision_requested",
    2,
    "Mẫu: nghi ngờ gá đỡ bị lệch; chưa đủ bằng chứng kết luận.",
    "Cần người có thẩm quyền kiểm tra cụm gá theo SOP; công nhân không tự tháo máy.",
    "FILE-DEMO-FIELD-03",
    110,
  );
  const lightNote = addNote(
    "NOTE-DEMO-04",
    "INC-DEMO-06",
    "approved",
    null,
    "Mẫu: vị trí nguồn sáng thay đổi so với ảnh chuẩn tại trạm.",
    "Đối chiếu vị trí ánh sáng và ảnh chuẩn theo SOP-VIS-02. Chuyển kỹ sư nếu cần điều chỉnh cấu hình ngoài quyền hạn.",
    "FILE-DEMO-FIELD-04",
    710,
  );
  const v1 = data.knowledge_versions.find(
    (row) => row.knowledge_id === "KB-VIS-024",
  );
  data.knowledge_versions.push({
    ...structuredClone(v1),
    version: 2,
    document: {
      ...structuredClone(v1.document),
      fieldNote,
      fieldNotes: [fieldNote],
    },
    source_note_id: fieldNote.id,
    approved_at: at(3),
  });
  data.knowledge.push({
    id: "KB-LIGHT-001",
    report_id: null,
    error_code: "E-LIGHT-02",
    title: "E-LIGHT-02 · Ánh sáng trạm kiểm tra không ổn định",
    ...mainScope,
    current_version: 1,
    is_active: true,
    valid_until: null,
    created_at: at(700),
  });
  const lightSource = {
    id: lightNote.id,
    incidentId: lightNote.incident_id,
    cause: lightNote.cause,
    action: lightNote.action,
    conditions: lightNote.conditions,
    evidenceIds: lightNote.evidence_ids,
    createdBy: lightNote.created_by,
  };
  data.knowledge_versions.push({
    knowledge_id: "KB-LIGHT-001",
    version: 1,
    document: {
      mode: "field",
      demo: true,
      meetingId: null,
      errorCode: "E-LIGHT-02",
      scope: mainScope,
      decision: lightNote.action,
      sources: [],
      stopCondition: lightNote.conditions,
      fieldNote: lightSource,
      fieldNotes: [lightSource],
    },
    source_note_id: lightNote.id,
    approved_by: "user-expert",
    approved_at: at(709),
  });
  for (const [
    id,
    knowledgeId,
    version,
    incidentId,
    result,
    comment,
    minutes,
  ] of [
    [
      "FB-DEMO-01",
      "KB-VIS-024",
      1,
      "INC-DEMO-01",
      "ineffective",
      "Ảnh vẫn mờ sau kiểm tra ống kính theo v1.",
      5,
    ],
    [
      "FB-DEMO-02",
      "KB-VIS-024",
      2,
      "INC-DEMO-04",
      "effective",
      "Ảnh đạt sau khi đối chiếu phần kiểm tra ánh sáng của v2.",
      230,
    ],
    [
      "FB-DEMO-03",
      "KB-VIS-023",
      1,
      "INC-DEMO-02",
      "ineffective",
      "Ảnh chưa đạt tại trạm Demo B.",
      180,
    ],
    [
      "FB-DEMO-04",
      "KB-VIS-024",
      2,
      "INC-DEMO-05",
      "ineffective",
      "Cần thao tác ngoài quyền hạn; đã chuyển kỹ sư.",
      120,
    ],
  ]) {
    data.feedback.push({
      id,
      knowledge_id: knowledgeId,
      version,
      incident_id: incidentId,
      result,
      comment,
      created_by: "user-worker",
      created_at: at(minutes),
    });
    event("user-worker", "feedback.created", id, minutes);
  }
  for (const [id, name, type, meetingId, incidentId, minutes] of [
    [
      "FILE-DEMO-AUDIO-01",
      "design-review-sample-silence.wav",
      "audio/wav",
      "DR-DEMO-024",
      null,
      10,
    ],
    [
      "FILE-DEMO-DOC-01",
      "SOP-VIS-02-sample.pdf",
      "application/pdf",
      "DR-DEMO-024",
      null,
      10,
    ],
    [
      "FILE-DEMO-DOC-02",
      "review-checklist-sample.pdf",
      "application/pdf",
      "DR-DEMO-025",
      null,
      61,
    ],
    [
      "FILE-DEMO-FIELD-01",
      "camera-evidence-sample.png",
      "image/png",
      null,
      "INC-DEMO-01",
      5,
    ],
    [
      "FILE-DEMO-FIELD-02",
      "camera-demo-b-sample.png",
      "image/png",
      null,
      "INC-DEMO-02",
      175,
    ],
    [
      "FILE-DEMO-FIELD-03",
      "mount-check-sample.png",
      "image/png",
      null,
      "INC-DEMO-05",
      115,
    ],
    [
      "FILE-DEMO-FIELD-04",
      "lighting-check-sample.png",
      "image/png",
      null,
      "INC-DEMO-06",
      715,
    ],
  ]) {
    data.files.push({
      id,
      original_name: name,
      storage_name: id,
      mime_type: type,
      meeting_id: meetingId,
      incident_id: incidentId,
      created_by: incidentId ? "user-engineer" : "user-coordinator",
      created_at: at(minutes),
    });
    event(
      incidentId ? "user-engineer" : "user-coordinator",
      "file.uploaded",
      id,
      minutes,
    );
  }
  return data;
}
