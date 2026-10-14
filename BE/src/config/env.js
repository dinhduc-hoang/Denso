import "dotenv/config";
import { z } from "zod";

const env = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    HOST: z.string().default("127.0.0.1"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DB_HOST: z.string().default("127.0.0.1"),
    DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
    DB_USER: z.string().default("root"),
    DB_PASSWORD: z.string().default(""),
    DB_SSL: z.enum(["true", "false"]).default("false"),
    DB_SSL_CA: z.string().default(""),
    FILE_STORAGE: z.enum(["filesystem", "mysql"]).default("filesystem"),
    SERVE_FRONTEND: z.enum(["true", "false"]).default("false"),
    TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
    DB_NAME: z
      .string()
      .regex(/^[a-zA-Z0-9_]+$/)
      .default("denso_shopfloor"),
    SESSION_HOURS: z.coerce.number().positive().max(168).default(8),
    UPLOAD_MAX_MB: z.coerce.number().positive().max(100).default(20),
    CORS_ORIGINS: z
      .string()
      .default("http://127.0.0.1:5173,http://localhost:5173"),
  })
  .parse(process.env);

export const config = {
  ...env,
  origins: env.CORS_ORIGINS.split(",").map((x) => x.trim()),
};
