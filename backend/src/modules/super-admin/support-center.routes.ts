// ═══════════════════════════════════════════════════════════
// SUPPORT CENTER ROUTES
// ═══════════════════════════════════════════════════════════

import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import * as controller from "./support-center.controller";

const router = express.Router();

// 🔐 All routes require SUPER_ADMIN
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

// 📊 Stats
router.get("/tickets/stats", controller.getTicketStats);

// 🎫 Tickets
router.get("/tickets", controller.getTickets);
router.get("/tickets/:id", controller.getTicketById);
router.post("/tickets", controller.createTicket);
router.put("/tickets/:id", controller.updateTicket);
router.patch("/tickets/:id/assign", controller.assignTicket);
router.patch("/tickets/:id/resolve", controller.resolveTicket);
router.post("/tickets/:id/comments", controller.addComment);

// 📚 Knowledge Base
router.get("/kb", controller.getKBArticles);
router.get("/kb/recycle-bin", controller.getDeletedKBArticles);
router.get("/kb/:id", controller.getKBArticleById);
router.post("/kb", controller.createKBArticle);
router.put("/kb/:id", controller.updateKBArticle);
router.delete("/kb/:id", controller.deleteKBArticle);
router.patch("/kb/:id/restore", controller.restoreKBArticle);

// 📢 Announcements
router.get("/announcements", controller.getAnnouncements);
router.get("/announcements/recycle-bin", controller.getDeletedAnnouncements);
router.post("/announcements", controller.createAnnouncement);
router.put("/announcements/:id", controller.updateAnnouncement);
router.delete("/announcements/:id", controller.deleteAnnouncement);
router.patch("/announcements/:id/restore", controller.restoreAnnouncement);

// 🔧 Maintenance Mode
router.get("/maintenance", controller.getMaintenanceStatus);
router.post("/maintenance", controller.toggleMaintenance);

// 🖥️ System Status
router.get("/system-status", controller.getSystemStatus);

export default router;
