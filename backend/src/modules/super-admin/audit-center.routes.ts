// ═══════════════════════════════════════════════════════════
// AUDIT CENTER ROUTES
// ═══════════════════════════════════════════════════════════

import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import * as controller from "./audit-center.controller";

const router = express.Router();

// 🔐 All routes require SUPER_ADMIN
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

// 📊 Stats & Analytics
router.get("/stats", controller.getStats);
router.get("/timeline", controller.getTimeline);

// 📋 Logs CRUD
router.get("/logs", controller.getLogs);
router.get("/logs/:id", controller.getLogById);

// 🗑️ Bulk Operations
router.post("/bulk-delete", controller.bulkDelete);

// 📤 Export
router.post("/export", controller.exportLogs);

// 🔍 Filter Options
router.get("/users", controller.getUsers);
router.get("/actions", controller.getActions);

export default router;
