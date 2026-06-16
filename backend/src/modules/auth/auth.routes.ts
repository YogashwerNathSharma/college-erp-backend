import { Router } from "express";
import multer from "multer";

import {
  login, register, registerTenant, registerSuperAdmin,
  changePassword, forgotPassword, resetPassword,
} from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// Upload config
const upload = multer({ dest: "uploads/" });

// Public
router.post("/login", login);

// 🔥 WITH multer — logo + background upload support
router.post(
  "/register-tenant",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "background", maxCount: 1 },
  ]),
  registerTenant
);

router.post("/super-admin", registerSuperAdmin);
router.post("/register", register);

// Protected
router.post("/change-password", authMiddleware, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;