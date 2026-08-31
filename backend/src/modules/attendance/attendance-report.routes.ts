

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
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";

const router = express.Router();

// GET /api/attendance/report/monthly?classId=&sectionId=&month=&year=
router.get("/monthly", authMiddleware, resolveTenant, resolveAcademicYear, getMonthlyReport);

// GET /api/attendance/report/datewise?classId=&sectionId=&date=
router.get("/datewise", authMiddleware, resolveTenant, resolveAcademicYear, getDatewiseReport);

// GET /api/attendance/report/yearly?classId=&sectionId=&year=
router.get("/yearly", authMiddleware, resolveTenant, resolveAcademicYear, getYearlyReport);

// GET /api/attendance/report/classwise?classId=&sectionId=
router.get("/classwise", authMiddleware, resolveTenant, resolveAcademicYear, getClasswiseReport);

// GET /api/attendance/report/school?month=&year=
router.get("/school", authMiddleware, resolveTenant, resolveAcademicYear, getSchoolReport);

export default router;
