

import express from "express";
import {
  teacherList,
  attendance,
  leave,
  salary,
  performance,
  subjectAssignment,
} from "./report.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";

const router = express.Router();

// TEACHER LIST REPORT
router.get("/teacher-list", authMiddleware, resolveTenant, resolveAcademicYear, teacherList);

// ATTENDANCE REPORT
router.get("/attendance", authMiddleware, resolveTenant, resolveAcademicYear, attendance);

// LEAVE REPORT
router.get("/leave", authMiddleware, resolveTenant, resolveAcademicYear, leave);

// SALARY REPORT
router.get("/salary", authMiddleware, resolveTenant, resolveAcademicYear, salary);

// PERFORMANCE REPORT
router.get("/performance", authMiddleware, resolveTenant, resolveAcademicYear, performance);

// SUBJECT ASSIGNMENT REPORT
router.get("/subject-assignment", authMiddleware, resolveTenant, resolveAcademicYear, subjectAssignment);

export default router;

