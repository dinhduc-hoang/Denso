import { ApiError } from "../utils/errors.js";
import { tokenHash } from "../utils/crypto.js";
import { sessionUser } from "../services/auth.js";
export async function authenticate(req, _res, next) {
  const token = req.headers.authorization?.match(
    /^Bearer ([a-f0-9]{64})$/,
  )?.[1];
  if (!token) throw new ApiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập.");
  req.user = await sessionUser(tokenHash(token));
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
