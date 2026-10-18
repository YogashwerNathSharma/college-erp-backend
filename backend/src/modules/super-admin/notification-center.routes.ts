// ═══════════════════════════════════════════════════════════
// NOTIFICATION CENTER ROUTES
// ═══════════════════════════════════════════════════════════

import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import * as controller from "./notification-center.controller";

const router = express.Router();

// 🔐 All routes require SUPER_ADMIN
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

// 📊 Stats & Analytics
router.get("/stats", controller.getStats);
router.get("/analytics", controller.getAnalytics);

// 📨 Notifications
router.get("/notifications", controller.getNotifications);
router.post("/send", controller.sendNotification);

// 📋 Templates
router.get("/templates", controller.getTemplates);
router.get("/templates/:id", controller.getTemplateById);
router.post("/templates", controller.createTemplate);
router.put("/templates/:id", controller.updateTemplate);
router.delete("/templates/:id", controller.deleteTemplate);

// 📢 Broadcast
router.post("/broadcast", controller.sendBroadcast);

// ⏰ Scheduled
router.get("/scheduled", controller.getScheduled);
router.delete("/scheduled/:id", controller.cancelScheduled);

export default router;
