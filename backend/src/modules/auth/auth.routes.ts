import { Router } from "express";
import multer from "multer";
import { login, register, registerTenant, registerSuperAdmin, changePassword, forgotPassword, resetPassword } from "./auth.controller";
import { acceptTenantAgreement, getTenantAgreementStatus } from "./tenantAgreement.controller";
import { requireTenantAgreementAcceptance } from "./tenantAgreementRegistration.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowInitialSuperAdminSetup } from "./super-admin-bootstrap.middleware";
import { refreshTokenHandler } from "./auth.refresh";
import { getPortalConfig, getAllPortalTypes } from "./portal.service";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/login", login);

// Refresh token endpoint
router.post("/refresh-token", refreshTokenHandler);

// Public tenant signup: the current SaaS agreement is mandatory before the
// tenant/admin creation endpoint can execute.
router.post(
  "/register-tenant",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "background", maxCount: 1 },
  ]),
  requireTenantAgreementAcceptance,
  registerTenant
);

// Tenant SaaS agreement: public acceptance is tied to a verified tenant admin.
router.get("/tenant-agreement/status", getTenantAgreementStatus);
router.post("/tenant-agreement/accept", acceptTenantAgreement);

// One-time bootstrap only: once a SUPER_ADMIN exists, this endpoint is closed.
router.post("/super-admin", allowInitialSuperAdminSetup, registerSuperAdmin);

// Protected tenant user creation. Tenant ID comes from the authenticated JWT.
router.post("/register", authMiddleware, register);

router.post("/change-password", authMiddleware, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Portal config — returns sidebar menu + features for current user's role
router.get("/portal-config", authMiddleware, (req, res) => {
  const role = req.user?.role;
  if (!role) return res.status(401).json({ success: false, message: "Unauthorized" });
  const portal = getPortalConfig(role);
  return res.json({ success: true, data: portal });
});

// All portal types — Super Admin only
router.get("/portal-types", authMiddleware, (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") return res.status(403).json({ success: false, message: "Forbidden" });
  return res.json({ success: true, data: getAllPortalTypes() });
});

export default router;
