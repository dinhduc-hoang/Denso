import { Router } from "express";
import multer from "multer";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { z } from "zod";
import { config } from "./config.js";
import { pool, transaction } from "./db.js";
import { assert, parse } from "./errors.js";
import { id } from "./schemas.js";
import { get, newId, audit } from "./store.js";

export const uploadDirectory = fileURLToPath(
  new URL("../uploads/", import.meta.url),
);
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
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.UPLOAD_MAX_MB * 1024 * 1024, files: 1, fields: 2 },
  fileFilter(_req, file, cb) {
    cb(null, types.has(file.mimetype));
  },
});
export const filesRoutes = Router();
export function detectType(buffer) {
  if (
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255)
    return "image/jpeg";
  if (buffer.subarray(0, 5).toString() === "%PDF-") return "application/pdf";
  if (buffer.subarray(0, 4).toString() === "RIFF") {
    if (buffer.subarray(8, 12).toString() === "WEBP") return "image/webp";
    if (buffer.subarray(8, 12).toString() === "WAVE") return "audio/wav";
  }
  if (buffer.subarray(0, 4).toString() === "OggS") return "audio/ogg";
  if (buffer.subarray(4, 8).toString() === "ftyp") return "audio/mp4";
  if (
    buffer.subarray(0, 3).toString() === "ID3" ||
    (buffer[0] === 255 && (buffer[1] & 224) === 224)
  )
    return "audio/mpeg";
  if (buffer.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163])))
    return "audio/webm";
  return null;
}
filesRoutes.post("/files", upload.single("file"), async (req, res) => {
  const input = parse(
    z
      .strictObject({ meetingId: id.optional(), incidentId: id.optional() })
      .refine((v) => Boolean(v.meetingId) !== Boolean(v.incidentId)),
    req.body,
  );
  assert(
    req.file,
    "Chọn một tệp ảnh, PDF hoặc audio được hỗ trợ.",
    422,
    "INVALID_FILE",
  );
  const mimeType = detectType(req.file.buffer);
  assert(
    mimeType &&
      (mimeType === req.file.mimetype ||
        (mimeType === "audio/wav" && req.file.mimetype === "audio/x-wav")),
    "Nội dung tệp không khớp định dạng.",
    422,
    "INVALID_FILE",
  );
  assert(
    input.meetingId || mimeType.startsWith("image/"),
    "Sự cố chỉ nhận tệp ảnh.",
    422,
    "INVALID_FILE",
  );
  const fileId = newId("FILE");
  const storageName = fileId;
  const originalName = path
    .basename(req.file.originalname.replaceAll("\\", "/"))
    .slice(0, 255);
  await mkdir(uploadDirectory, { recursive: true });
  let written = false;
  try {
    await transaction(async (db) => {
      const target = await get(
        db,
        input.meetingId ? "meetings" : "incidents",
        input.meetingId ?? input.incidentId,
        true,
      );
      const roles = input.meetingId
        ? ["coordinator", "admin"]
        : ["engineer", "admin"];
      assert(
        roles.includes(req.user.role) ||
          (input.incidentId && req.user.id === target.created_by),
        "Không có quyền đính kèm tệp.",
        403,
        "FORBIDDEN",
      );
      if (input.meetingId) {
        const [reports] = await db.execute(
          "SELECT status FROM reports WHERE meeting_id=?",
          [input.meetingId],
        );
        assert(
          reports[0]?.status !== "approved",
          "Cuộc họp đã phát hành; không thêm bằng chứng sau khi duyệt.",
        );
      }
      await writeFile(
        path.join(uploadDirectory, storageName),
        req.file.buffer,
        { flag: "wx" },
      );
      written = true;
      await db.execute(
        "INSERT INTO files (id,original_name,storage_name,mime_type,size_bytes,meeting_id,incident_id,created_by) VALUES (?,?,?,?,?,?,?,?)",
        [
          fileId,
          originalName,
          storageName,
          mimeType,
          req.file.size,
          input.meetingId ?? null,
          input.incidentId ?? null,
          req.user.id,
        ],
      );
      await audit(db, req.user, "file.uploaded", fileId);
    });
  } catch (error) {
    if (written)
      await unlink(path.join(uploadDirectory, storageName)).catch(() => {});
    throw error;
  }
  res
    .status(201)
    .json({
      data: {
        id: fileId,
        name: originalName,
        mimeType,
        size: req.file.size,
        meetingId: input.meetingId,
        incidentId: input.incidentId,
      },
    });
});
filesRoutes.get("/files/:id", async (req, res, next) => {
  const file = await get(pool, "files", req.params.id);
  res.set("Content-Type", file.mime_type);
  res.download(
    path.join(uploadDirectory, file.storage_name),
    file.original_name,
    (error) => {
      if (error) next(error);
    },
  );
});
