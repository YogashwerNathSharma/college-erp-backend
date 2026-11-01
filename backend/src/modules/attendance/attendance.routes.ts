
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
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";
import { requirePermission } from "../../middleware/permission.middleware";

const router = express.Router();

// GET /api/attendance/dashboard?academicYearId= — Dashboard stats
router.get("/dashboard", authMiddleware, requirePermission("attendance.view"), resolveTenant, resolveAcademicYear, getDashboardStats);

// POST /api/attendance/mark — Bulk mark attendance (first time)
router.post("/mark", authMiddleware, requirePermission("attendance.mark"), resolveTenant, resolveAcademicYear, markAttendance);

// PUT /api/attendance/update — Edit/update existing attendance
router.put("/update", authMiddleware, requirePermission("attendance.mark"), resolveTenant, resolveAcademicYear, updateAttendance);

// GET /api/attendance/class?classId=&sectionId=&date= — Get class attendance for a date
router.get("/class", authMiddleware, requirePermission("attendance.view"), resolveTenant, resolveAcademicYear, getClassAttendance);

// GET /api/attendance/student?studentId= — Student attendance history
router.get("/student", authMiddleware, requirePermission("attendance.view"), resolveTenant, resolveAcademicYear, getStudentAttendance);

// GET /api/attendance/report?studentId=&month=&year= — Monthly report
router.get("/report", authMiddleware, requirePermission("attendance.view"), resolveTenant, resolveAcademicYear, getAttendanceReport);

// GET /api/attendance/summary?studentId=&academicYearId= — Year summary (for report card)
router.get("/summary", authMiddleware, requirePermission("attendance.view"), resolveTenant, resolveAcademicYear, getAttendanceSummary);

export default router;

