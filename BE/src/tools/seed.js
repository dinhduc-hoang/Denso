import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { pool, transaction } from "../config/database.js";
import { hashPassword } from "../utils/crypto.js";
import { buildSeedData, seedUsers } from "./seed-data.js";
import { seedAsset } from "./seed-assets.js";
import { config } from "../config/env.js";
import { uploadDirectory } from "../config/paths.js";

const encode = (value) =>
  value !== null && typeof value === "object" && !(value instanceof Date)
    ? JSON.stringify(value)
    : value;
const tableKeys = {
  users: ["id"],
  meetings: ["id"],
  reports: ["id"],
  knowledge: ["id"],
  incidents: ["id"],
  files: ["id"],
  notes: ["id"],
  knowledge_versions: ["knowledge_id", "version"],
  feedback: ["id"],
  audit_events: ["actor_id", "action", "resource_id"],
};
async function insertMissing(db, table, row) {
  const keys = tableKeys[table];
  const [existing] = await db.execute(
    `SELECT * FROM ${table} WHERE ${keys.map((key) => `${key}=?`).join(" AND ")} LIMIT 1`,
    keys.map((key) => row[key]),
  );
  if (existing.length) return { inserted: false, row: existing[0] };
  const columns = Object.keys(row);
  await db.execute(
    `INSERT INTO ${table} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`,
    columns.map((key) => encode(row[key])),
  );
  return { inserted: true, row };
}
export async function seedDatabase(password, { minimal = false } = {}) {
  if (!password || password.length < 12)
    throw new Error(
      "Set SEED_PASSWORD (at least 12 characters) before seeding.",
    );
  const data = buildSeedData();
  const createdFiles = [];
  const inserted = {};
  const retained = {};
  const save = async (db, table, row) => {
    const result = await insertMissing(db, table, row);
    const counts = result.inserted ? inserted : retained;
    counts[table] = (counts[table] ?? 0) + 1;
    return result;
  };
  if (config.FILE_STORAGE === "filesystem")
    await mkdir(uploadDirectory, { recursive: true });
  try {
    await transaction(async (db) => {
      // Serialize repeated/concurrent seed runs using the shared admin fixture row.
      for (const user of seedUsers) {
        const [existing] = await db.execute(
          "SELECT id,email,role FROM users WHERE id=? OR email=?",
          [user.id, user.email],
        );
        if (
          existing.length &&
          (existing.length !== 1 ||
            existing[0].id !== user.id ||
            existing[0].email !== user.email ||
            existing[0].role !== user.role)
        )
          throw new Error(
            `Seed identity conflict for ${user.email}; existing user was preserved.`,
          );
        await save(db, "users", {
          ...user,
          password_hash: existing.length ? "" : await hashPassword(password),
        });
        if (user.role === "admin")
          await db.execute("SELECT id FROM users WHERE id=? FOR UPDATE", [
            user.id,
          ]);
      }
      for (const row of minimal
        ? data.meetings.filter((row) => row.id === "DR-024")
        : data.meetings)
        await save(db, "meetings", row);
      if (minimal) return;
      for (const table of ["reports", "knowledge", "incidents"])
        for (const row of data[table]) await save(db, table, row);
      for (const row of data.files) {
        const bytes = seedAsset(row.mime_type);
        const result = await save(db, "files", {
          ...row,
          size_bytes: bytes.length,
        });
        if (!result.inserted && result.row.storage_name !== row.storage_name)
          continue;
        if (config.FILE_STORAGE === "mysql") {
          await db.execute(
            "INSERT INTO file_contents (file_id,content) VALUES (?,?) ON DUPLICATE KEY UPDATE file_id=file_id",
            [row.id, bytes],
          );
          continue;
        }
        const target = path.join(uploadDirectory, row.storage_name);
        try {
          await writeFile(target, bytes, { flag: "wx" });
          createdFiles.push(target);
        } catch (error) {
          if (error.code !== "EEXIST") throw error;
        }
      }
      for (const table of [
        "notes",
        "knowledge_versions",
        "feedback",
        "audit_events",
      ])
        for (const row of data[table]) await save(db, table, row);
    });
  } catch (error) {
    for (const file of createdFiles) await unlink(file).catch(() => {});
    throw error;
  }
  const totals = {};
  for (const table of Object.keys(tableKeys)) {
    const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM ${table}`);
    totals[table] = rows[0].count;
  }
  return { mode: minimal ? "minimal" : "full", inserted, retained, totals };
}
