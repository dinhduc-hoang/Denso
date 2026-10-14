import { assert } from "../utils/errors.js";
import { sampleMeeting, sampleDecision } from "../tools/sample.js";

export function generateSampleReport(meeting) {
  assert(
    meeting.segments.length === sampleMeeting.segments.length &&
      meeting.segments.every((segment, index) =>
        ["id", "startSeconds", "speaker", "text", "kind"].every(
          (key) => segment[key] === sampleMeeting.segments[index][key],
        ),
      ) &&
      ["machine", "station", "product"].every(
        (k) => meeting.scope[k] === sampleMeeting.scope[k],
      ),
    "Chế độ mẫu chỉ xử lý transcript mẫu. Chọn mẫu hoặc tích hợp dịch vụ AI cho transcript khác.",
    422,
    "UNSUPPORTED_TRANSCRIPT",
  );
  const source = (kind) => {
    const segment = meeting.segments.find((s) => s.kind === kind);
    return { segmentId: segment.id, startSeconds: segment.startSeconds };
  };
  return {
    mode: "sample",
    meetingId: meeting.id,
    summary:
      "Camera CAM-02 báo ảnh mờ; kiểm tra ống kính theo SOP, chưa kết luận hỏng cảm biến.",
    errorCode: "E-VIS-07",
    scope: meeting.scope,
    issues: [
      {
        symptom: "E-VIS-07 / ảnh mờ",
        rootCauseHypothesis: "Bụi trên bề mặt ống kính",
        confirmed: false,
        source: source("root"),
      },
    ],
    decisions: [
      {
        action: sampleDecision,
        setpoint: null,
        scope: meeting.scope,
        source: source("decision"),
      },
    ],
    actionItems: [
      {
        task: "Đối chiếu SOP hiện hành",
        assignee: "Lan",
        deadline: "2026-10-11T16:00:00+07:00",
        needsClarification: false,
        status: "pending",
        source: source("action"),
      },
      {
        task: "Kiểm tra điều kiện ánh sáng",
        assignee: null,
        deadline: null,
        needsClarification: true,
        status: "pending",
        source: source("action"),
      },
    ],
    risks: [
      {
        text: meeting.segments.find((s) => s.kind === "dissent").text,
        source: source("dissent"),
      },
    ],
    stopCondition:
      "Ảnh chưa đạt hoặc ngoài phạm vi: giữ xử lý theo SOP và chuyển kỹ sư. Không tự thay đổi PLC.",
  };
}
export function verifySources(document, segments) {
  const items = [
    ...document.issues,
    ...document.decisions,
    ...document.actionItems,
    ...document.risks,
  ];
  assert(
    items.every((item) =>
      segments.some(
        (s) =>
          s.id === item.source?.segmentId &&
          s.startSeconds === item.source.startSeconds,
      ),
    ),
    "Báo cáo chứa nguồn không tồn tại.",
    422,
    "INVALID_SOURCE",
  );
}
