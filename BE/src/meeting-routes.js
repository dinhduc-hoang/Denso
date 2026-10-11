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
  meetingView,
  reportView,
  json,
} from "./store.js";
import { generateSampleReport, verifySources } from "./reports.js";

export const meetingRoutes = Router();
meetingRoutes.get("/meetings", async (req, res) =>
  res.json(
    await paginate(
      "SELECT * FROM meetings",
      [],
      parse(schemas.list, req.query),
      meetingView,
    ),
  ),
);
meetingRoutes.post("/meetings", allow("coordinator"), async (req, res) => {
  const data = parse(schemas.meeting, req.body);
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
        req.user.id,
      ],
    );
    await audit(db, req.user, "meeting.created", id);
  });
  res.status(201).json({ data: meetingView(await get(pool, "meetings", id)) });
});
meetingRoutes.get("/meetings/:id", async (req, res) =>
  res.json({ data: meetingView(await get(pool, "meetings", req.params.id)) }),
);
meetingRoutes.patch("/meetings/:id", allow("coordinator"), async (req, res) => {
  const input = parse(schemas.meetingPatch, req.body);
  const data = await transaction(async (db) => {
    const meeting = await get(db, "meetings", req.params.id, true);
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
    await audit(db, req.user, "meeting.updated", meeting.id);
    return meetingView(await get(db, "meetings", meeting.id));
  });
  res.json({ data });
});
meetingRoutes.post(
  "/meetings/:id/reports",
  allow("coordinator"),
  async (req, res) => {
    parse(schemas.reportCreate, req.body);
    const data = await transaction(async (db) => {
      const meeting = meetingView(
        await get(db, "meetings", req.params.id, true),
      );
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
      await audit(db, req.user, "report.generated", id);
      return reportView(await get(db, "reports", id));
    });
    res.status(201).json({ data });
  },
);
meetingRoutes.get("/reports/:id", async (req, res) =>
  res.json({ data: reportView(await get(pool, "reports", req.params.id)) }),
);
meetingRoutes.patch(
  "/reports/:id",
  allow("expert", "coordinator"),
  async (req, res) => {
    const input = parse(schemas.reportPatch, req.body);
    const data = await transaction(async (db) => {
      const report = await get(db, "reports", req.params.id, true);
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
      await audit(db, req.user, "report.edited", report.id);
      return reportView(await get(db, "reports", report.id));
    });
    res.json({ data });
  },
);
meetingRoutes.post(
  "/reports/:id/revisions",
  allow("expert"),
  async (req, res) => {
    const input = parse(schemas.revision, req.body);
    assert(input.revision, "Cần revision hiện tại.", 422, "VALIDATION_ERROR");
    const data = await transaction(async (db) => {
      const report = await get(db, "reports", req.params.id, true);
      assert(
        report.status !== "approved" && report.revision === input.revision,
        "Báo cáo đã duyệt hoặc bản nháp đã thay đổi.",
      );
      await db.execute(
        'UPDATE reports SET status="revision_requested",revision=revision+1,revision_reason=? WHERE id=?',
        [input.reason, report.id],
      );
      await audit(db, req.user, "report.revision_requested", report.id);
      return reportView(await get(db, "reports", report.id));
    });
    res.status(201).json({ data });
  },
);
meetingRoutes.post(
  "/reports/:id/approvals",
  allow("expert"),
  async (req, res) => {
    const input = parse(schemas.reportApproval, req.body);
    const data = await transaction(async (db) => {
      const report = await get(db, "reports", req.params.id, true);
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
        [id, JSON.stringify(knowledgeDocument), req.user.id],
      );
      await db.execute(
        'UPDATE reports SET status="approved",approved_by=?,approved_at=UTC_TIMESTAMP(3) WHERE id=?',
        [req.user.id, report.id],
      );
      await audit(db, req.user, "report.approved", report.id);
      return {
        report: reportView(await get(db, "reports", report.id)),
        knowledgeId: id,
      };
    });
    res.status(201).json({ data });
  },
);
