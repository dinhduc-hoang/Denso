import { pool } from "../config/database.js";
export async function findActiveUser(email) {
  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE email = ? AND active = TRUE",
    [email],
  );
  return rows;
}
export async function createSession(hash, userId, expiresAt) {
  await pool.execute(
    "INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)",
    [hash, userId, expiresAt],
  );
}
export async function findSessionUser(hash) {
  const [rows] = await pool.execute(
    "SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP(3) AND u.active=TRUE",
    [hash],
  );
  return rows[0];
}
export async function deleteSession(hash) {
  await pool.execute("DELETE FROM sessions WHERE token_hash=?", [hash]);
}
