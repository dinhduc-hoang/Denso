import { config } from "./env.js";

export const databaseOptions = {
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  charset: "utf8mb4",
  connectTimeout: 10000,
  ...(config.DB_SSL === "true"
    ? {
        ssl: {
          ...(config.DB_SSL_CA
            ? { ca: config.DB_SSL_CA.replaceAll("\\n", "\n") }
            : {}),
          rejectUnauthorized: true,
          verifyIdentity: true,
        },
      }
    : {}),
};
