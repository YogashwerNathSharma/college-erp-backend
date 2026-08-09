import { Router } from "express";
import multer from "multer";

import {
  login, register, registerTenant, registerSuperAdmin,
  changePassword, forgotPassword, resetPassword,
} from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowInitialSuperAdminSetup } from "./super-admin-bootstrap.middleware";

const router = Router();

// Upload config
const upload = multer({ storage: multer.memoryStorage() });

// Public
router.post("/login", login);

// WITH multer — logo + background upload support
router.post(
  "/register-tenant",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "background", maxCount: 1 },
  ]),
  registerTenant
);

// One-time bootstrap only: once a SUPER_ADMIN exists, this endpoint is closed.
router.post("/super-admin", allowInitialSuperAdminSetup, registerSuperAdmin);
router.post("/register", register);

// Protected
router.post("/change-password", authMiddleware, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
