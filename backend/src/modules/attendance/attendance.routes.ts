import express from "express";
import {
  markAttendance,
  getClassAttendance,
  getStudentAttendance,
  getAttendanceReport,
} from "./attendance.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = express.Router();

router.post("/mark", authMiddleware, resolveTenant, markAttendance);
router.get("/class", authMiddleware, resolveTenant, getClassAttendance);
router.get("/student", authMiddleware, resolveTenant, getStudentAttendance);
router.get("/report", authMiddleware, resolveTenant, getAttendanceReport);

export default router;