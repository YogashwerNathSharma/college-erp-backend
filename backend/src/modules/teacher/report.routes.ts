

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

const router = express.Router();

// TEACHER LIST REPORT
router.get("/teacher-list", authMiddleware, resolveTenant, teacherList);

// ATTENDANCE REPORT
router.get("/attendance", authMiddleware, resolveTenant, attendance);

// LEAVE REPORT
router.get("/leave", authMiddleware, resolveTenant, leave);

// SALARY REPORT
router.get("/salary", authMiddleware, resolveTenant, salary);

// PERFORMANCE REPORT
router.get("/performance", authMiddleware, resolveTenant, performance);

// SUBJECT ASSIGNMENT REPORT
router.get("/subject-assignment", authMiddleware, resolveTenant, subjectAssignment);

export default router;

