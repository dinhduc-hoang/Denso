import mysql from "mysql2/promise";
import { readFile, readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { config } from "../src/config/env.js";
import { databaseOptions } from "../src/config/database-options.js";

export async function migrateDatabase() {
  const connection = await mysql.createConnection(databaseOptions);
  const lockName = `denso-migrate-${config.DB_NAME}`.slice(0, 64);
  let locked = false;
  try {
    const [locks] = await connection.execute(
      "SELECT GET_LOCK(?,60) AS acquired",
      [lockName],
    );
    if (locks[0].acquired !== 1)
      throw new Error("Database migration is busy; retry deployment.");
    locked = true;
    try {
      await connection.query(`USE \`${config.DB_NAME}\``);
    } catch (error) {
      if (error.code !== "ER_BAD_DB_ERROR") throw error;
      await connection.query(
        `CREATE DATABASE \`${config.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      );
      await connection.query(`USE \`${config.DB_NAME}\``);
    }
    await connection.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(100) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
    );
    const directory = new URL("../migrations/", import.meta.url);
    const files = (await readdir(directory))
      .filter((name) => /^\d+_[a-z0-9_]+\.sql$/.test(name))
      .sort();
    for (const name of files) {
      const version = name.replace(/\.sql$/, "");
      const [applied] = await connection.execute(
        "SELECT version FROM schema_migrations WHERE version = ?",
        [version],
      );
      if (!applied.length) {
        const sql = await readFile(new URL(name, directory), "utf8");
        for (const statement of sql
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean))
          await connection.query(statement);
        await connection.execute(
          "INSERT INTO schema_migrations (version) VALUES (?)",
          [version],
        );
      }
    }
    console.log("Database migration complete.");
  } finally {
    if (locked)
      await connection
        .execute("SELECT RELEASE_LOCK(?)", [lockName])
        .catch(() => {});
    await connection.end();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await migrateDatabase();
