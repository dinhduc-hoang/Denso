import { Router } from "express";
import { upload } from "../middlewares/upload.js";
import * as controller from "../controllers/files.js";
export const filesRoutes = Router();
filesRoutes.post("/files", upload.single("file"), controller.uploadFile);
filesRoutes.get("/files/:id", controller.downloadFile);
