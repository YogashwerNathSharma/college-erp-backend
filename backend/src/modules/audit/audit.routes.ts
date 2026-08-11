import { Router } from "express";
import {
  getAuditLogs,
  getAuditLogDetail,
  getUserActivity,
  getLoginHistory,
  rollbackChange,
  getAuditStats,
} from "./audit.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = Router({ mergeParams: true });

// All audit endpoints require an authenticated tenant context.
router.use(authMiddleware);
router.use(resolveTenant);

// Dashboard stats
router.get("/stats", getAuditStats);

// Login history
router.get("/login-history", getLoginHistory);

// Audit logs CRUD
router.get("/logs", getAuditLogs);
router.get("/logs/:id", getAuditLogDetail);

// User activity
router.get("/user/:userId", getUserActivity);

// Rollback is a destructive administrative operation.
router.post(
  "/rollback/:id",
  allowRoles("ADMIN", "SUPER_ADMIN"),
  rollbackChange
);

export default router;
