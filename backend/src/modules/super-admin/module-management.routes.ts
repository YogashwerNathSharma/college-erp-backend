import express from "express";
import {
  getAllModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  toggleModuleStatus,
  installModule,
  uninstallModule,
  toggleModuleForTenant,
  moduleHealthCheck,
  getModuleMarketplace,
} from "./module-management.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

// ══════════════════════════════════════════════════════
// MODULE MANAGEMENT ROUTES
// ══════════════════════════════════════════════════════

const router = express.Router();

// 🔐 All routes require SUPER_ADMIN
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

//////////////////////////////////////////////////////
// 📦 MODULE CRUD
//////////////////////////////////////////////////////

router.get("/", getAllModules);
router.get("/marketplace", getModuleMarketplace);
router.get("/:id", getModuleById);
router.post("/", createModule);
router.put("/:id", updateModule);
router.delete("/:id", deleteModule);

//////////////////////////////////////////////////////
// ⚡ MODULE ACTIONS
//////////////////////////////////////////////////////

router.patch("/:id/toggle-status", toggleModuleStatus);
router.patch("/:id/install", installModule);
router.patch("/:id/uninstall", uninstallModule);
router.patch("/:id/tenant-toggle", toggleModuleForTenant);
router.get("/:id/health-check", moduleHealthCheck);

export default router;
