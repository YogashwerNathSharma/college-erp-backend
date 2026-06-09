// ═══════════════════════════════════════════════════════
// exam.routes.ts — Full Exam Routes
// ═══════════════════════════════════════════════════════

import express from "express";
import {
  createExam,
  updateExam,
  getExams,
  getExamById,
  deleteExam,
  addExamSubjects,
  getExamSubjects,
  enterMarks,
  getMarks,
  generateResults,
  getResults,
  getReportCard,
  getConsolidatedReport,
} from "./exam.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = express.Router();

// ─────────────────────────────────────────
// STATIC ROUTES FIRST (before :id routes)
// ─────────────────────────────────────────

// Get all exams (filter by classId, academicYearId via query)
router.get("/", authMiddleware, getExams);

// Create exam
router.post("/", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), createExam);

// Add/Update subjects for an exam
router.post("/subjects", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), addExamSubjects);

// Enter/Update marks (bulk)
router.post("/marks", authMiddleware, allowRoles("ADMIN", "TEACHER", "SUPER_ADMIN"), enterMarks);

// ─────────────────────────────────────────
// CONSOLIDATED REPORT (before :id routes!)
// ─────────────────────────────────────────
router.get(
  "/consolidated-report/:studentId",
  authMiddleware,
  getConsolidatedReport
);

// ─────────────────────────────────────────
// DYNAMIC :id ROUTES
// ─────────────────────────────────────────

// Get single exam
router.get("/:id", authMiddleware, getExamById);

// Update exam
router.put("/:id", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), updateExam);

// Delete exam (soft)
router.delete("/:id", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), deleteExam);

// Get subjects of an exam
router.get("/:id/subjects", authMiddleware, getExamSubjects);

// Get marks for marks entry page
router.get("/:id/marks", authMiddleware, getMarks);

// Generate results
router.post("/:id/generate-results", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), generateResults);

// Get published results
router.get("/:id/results", authMiddleware, getResults);

// Get report card for a student
router.get("/:examId/report-card/:studentId", authMiddleware, getReportCard);

export default router;