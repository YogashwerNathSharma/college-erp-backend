import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  getUserManagementStats,
  getAdminUsers,
  getAdminUserById,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  bulkDeleteAdminUsers,
  bulkUpdateStatus,
  resetPassword,
  toggle2FA,
  getLoginHistory,
  getActiveSessions,
  revokeSession,
  revokeAllUserSessions,
  getUserActivity,
} from "./user-management.controller";

const router = Router();

// All routes require SUPER_ADMIN
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

// Stats
router.get("/stats", getUserManagementStats);

// CRUD
router.get("/", getAdminUsers);
router.get("/:id", getAdminUserById);
router.post("/", createAdminUser);
router.put("/:id", updateAdminUser);
router.delete("/:id", deleteAdminUser);

// Bulk operations
router.post("/bulk/delete", bulkDeleteAdminUsers);
router.post("/bulk/status", bulkUpdateStatus);

// Password & 2FA
router.post("/:id/reset-password", resetPassword);
router.post("/:id/toggle-2fa", toggle2FA);

// Login history
router.get("/:id/login-history", getLoginHistory);

// Sessions
router.get("/:id/sessions", getActiveSessions);
router.delete("/:id/sessions/:sessionId", revokeSession);
router.delete("/:id/sessions", revokeAllUserSessions);

// Activity log
router.get("/:id/activity", getUserActivity);

export default router;
