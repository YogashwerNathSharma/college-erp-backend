

import express from "express";
import {
  getMonthlyReport,
  getDatewiseReport,
  getYearlyReport,
  getClasswiseReport,
  getSchoolReport,
} from "./attendance-report.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = express.Router();

// GET /api/attendance/report/monthly?classId=&sectionId=&month=&year=
router.get("/monthly", authMiddleware, resolveTenant, getMonthlyReport);

// GET /api/attendance/report/datewise?classId=&sectionId=&date=
router.get("/datewise", authMiddleware, resolveTenant, getDatewiseReport);

// GET /api/attendance/report/yearly?classId=&sectionId=&year=
router.get("/yearly", authMiddleware, resolveTenant, getYearlyReport);

// GET /api/attendance/report/classwise?classId=&sectionId=
router.get("/classwise", authMiddleware, resolveTenant, getClasswiseReport);

// GET /api/attendance/report/school?month=&year=
router.get("/school", authMiddleware, resolveTenant, getSchoolReport);

export default router;
