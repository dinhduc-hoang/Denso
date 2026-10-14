import { randomUUID } from "node:crypto";
import { config } from "../config/env.js";
export const requestContext = (req, res, next) => {
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
};
