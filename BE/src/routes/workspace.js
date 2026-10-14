import { Router } from "express";
import { allow } from "../middlewares/auth.js";
import * as controller from "../controllers/workspace.js";
export const workspaceRoutes = Router();
workspaceRoutes.get(
  "/templates/sample-meeting",
  allow("coordinator"),
  controller.sample,
);
workspaceRoutes.get("/overview", controller.getOverview);
workspaceRoutes.get("/workspace", controller.getWorkspace);
