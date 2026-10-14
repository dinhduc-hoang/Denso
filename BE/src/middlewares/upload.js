import multer from "multer";
import { config } from "../config/env.js";
const types = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/webm",
]);
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.UPLOAD_MAX_MB * 1024 * 1024, files: 1, fields: 2 },
  fileFilter(_req, file, cb) {
    cb(null, types.has(file.mimetype));
  },
});
