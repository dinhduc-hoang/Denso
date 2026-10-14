import { Router } from "express";
import { allow } from "../middlewares/auth.js";
import * as controller from "../controllers/meeting.js";
export const meetingRoutes = Router();
meetingRoutes.get("/meetings", controller.listMeetings);
meetingRoutes.post("/meetings", allow("coordinator"), controller.createMeeting);
meetingRoutes.get("/meetings/:id", controller.getMeeting);
meetingRoutes.patch(
  "/meetings/:id",
  allow("coordinator"),
  controller.updateMeeting,
);
meetingRoutes.post(
  "/meetings/:id/reports",
  allow("coordinator"),
  controller.createReport,
);
meetingRoutes.get("/reports/:id", controller.getReport);
meetingRoutes.patch(
  "/reports/:id",
  allow("expert", "coordinator"),
  controller.updateReport,
);
meetingRoutes.post(
  "/reports/:id/revisions",
  allow("expert"),
  controller.requestReportRevision,
);
meetingRoutes.post(
  "/reports/:id/approvals",
  allow("expert"),
  controller.approveReport,
);
