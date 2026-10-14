import { randomBytes, randomUUID } from "node:crypto";
import { config } from "../config/env.js";
import { ApiError } from "../utils/errors.js";
import { hashPassword, verifyPassword, tokenHash } from "../utils/crypto.js";
import * as authModel from "../models/auth.js";
const publicUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
});
const dummyHash = await hashPassword(randomUUID());
export async function signIn(email, password) {
  const rows = await authModel.findActiveUser(email.toLowerCase());
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
  await authModel.createSession(tokenHash(token), rows[0].id, expiresAt);
  return {
    token,
    user: publicUser(rows[0]),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function sessionUser(hash) {
  const row = await authModel.findSessionUser(hash);
  if (!row)
    throw new ApiError(401, "UNAUTHENTICATED", "Phiên đăng nhập đã hết hạn.");
  return publicUser(row);
}
export const signOut = (hash) => authModel.deleteSession(hash);
