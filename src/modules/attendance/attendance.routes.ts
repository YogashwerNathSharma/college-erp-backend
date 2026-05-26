import express from "express";
import {
  markAttendance,
  getClassAttendance,
  getStudentAttendance,
  getAttendanceReport,
} from "./attendance.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = express.Router();

router.post("/mark", authMiddleware, markAttendance);
router.get("/class", authMiddleware, getClassAttendance);
router.get("/student", authMiddleware, getStudentAttendance);
router.get("/report", authMiddleware, getAttendanceReport);

export default router;