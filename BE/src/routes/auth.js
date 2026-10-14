import { Router } from "express";
import { createLoginLimit } from "../middlewares/login-limit.js";
import * as controller from "../controllers/auth.js";
export function createPublicAuthRoutes() {
  const routes = Router();
  routes.post("/auth/login", createLoginLimit(), controller.login);
  return routes;
}
export const authRoutes = Router();
authRoutes.get("/auth/me", controller.me);
authRoutes.post("/auth/logout", controller.logout);
