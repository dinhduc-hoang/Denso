import { pool } from "../config/database.js";
export async function health(_req, res) {
  await pool.query("SELECT 1");
  res.json({ data: { status: "ok", database: "mysql" } });
}
