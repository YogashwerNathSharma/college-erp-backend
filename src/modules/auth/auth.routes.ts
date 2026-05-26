import { Router } from "express";
import {
  login,
  register,
  registerTenant,
} from "./auth.controller";

const router = Router();

// 🔓 Public routes
router.post("/register-tenant", registerTenant); // onboarding
router.post("/login", login);
router.post("/register", register); // inside tenant

export default router;