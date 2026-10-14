import { parse } from "../utils/errors.js";
import { login as loginSchema } from "../utils/schemas.js";
import { signIn, signOut } from "../services/auth.js";
export async function login(req, res) {
  const input = parse(loginSchema, req.body);
  res.json({ data: await signIn(input.email, input.password) });
}
export function me(req, res) {
  res.json({ data: req.user });
}
export async function logout(req, res) {
  await signOut(req.tokenHash);
  res.status(204).end();
}
