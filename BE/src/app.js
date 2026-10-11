import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import { pool } from "./db.js";
import { authenticate, allow, signIn } from "./auth.js";
import { assert, parse } from "./errors.js";
import * as schemas from "./schemas.js";
import { sampleMeeting } from "./sample.js";
import { meetingRoutes } from "./meeting-routes.js";
import { fieldRoutes } from "./field-routes.js";
import { filesRoutes } from "./files.js";
import { workspace } from "./workspace.js";
import {
  activeWhere,
  knowledgeSelect,
  knowledgeView,
  currentKnowledge,
  versions,
  retrieve,
} from "./knowledge.js";
import { paginate } from "./store.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.set("X-Request-Id", req.requestId);
    res.set("Cache-Control", "no-store");
    const start = Date.now();
    res.on("finish", () => {
      if (config.NODE_ENV !== "test")
        console.log(
          JSON.stringify({
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            durationMs: Date.now() - start,
          }),
        );
    });
    next();
  });
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) =>
        cb(null, !origin || config.origins.includes(origin)),
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.get("/api/health", async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ data: { status: "ok", database: "mysql" } });
  });
  app.post(
    "/api/auth/login",
    rateLimit({
      windowMs: 15 * 60000,
      limit: 30,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      handler: (req, res) =>
        res
          .status(429)
          .json({
            error: { code: "RATE_LIMITED", message: "Thử lại sau." },
            requestId: req.requestId,
          }),
    }),
    async (req, res) => {
      const input = parse(schemas.login, req.body);
      res.json({ data: await signIn(input.email, input.password) });
    },
  );
  app.use("/api", authenticate);
  app.get("/api/auth/me", (req, res) => res.json({ data: req.user }));
  app.post("/api/auth/logout", async (req, res) => {
    await pool.execute("DELETE FROM sessions WHERE token_hash=?", [
      req.tokenHash,
    ]);
    res.status(204).end();
  });
  app.get("/api/templates/sample-meeting", allow("coordinator"), (_req, res) =>
    res.json({ data: sampleMeeting }),
  );
  app.get("/api/overview", async (_req, res) => {
    const [rows] = await pool.query(
      `SELECT (SELECT COUNT(*) FROM meetings) AS meetings,(SELECT COUNT(*) FROM reports WHERE status!='approved') AS draftReports,(SELECT COUNT(*) FROM knowledge k WHERE ${activeWhere}) AS activeKnowledge,(SELECT COUNT(*) FROM incidents WHERE status!='resolved') AS openIncidents`,
    );
    res.json({ data: rows[0] });
  });
  app.get("/api/workspace", async (req, res) =>
    res.json({ data: await workspace(req.query) }),
  );
  app.get("/api/knowledge", async (req, res) => {
    const options = parse(schemas.list, req.query);
    const conditions = [activeWhere];
    const values = [];
    for (const field of ["machine", "station", "product"])
      if (options[field]) {
        conditions.push(`k.${field}=?`);
        values.push(options[field]);
      }
    if (options.q) {
      conditions.push("(k.error_code LIKE ? OR k.title LIKE ?)");
      values.push(`%${options.q}%`, `%${options.q}%`);
    }
    res.json(
      await paginate(
        `${knowledgeSelect} WHERE ${conditions.join(" AND ")}`,
        values,
        options,
        knowledgeView,
      ),
    );
  });
  app.get("/api/knowledge/:id/versions", async (req, res) =>
    res.json({ data: await versions(req.params.id) }),
  );
  app.get("/api/knowledge/:id/export", async (req, res) => {
    const data = await currentKnowledge(req.params.id);
    res
      .attachment(`knowledge-${data.id}.json`)
      .json({ ...data, history: await versions(req.params.id) });
  });
  app.get("/api/knowledge/:id", async (req, res) =>
    res.json({ data: await currentKnowledge(req.params.id) }),
  );
  app.post("/api/retrievals", async (req, res) => {
    const input = parse(schemas.retrieval, req.body);
    const cards = await retrieve(input.query, input.scope);
    res.json({ data: { cards, requiresEngineer: cards.length === 0 } });
  });
  app.use("/api", meetingRoutes, fieldRoutes, filesRoutes);
  app.use((req, _res, next) => {
    assert(false, "Không tìm thấy API.", 404, "NOT_FOUND");
    next();
  });
  app.use((error, req, res, _next) => {
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
    res
      .status(status)
      .json({
        error: {
          code,
          message,
          ...(error.details ? { details: error.details } : {}),
        },
        requestId: req.requestId,
      });
  });
  return app;
}
