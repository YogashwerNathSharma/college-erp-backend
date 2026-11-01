import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  getMyPermittedModules,
  assignModules,
  getModulesTenantStatus,
} from "./tenant-modules.controller";

// ═══════════════════════════════════════════════════════════
// TENANT MODULE ROUTES
// ═══════════════════════════════════════════════════════════

const router = express.Router();

// 🔓 Tenant-facing (any authenticated user can check their modules)
router.get("/permitted", authMiddleware, getMyPermittedModules);

// 🔐 Super Admin only
router.post("/assign", authMiddleware, allowRoles("SUPER_ADMIN"), assignModules);
router.get("/tenant-status/:tenantId", authMiddleware, allowRoles("SUPER_ADMIN"), getModulesTenantStatus);

export default router;
