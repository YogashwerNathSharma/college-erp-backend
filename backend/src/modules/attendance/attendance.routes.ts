
import express from "express";
import {
  getDashboardStats,
  markAttendance,
  updateAttendance,
  getClassAttendance,
  getStudentAttendance,
  getAttendanceReport,
  getAttendanceSummary,
} from "./attendance.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = express.Router();

// GET /api/attendance/dashboard?academicYearId= — Dashboard stats
router.get("/dashboard", authMiddleware, resolveTenant, getDashboardStats);

// POST /api/attendance/mark — Bulk mark attendance (first time)
router.post("/mark", authMiddleware, resolveTenant, markAttendance);

// PUT /api/attendance/update — Edit/update existing attendance
router.put("/update", authMiddleware, resolveTenant, updateAttendance);

// GET /api/attendance/class?classId=&sectionId=&date= — Get class attendance for a date
router.get("/class", authMiddleware, resolveTenant, getClassAttendance);

// GET /api/attendance/student?studentId= — Student attendance history
router.get("/student", authMiddleware, resolveTenant, getStudentAttendance);

// GET /api/attendance/report?studentId=&month=&year= — Monthly report
router.get("/report", authMiddleware, resolveTenant, getAttendanceReport);

// GET /api/attendance/summary?studentId=&academicYearId= — Year summary (for report card)
router.get("/summary", authMiddleware, resolveTenant, getAttendanceSummary);

export default router;

