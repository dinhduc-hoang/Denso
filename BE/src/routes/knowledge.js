import { Router } from "express";
import * as controller from "../controllers/knowledge.js";
export const knowledgeRoutes = Router();
knowledgeRoutes.get("/knowledge", controller.list);
knowledgeRoutes.get("/knowledge/:id/versions", controller.history);
knowledgeRoutes.get("/knowledge/:id/export", controller.exportKnowledge);
knowledgeRoutes.get("/knowledge/:id", controller.get);
knowledgeRoutes.post("/retrievals", controller.retrieval);
