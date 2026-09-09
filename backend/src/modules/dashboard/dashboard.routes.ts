import express from "express";
import { getDashboardPerformance } from "./dashboard.performance.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";

const router = express.Router();

// Performance controller keeps the same auth/tenant/academic-year middleware
// and response contract as the previous dashboard endpoint.
router.get("/", authMiddleware, resolveTenant, resolveAcademicYear, getDashboardPerformance);

export default router;
