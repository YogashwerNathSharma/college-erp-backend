

import express from "express";
import { getStats, getDeptChart, getOverview, getRecent, getLeaves } from "./dashboard.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = express.Router();

// GET DASHBOARD STATS
router.get("/stats", authMiddleware, resolveTenant, getStats);

// GET DEPARTMENT CHART DATA
router.get("/department-chart", authMiddleware, resolveTenant, getDeptChart);

// GET MONTHLY OVERVIEW
router.get("/overview", authMiddleware, resolveTenant, getOverview);

// GET RECENT TEACHERS
router.get("/recent", authMiddleware, resolveTenant, getRecent);

// GET RECENT LEAVES
router.get("/leaves", authMiddleware, resolveTenant, getLeaves);

export default router;

