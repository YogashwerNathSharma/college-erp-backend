import { Router } from "express";
import {
  login,
  register,
  registerTenant,
  registerSuperAdmin,
  changePassword,
  forgotPassword,    // 🔥 NEW
  resetPassword,     // 🔥 NEW
} from "./auth.controller";

import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// Public
router.post("/login", login);
router.post("/register-tenant", registerTenant);
router.post("/super-admin", registerSuperAdmin);

// Tenant/User
router.post("/register", register);

// Protected
router.post("/change-password", authMiddleware, changePassword);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
export default router;