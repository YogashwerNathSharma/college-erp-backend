// ═══════════════════════════════════════════════════════════
// REPORT CENTER ROUTES
// ═══════════════════════════════════════════════════════════

import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import * as controller from "./report-center.controller";

const router = express.Router();

// 🔐 All routes require SUPER_ADMIN
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

// 📊 Reports
router.get("/revenue", controller.getRevenueReport);
router.get("/tenants", controller.getTenantReport);
router.get("/usage", controller.getUsageReport);
router.get("/login", controller.getLoginReport);
router.get("/subscription", controller.getSubscriptionReport);
router.get("/system", controller.getSystemReport);

// 📤 Export
router.post("/export", controller.exportReport);

export default router;
