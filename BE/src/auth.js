import {
  randomBytes,
  scrypt,
  timingSafeEqual,
  createHash,
  randomUUID,
} from "node:crypto";
import { promisify } from "node:util";
import { pool } from "./db.js";
import { config } from "./config.js";
import { ApiError } from "./errors.js";

const derive = promisify(scrypt);
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password, hash) {
  const [salt, encoded] = hash.split(":");
  const key = await derive(password, salt, 64);
  const expected = Buffer.from(encoded, "hex");
  return expected.length === key.length && timingSafeEqual(expected, key);
}
export const tokenHash = (value) =>
  createHash("sha256").update(value).digest("hex");
const publicUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
});
const dummyHash = await hashPassword(randomUUID());
export async function signIn(email, password) {
  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE email = ? AND active = TRUE",
    [email.toLowerCase()],
  );
  const valid = await verifyPassword(
    password,
    rows[0]?.password_hash || dummyHash,
  );
  if (!rows.length || !valid)
    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      "Email hoặc mật khẩu không đúng.",
    );
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + config.SESSION_HOURS * 3600000);
  await pool.execute(
    "INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)",
    [tokenHash(token), rows[0].id, expiresAt],
  );
  return {
    token,
    user: publicUser(rows[0]),
    expiresAt: expiresAt.toISOString(),
  };
}
export async function authenticate(req, _res, next) {
  const token = req.headers.authorization?.match(
    /^Bearer ([a-f0-9]{64})$/,
  )?.[1];
  if (!token) throw new ApiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập.");
  const [rows] = await pool.execute(
    "SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP(3) AND u.active=TRUE",
    [tokenHash(token)],
  );
  if (!rows.length)
    throw new ApiError(401, "UNAUTHENTICATED", "Phiên đăng nhập đã hết hạn.");
  req.user = publicUser(rows[0]);
  req.tokenHash = tokenHash(token);
  next();
}
export const allow =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role) && req.user.role !== "admin")
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Vai trò này không được phép thực hiện thao tác.",
      );
    next();
  };
