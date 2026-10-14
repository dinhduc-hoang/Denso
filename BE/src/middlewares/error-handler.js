import { config } from "../config/env.js";
import { assert } from "../utils/errors.js";
export const notFound = (req, _res, next) => {
  assert(false, "Không tìm thấy API.", 404, "NOT_FOUND");
  next();
};
export const errorHandler = (error, req, res, _next) => {
  if (res.headersSent) return _next(error);
  let status = error.status ?? 500;
  let code = error.code ?? "INTERNAL_ERROR";
  let message = error.message;
  if (error.code === "ER_DUP_ENTRY") {
    status = 409;
    code = "CONFLICT";
    message = "Bản ghi đã tồn tại.";
  } else if (error.code === "LIMIT_FILE_SIZE") {
    status = 413;
    code = "FILE_TOO_LARGE";
    message = `Tệp vượt quá ${config.UPLOAD_MAX_MB} MB.`;
  } else if (error.name === "MulterError") {
    status = 422;
    code = "INVALID_FILE";
    message = "Yêu cầu upload không hợp lệ.";
  } else if (error.type === "entity.parse.failed") {
    status = 400;
    code = "INVALID_JSON";
    message = "JSON không hợp lệ.";
  } else if (error.type === "entity.too.large") {
    status = 413;
    code = "BODY_TOO_LARGE";
    message = "Dữ liệu vượt giới hạn.";
  } else if (
    [
      "ECONNREFUSED",
      "ETIMEDOUT",
      "ER_ACCESS_DENIED_ERROR",
      "ER_BAD_DB_ERROR",
      "ENOTFOUND",
    ].includes(error.code)
  ) {
    status = 503;
    code = "DATABASE_UNAVAILABLE";
    message = "Database chưa sẵn sàng.";
  }
  if (status >= 500) {
    console.error(
      JSON.stringify({
        requestId: req.requestId,
        code: error.code ?? error.name,
        message: "Request failed",
      }),
    );
    if (status !== 503) {
      code = "INTERNAL_ERROR";
      message = "Không thể xử lý yêu cầu.";
    }
  }
  res.status(status).json({
    error: {
      code,
      message,
      ...(error.details ? { details: error.details } : {}),
    },
    requestId: req.requestId,
  });
};
