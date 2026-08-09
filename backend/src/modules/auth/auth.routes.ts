import { Router, Request, Response, NextFunction } from "express";
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

// Internal tenant-user registration. This endpoint is intentionally NOT public.
// Only an authenticated tenant ADMIN can create a user inside their own tenant.
const tenantAdminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "ADMIN" || !req.user.tenantId) {
    return res.status(403).json({
      success: false,
      message: "Only a tenant administrator can create users",
    });
  }
  next();
};

router.post("/register", authMiddleware, tenantAdminOnly, register);

// Protected
router.post("/change-password", authMiddleware, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
