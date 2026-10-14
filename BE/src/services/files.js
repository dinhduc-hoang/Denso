import { config } from "../config/env.js";
import { pool, transaction } from "../config/database.js";
import { assert } from "../utils/errors.js";
import { get, audit } from "../models/store.js";
import { newId } from "../utils/data.js";
import { detectType } from "../utils/file-type.js";
import { uploadDirectory } from "../config/paths.js";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
export async function uploadFile(input, file, user) {
  assert(
    file,
    "Chọn một tệp ảnh, PDF hoặc audio được hỗ trợ.",
    422,
    "INVALID_FILE",
  );
  const mimeType = detectType(file.buffer);
  assert(
    mimeType &&
      (mimeType === file.mimetype ||
        (mimeType === "audio/wav" && file.mimetype === "audio/x-wav")),
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
    .basename(file.originalname.replaceAll("\\", "/"))
    .slice(0, 255);
  if (config.FILE_STORAGE === "filesystem")
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
        roles.includes(user.role) ||
          (input.incidentId && user.id === target.created_by),
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
      if (config.FILE_STORAGE === "filesystem") {
        await writeFile(path.join(uploadDirectory, storageName), file.buffer, {
          flag: "wx",
        });
        written = true;
      }
      await db.execute(
        "INSERT INTO files (id,original_name,storage_name,mime_type,size_bytes,meeting_id,incident_id,created_by) VALUES (?,?,?,?,?,?,?,?)",
        [
          fileId,
          originalName,
          storageName,
          mimeType,
          file.size,
          input.meetingId ?? null,
          input.incidentId ?? null,
          user.id,
        ],
      );
      if (config.FILE_STORAGE === "mysql")
        await db.execute(
          "INSERT INTO file_contents (file_id,content) VALUES (?,?)",
          [fileId, file.buffer],
        );
      await audit(db, user, "file.uploaded", fileId);
    });
  } catch (error) {
    if (written)
      await unlink(path.join(uploadDirectory, storageName)).catch(() => {});
    throw error;
  }
  return {
    id: fileId,
    name: originalName,
    mimeType,
    size: file.size,
    meetingId: input.meetingId,
    incidentId: input.incidentId,
  };
}
export async function downloadFile(id) {
  const file = await get(pool, "files", id);
  if (config.FILE_STORAGE === "mysql") {
    const [rows] = await pool.execute(
      "SELECT content FROM file_contents WHERE file_id=?",
      [file.id],
    );
    assert(rows.length, "Không tìm thấy nội dung tệp.", 404, "NOT_FOUND");
    return { file, content: rows[0].content };
  }
  return { file, path: path.join(uploadDirectory, file.storage_name) };
}
