import { Router } from "express";
import {
  getAuditLogs,
  getAuditLogDetail,
  getUserActivity,
  getLoginHistory,
  rollbackChange,
  getAuditStats,
} from "./audit.controller";

const router = Router({ mergeParams: true });

// Dashboard stats
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
