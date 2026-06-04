
import { Router } from "express";
import {
  getSettings,
  updateTenantSettings,
  updateProfile,
} from "./settings.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = Router();

// 🔒 Only ADMIN of the tenant can access these
router.use(authMiddleware, resolveTenant, allowRoles("ADMIN"));

// Get tenant settings (tenant info + profile + usage)
router.get("/", getSettings);

// Update tenant branding/info (name, logo, address, etc.)
router.put("/", updateTenantSettings);

// Update admin profile (name, email, password)
router.put("/profile", updateProfile);

export default router;

