import { Router } from "express";
import multer from "multer";
import { login, register, registerTenant, registerSuperAdmin, changePassword, forgotPassword, resetPassword } from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowInitialSuperAdminSetup } from "./super-admin-bootstrap.middleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/login", login);

// Existing public school/college signup flow.
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

// Protected tenant user creation. Tenant ID comes from the authenticated JWT.
router.post("/register", authMiddleware, register);

router.post("/change-password", authMiddleware, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
