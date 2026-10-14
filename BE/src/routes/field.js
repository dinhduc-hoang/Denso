import { Router } from "express";
import { allow } from "../middlewares/auth.js";
import * as controller from "../controllers/field.js";
export const fieldRoutes = Router();
fieldRoutes.get("/incidents", controller.listIncidents);
fieldRoutes.post("/incidents", controller.createIncident);
fieldRoutes.get("/incidents/:id", controller.getIncident);
fieldRoutes.patch("/incidents/:id", controller.updateIncident);
fieldRoutes.post("/feedback", controller.createFeedback);
fieldRoutes.get("/incidents/:id/notes", controller.listNotes);
fieldRoutes.post(
  "/incidents/:id/notes",
  allow("engineer"),
  controller.createNote,
);
fieldRoutes.post(
  "/notes/:id/revisions",
  allow("expert"),
  controller.requestNoteRevision,
);
fieldRoutes.post(
  "/notes/:id/approvals",
  allow("expert"),
  controller.approveNote,
);
