import { rateLimit } from "express-rate-limit";
export const createLoginLimit = () =>
  rateLimit({
    windowMs: 15 * 60000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({
        error: { code: "RATE_LIMITED", message: "Thử lại sau." },
        requestId: req.requestId,
      }),
  });
