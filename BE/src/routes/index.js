import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { health } from "../controllers/health.js";
import { createPublicAuthRoutes, authRoutes } from "./auth.js";
import { workspaceRoutes } from "./workspace.js";
import { knowledgeRoutes } from "./knowledge.js";
import { meetingRoutes } from "./meeting.js";
import { fieldRoutes } from "./field.js";
import { filesRoutes } from "./files.js";
export function createApiRoutes() {
  const apiRoutes = Router();
  apiRoutes.get("/health", health);
  apiRoutes.use(createPublicAuthRoutes());
  apiRoutes.use(authenticate);
  apiRoutes.use(
    authRoutes,
    workspaceRoutes,
    knowledgeRoutes,
    meetingRoutes,
    fieldRoutes,
    filesRoutes,
  );
  return apiRoutes;
}
