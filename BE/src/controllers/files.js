import { z } from "zod";
import { parse } from "../utils/errors.js";
import { id } from "../utils/schemas.js";
import * as service from "../services/files.js";
export async function uploadFile(req, res) {
  const input = parse(
    z
      .strictObject({ meetingId: id.optional(), incidentId: id.optional() })
      .refine((v) => Boolean(v.meetingId) !== Boolean(v.incidentId)),
    req.body,
  );
  res
    .status(201)
    .json({ data: await service.uploadFile(input, req.file, req.user) });
}
export async function downloadFile(req, res, next) {
  const result = await service.downloadFile(req.params.id);
  if (Object.hasOwn(result, "content"))
    return res
      .attachment(result.file.original_name)
      .type(result.file.mime_type)
      .send(result.content);
  res.set("Content-Type", result.file.mime_type);
  res.download(result.path, result.file.original_name, (error) => {
    if (error) next(error);
  });
}
