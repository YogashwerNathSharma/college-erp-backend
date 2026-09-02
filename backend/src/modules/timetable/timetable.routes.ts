import express from "express";
import {
  createTimetable,
  getTimetable,
  deleteTimetableEntry,
  getTeachersBySubject,
  autoGenerateTimetable,
  bulkGenerateTimetable,
  clearTimetable,
  bulkClearTimetable,
  bulkSaveTimetable,
} from "./timetable.academicYear.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";

const router = express.Router();

router.get("/teachers-by-subject/:subjectId", authMiddleware, resolveTenant, resolveAcademicYear, getTeachersBySubject);
router.post("/auto-generate", authMiddleware, resolveTenant, resolveAcademicYear, autoGenerateTimetable);
router.post("/bulk-generate", authMiddleware, resolveTenant, resolveAcademicYear, bulkGenerateTimetable);
router.post("/bulk", authMiddleware, resolveTenant, resolveAcademicYear, bulkSaveTimetable);
router.post("/clear", authMiddleware, resolveTenant, resolveAcademicYear, clearTimetable);
router.post("/bulk-clear", authMiddleware, resolveTenant, resolveAcademicYear, bulkClearTimetable);

router.post("/", authMiddleware, resolveTenant, resolveAcademicYear, createTimetable);
router.get("/", authMiddleware, resolveTenant, resolveAcademicYear, getTimetable);
router.delete("/:id", authMiddleware, resolveTenant, resolveAcademicYear, deleteTimetableEntry);

export default router;
