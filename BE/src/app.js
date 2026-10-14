import express from "express";
import cors from "cors";
import helmet from "helmet";
import { fileURLToPath } from "node:url";
import { config } from "./config/env.js";
import { createApiRoutes } from "./routes/index.js";
import { requestContext } from "./middlewares/request-context.js";
import { notFound, errorHandler } from "./middlewares/error-handler.js";
export function createApp({
  serveFrontend = config.SERVE_FRONTEND === "true",
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  if (config.TRUST_PROXY) app.set("trust proxy", config.TRUST_PROXY);
  app.use(requestContext);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "img-src": ["'self'", "data:", "blob:"],
          "upgrade-insecure-requests":
            config.NODE_ENV === "production" ? [] : null,
        },
      },
    }),
  );
  app.use(
    cors({
      origin: (origin, cb) =>
        cb(null, !origin || config.origins.includes(origin)),
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", createApiRoutes());
  if (serveFrontend) {
    const frontendDirectory = fileURLToPath(
      new URL("../../FE/dist/", import.meta.url),
    );
    const serveStatic = express.static(frontendDirectory, { dotfiles: "deny" });
    app.use((req, res, next) => {
      if (req.path === "/api" || req.path.startsWith("/api/")) return next();
      return serveStatic(req, res, next);
    });
  }
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
