import { Router } from "express";
import {
  getAuditLogs,
  getAuditLogDetail,
  getUserActivity,
  getLoginHistory,
  rollbackChange,
  getAuditStats,
} from "./audit.controller";

import { authMiddleware } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';

const router = Router({ mergeParams: true });

// Dashboard stats
router.use(authMiddleware);
router.use(resolveTenant);

router.get("/stats", getAuditStats);

// Login history
router.get("/login-history", getLoginHistory);

// Audit logs CRUD
router.get("/logs", getAuditLogs);
router.get("/logs/:id", getAuditLogDetail);

// User activity
router.get("/user/:userId", getUserActivity);

// Rollback action
router.post("/rollback/:id", rollbackChange);

export default router;
