

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
} from "./timetable.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = express.Router();

// ⚡ Static routes FIRST (before /:id)
router.get("/teachers-by-subject/:subjectId", authMiddleware, getTeachersBySubject);
router.post("/auto-generate", authMiddleware, autoGenerateTimetable);
router.post("/bulk-generate", authMiddleware, bulkGenerateTimetable);
router.post("/bulk", authMiddleware, bulkSaveTimetable); // ← NEW: Teacher timetable inline editing
router.post("/clear", authMiddleware, clearTimetable);
router.post("/bulk-clear", authMiddleware, bulkClearTimetable);

// Standard CRUD routes
router.post("/", authMiddleware, createTimetable);
router.get("/", authMiddleware, getTimetable); // Supports ?classId&sectionId OR ?teacherId
router.delete("/:id", authMiddleware, deleteTimetableEntry);

export default router;

