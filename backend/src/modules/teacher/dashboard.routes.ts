import express from "express";
import { getDashboard, getStats, getDeptChart, getOverview, getRecent, getLeaves } from "./dashboard.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";

const router = express.Router();

// Full dashboard endpoint consumed by TeacherDashboard.tsx
router.get("/dashboard", authMiddleware, resolveTenant, resolveAcademicYear, getDashboard);

// Individual dashboard endpoints retained for compatibility
router.get("/stats", authMiddleware, resolveTenant, resolveAcademicYear, getStats);
router.get("/department-chart", authMiddleware, resolveTenant, resolveAcademicYear, getDeptChart);
router.get("/overview", authMiddleware, resolveTenant, resolveAcademicYear, getOverview);
router.get("/recent", authMiddleware, resolveTenant, resolveAcademicYear, getRecent);
router.get("/leaves", authMiddleware, resolveTenant, resolveAcademicYear, getLeaves);

export default router;
