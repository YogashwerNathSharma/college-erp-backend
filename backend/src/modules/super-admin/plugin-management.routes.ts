import express from "express";
import {
  getAllPlugins,
  getPluginById,
  createPlugin,
  updatePlugin,
  deletePlugin,
  togglePluginStatus,
  updatePluginConfig,
  updatePluginPermissions,
  getPluginActivityLogs,
  checkPluginUpdates,
  applyPluginUpdate,
  getPluginStore,
} from "./plugin-management.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

// ══════════════════════════════════════════════════════
// PLUGIN MANAGEMENT ROUTES
// ══════════════════════════════════════════════════════

const router = express.Router();

// 🔐 All routes require SUPER_ADMIN
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

//////////////////////////////////////////////////////
// 🧩 PLUGIN CRUD
//////////////////////////////////////////////////////

router.get("/", getAllPlugins);
router.get("/store", getPluginStore);
router.get("/check-updates", checkPluginUpdates);
router.get("/:id", getPluginById);
router.post("/", createPlugin);
router.put("/:id", updatePlugin);
router.delete("/:id", deletePlugin);

//////////////////////////////////////////////////////
// ⚡ PLUGIN ACTIONS
//////////////////////////////////////////////////////

router.patch("/:id/toggle-status", togglePluginStatus);
router.patch("/:id/config", updatePluginConfig);
router.patch("/:id/permissions", updatePluginPermissions);
router.patch("/:id/apply-update", applyPluginUpdate);
router.get("/:id/activity-logs", getPluginActivityLogs);

export default router;
