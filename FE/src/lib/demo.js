export const STORAGE_KEY = "meeting-shopfloor-demo-v1";

export const labels = [
  "Tổng quan & workflow",
  "Cuộc họp kỹ thuật",
  "Báo cáo & phê duyệt",
  "Kho tri thức",
  "Trợ lý sàn máy",
  "Sự cố & phản hồi",
  "Ghi chú kỹ sư",
];
export const roles = [
  "Giám khảo · Demo",
  "Điều phối cuộc họp",
  "Chuyên gia phê duyệt",
  "Quản lý tri thức",
  "Công nhân vận hành",
  "Công nhân / Kỹ sư",
  "Kỹ sư hiện trường",
];

export function freshState() {
  return {
    page: 0,
    processed: false,
    approved: false,
    ack: false,
    confirmed: false,
    decision:
      "Kiểm tra và vệ sinh bề mặt ống kính theo SOP đã duyệt; kiểm tra lại chất lượng ảnh trước khi tiếp tục.",
    reportRevision: 1,
    revisionRequested: false,
    query: "E-VIS-07 — ảnh kiểm tra bị mờ",
    searched: false,
    found: false,
    incident: false,
    closed: false,
    feedback: "",
    noteDraft: false,
    noteApproved: false,
    note: "",
    cause: "",
    attachment: "",
    audio: "",
    engineer: "",
  };
}

// Preserve the existing demo storage key and only accept fields of the expected type.
export function loadState(storage) {
  const initial = freshState();
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY) || "{}");
    for (const key of Object.keys(initial)) {
      if (typeof saved?.[key] === typeof initial[key])
        initial[key] = saved[key];
    }
  } catch {
    /* An invalid/unavailable localStorage starts a fresh demo. */
  }
  initial.page = 0;
  initial.approved =
    initial.processed && initial.approved && !!initial.decision.trim();
  initial.noteDraft =
    initial.incident &&
    initial.noteDraft &&
    !!initial.cause.trim() &&
    !!initial.note.trim();
  initial.noteApproved =
    initial.approved && initial.noteDraft && initial.noteApproved;
  initial.found =
    initial.searched && initial.approved && matchesQuery(initial.query);
  return initial;
}

export function matchesQuery(query) {
  return /E-VIS-07|ảnh.*mờ|camera.*mờ/i.test(query);
}

export function demoReducer(state, action) {
  switch (action.type) {
    case "navigate":
      return { ...state, page: action.page };
    case "edit": {
      if (action.field === "decision" && state.approved) return state;
      if (["cause", "note"].includes(action.field) && state.noteDraft)
        return state;
      return {
        ...state,
        [action.field]: action.value,
        ...(action.field === "decision"
          ? { confirmed: false, ack: false }
          : {}),
        ...(action.field === "query" ? { searched: false, found: false } : {}),
      };
    }
    case "process":
      if (state.approved) return { ...state, page: 2 };
      return {
        ...state,
        processed: true,
        revisionRequested: false,
        confirmed: false,
        ack: false,
        page: 2,
      };
    case "approve":
      if (
        !state.processed ||
        !state.confirmed ||
        !state.ack ||
        !state.decision.trim()
      )
        return state;
      return { ...state, approved: true, revisionRequested: false };
    case "revision":
      if (state.approved) return state;
      return {
        ...state,
        revisionRequested: true,
        confirmed: false,
        ack: false,
      };
    case "search":
      return {
        ...state,
        searched: true,
        found: state.approved && matchesQuery(state.query),
      };
    case "unknown":
      return {
        ...state,
        query: "E-NEW-99 — lỗi chưa được ghi nhận",
        searched: true,
        found: false,
      };
    case "escalate":
    case "ineffective":
      return {
        ...state,
        incident: true,
        closed: false,
        page: 5,
        feedback: state.found
          ? "Ảnh vẫn chưa đạt sau khi kiểm tra theo hướng dẫn đã duyệt."
          : "Không có hướng dẫn đã duyệt phù hợp; cần kỹ sư đánh giá.",
      };
    case "effective":
      if (!state.found) return state;
      return { ...state, closed: true, feedback: "Hiệu quả" };
    case "retry":
      return { ...state, closed: false, incident: false, feedback: "" };
    case "sample-note":
      if (state.noteDraft) return state;
      return {
        ...state,
        cause:
          "Dữ liệu mẫu: điều kiện ánh sáng tại trạm demo thay đổi; kiểm tra mẫu cho thấy ảnh vẫn mờ sau kiểm tra ống kính.",
        note: "Trong cùng cấu hình CAM-02 / Demo A / S-01: kỹ sư kiểm tra điều kiện ánh sáng theo SOP-VIS-02, đối chiếu ảnh mẫu chuẩn và ghi bằng chứng. Không tự đổi tham số máy; chuyển người có thẩm quyền nếu ảnh chưa đạt.",
      };
    case "save-note":
      if (
        !state.incident ||
        state.noteDraft ||
        !state.cause.trim() ||
        !state.note.trim()
      )
        return state;
      return { ...state, noteDraft: true, noteApproved: false };
    case "return-note":
      if (state.noteApproved) return state;
      return { ...state, noteDraft: false, noteApproved: false };
    case "approve-note":
      if (!state.approved || !state.noteDraft || !action.reviewed) return state;
      return { ...state, noteApproved: true };
    case "reset":
      return freshState();
    default:
      return state;
  }
}

export function knowledgeExport(state, sources) {
  if (!state.approved) return null;
  return {
    demo: true,
    id: "KB-VIS-024",
    status: "approved",
    version: state.noteApproved ? 2 : 1,
    scope: { machine: "CAM-02", station: "Demo A", product: "S-01" },
    decision: state.decision,
    source: {
      meeting: "DR-024",
      timestamp: "08:42",
      transcript: sources.decision.quote,
    },
    approved_by: "Nam (demo)",
    field_note: state.noteApproved
      ? { case: "INC-DEMO-01", cause: state.cause, action: state.note }
      : null,
    history: state.noteApproved
      ? [
          { version: 1, status: "superseded" },
          { version: 2, status: "active" },
        ]
      : [{ version: 1, status: "active" }],
  };
}
