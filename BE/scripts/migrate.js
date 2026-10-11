import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
import { config } from "../src/config.js";

const connection = await mysql.createConnection({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  charset: "utf8mb4",
});
try {
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.query(`USE \`${config.DB_NAME}\``);
  await connection.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(100) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
  );
  const [applied] = await connection.execute(
    "SELECT version FROM schema_migrations WHERE version = ?",
    ["001_initial"],
  );
  if (!applied.length) {
    const sql = await readFile(
      new URL("../migrations/001_initial.sql", import.meta.url),
      "utf8",
    );
    for (const statement of sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean))
      await connection.query(statement);
    await connection.execute(
      "INSERT INTO schema_migrations (version) VALUES (?)",
      ["001_initial"],
    );
  }
  console.log("Database migration complete.");
} finally {
  await connection.end();
}
