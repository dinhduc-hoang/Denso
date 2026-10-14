import { pool, transaction } from "../config/database.js";

import { assert } from "../utils/errors.js";

import { newId, json } from "../utils/data.js";
import {
  get,
  audit,
  paginate,
  meetingView,
  reportView,
} from "../models/store.js";
import { generateSampleReport, verifySources } from "./reports.js";
export async function listMeetings({ options }) {
  return await paginate("SELECT * FROM meetings", [], options, meetingView);
}
export async function createMeeting({ data, user }) {
  const id = newId("DR");
  await transaction(async (db) => {
    await db.execute(
      "INSERT INTO meetings (id,title,machine,station,product,segments,created_by) VALUES (?,?,?,?,?,?,?)",
      [
        id,
        data.title,
        data.scope.machine,
        data.scope.station,
        data.scope.product,
        JSON.stringify(data.segments),
        user.id,
      ],
    );
    await audit(db, user, "meeting.created", id);
  });
  return meetingView(await get(pool, "meetings", id));
}
export async function getMeeting({ resourceId }) {
  return meetingView(await get(pool, "meetings", resourceId));
}
export async function updateMeeting({ input, resourceId, user }) {
  const data = await transaction(async (db) => {
    const meeting = await get(db, "meetings", resourceId, true);
    const [reports] = await db.execute(
      "SELECT id FROM reports WHERE meeting_id=?",
      [meeting.id],
    );
    assert(
      !reports.length,
      "Nguồn đã được dùng trong báo cáo; tạo cuộc họp mới để thay đổi transcript.",
    );
    await db.execute("UPDATE meetings SET title=?,segments=? WHERE id=?", [
      input.title ?? meeting.title,
      JSON.stringify(input.segments ?? json(meeting.segments)),
      meeting.id,
    ]);
    await audit(db, user, "meeting.updated", meeting.id);
    return meetingView(await get(db, "meetings", meeting.id));
  });
  return data;
}
export async function createReport({ resourceId, user }) {
  const data = await transaction(async (db) => {
    const meeting = meetingView(await get(db, "meetings", resourceId, true));
    const document = generateSampleReport(meeting);
    verifySources(document, meeting.segments);
    const [existing] = await db.execute(
      "SELECT * FROM reports WHERE meeting_id=? FOR UPDATE",
      [meeting.id],
    );
    assert(
      existing[0]?.status !== "approved",
      "Báo cáo đã được phát hành và bị khóa.",
    );
    const id = existing[0]?.id ?? newId("REP");
    if (existing.length)
      await db.execute(
        'UPDATE reports SET status="draft",revision=revision+1,document=?,decision=?,revision_reason=NULL WHERE id=?',
        [JSON.stringify(document), document.decisions[0].action, id],
      );
    else
      await db.execute(
        "INSERT INTO reports (id,meeting_id,document,decision) VALUES (?,?,?,?)",
        [
          id,
          meeting.id,
          JSON.stringify(document),
          document.decisions[0].action,
        ],
      );
    await audit(db, user, "report.generated", id);
    return reportView(await get(db, "reports", id));
  });
  return data;
}
export async function getReport({ resourceId }) {
  return reportView(await get(pool, "reports", resourceId));
}
export async function updateReport({ input, resourceId, user }) {
  const data = await transaction(async (db) => {
    const report = await get(db, "reports", resourceId, true);
    assert(report.status !== "approved", "Báo cáo đã duyệt bị khóa.");
    assert(
      report.revision === input.revision,
      "Bản nháp đã thay đổi; tải lại trước khi lưu.",
    );
    const document = json(report.document);
    document.decisions[0].action = input.decision;
    await db.execute(
      'UPDATE reports SET decision=?,document=?,revision=revision+1,status="draft",revision_reason=NULL WHERE id=?',
      [input.decision, JSON.stringify(document), report.id],
    );
    await audit(db, user, "report.edited", report.id);
    return reportView(await get(db, "reports", report.id));
  });
  return data;
}
export async function requestReportRevision({ input, resourceId, user }) {
  assert(input.revision, "Cần revision hiện tại.", 422, "VALIDATION_ERROR");
  const data = await transaction(async (db) => {
    const report = await get(db, "reports", resourceId, true);
    assert(
      report.status !== "approved" && report.revision === input.revision,
      "Báo cáo đã duyệt hoặc bản nháp đã thay đổi.",
    );
    await db.execute(
      'UPDATE reports SET status="revision_requested",revision=revision+1,revision_reason=? WHERE id=?',
      [input.reason, report.id],
    );
    await audit(db, user, "report.revision_requested", report.id);
    return reportView(await get(db, "reports", report.id));
  });
  return data;
}
export async function approveReport({ input, resourceId, user }) {
  const data = await transaction(async (db) => {
    const report = await get(db, "reports", resourceId, true);
    assert(
      report.status === "draft",
      "Báo cáo chưa sẵn sàng duyệt hoặc đã phát hành.",
    );
    assert(
      report.revision === input.revision,
      "Bản nháp đã thay đổi; đối chiếu lại trước khi duyệt.",
    );
    const meeting = meetingView(await get(db, "meetings", report.meeting_id));
    const document = json(report.document);
    verifySources(document, meeting.segments);
    assert(
      report.decision.trim(),
      "Quyết định không được để trống.",
      422,
      "VALIDATION_ERROR",
    );
    const id = newId("KB");
    const knowledgeDocument = {
      ...document,
      decision: report.decision,
      sources: meeting.segments,
      fieldNote: null,
    };
    await db.execute(
      "INSERT INTO knowledge (id,report_id,error_code,title,machine,station,product,current_version) VALUES (?,?,?,?,?,?,?,1)",
      [
        id,
        report.id,
        document.errorCode,
        "E-VIS-07 · Ảnh kiểm tra bị mờ",
        meeting.scope.machine,
        meeting.scope.station,
        meeting.scope.product,
      ],
    );
    await db.execute(
      "INSERT INTO knowledge_versions (knowledge_id,version,document,approved_by,approved_at) VALUES (?,1,?,?,UTC_TIMESTAMP(3))",
      [id, JSON.stringify(knowledgeDocument), user.id],
    );
    await db.execute(
      'UPDATE reports SET status="approved",approved_by=?,approved_at=UTC_TIMESTAMP(3) WHERE id=?',
      [user.id, report.id],
    );
    await audit(db, user, "report.approved", report.id);
    return {
      report: reportView(await get(db, "reports", report.id)),
      knowledgeId: id,
    };
  });
  return data;
}
