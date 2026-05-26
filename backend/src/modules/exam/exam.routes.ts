import express from "express";
import {
  createExam,
  addExamSubject,
  enterMarks,
  getResult,
} from "./exam.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = express.Router();

// 🎯 Create exam (only ADMIN / SUPER_ADMIN)
router.post(
  "/",
  authMiddleware,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  resolveTenant,
  createExam
);

// 🎯 Add subject to exam
router.post(
  "/subject",
  authMiddleware,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  resolveTenant,
  addExamSubject
);

// 🎯 Enter marks (teacher/admin)
router.post(
  "/marks",
  authMiddleware,
  allowRoles("ADMIN", "TEACHER", "SUPER_ADMIN"),
  resolveTenant,
  enterMarks
);

// 🎯 Get result (all logged users)
router.get(
  "/result",
  authMiddleware,
  resolveTenant,
  getResult
);

export default router;