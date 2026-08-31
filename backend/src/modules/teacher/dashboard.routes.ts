

import express from "express";
import { getStats, getDeptChart, getOverview, getRecent, getLeaves } from "./dashboard.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";

const router = express.Router();

// GET DASHBOARD STATS
router.get("/stats", authMiddleware, resolveTenant, resolveAcademicYear, getStats);

// GET DEPARTMENT CHART DATA
router.get("/department-chart", authMiddleware, resolveTenant, resolveAcademicYear, getDeptChart);

// GET MONTHLY OVERVIEW
router.get("/overview", authMiddleware, resolveTenant, resolveAcademicYear, getOverview);

// GET RECENT TEACHERS
router.get("/recent", authMiddleware, resolveTenant, resolveAcademicYear, getRecent);

// GET RECENT LEAVES
router.get("/leaves", authMiddleware, resolveTenant, resolveAcademicYear, getLeaves);

export default router;

