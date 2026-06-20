// ═══════════════════════════════════════════════════════
// exam.routes.ts — Full Exam Routes (FIXED)
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
  createExamSchedule,
  getExamSchedule,
  updateExamSchedule,
  deleteExamSchedule,
  generateSeating,
  getSeatingBySchedule,
  generateAdmitCards,
  getAdmitCard,
  getAdmitCards,
  uploadQuestionPaper,
  getQuestionPapers,
  deleteQuestionPaper,
  assignInvigilator,
  getInvigilators,
  removeInvigilator,
  getExamDashboard,
  getExamReports,
  generateCustomSeating,
  aiArrangeSeating,
} from "./exam.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = express.Router();

// ═══════════════════════════════════════════════════════
// STATIC ROUTES FIRST (before :id routes)
// ═══════════════════════════════════════════════════════

// Get all exams
router.get("/", authMiddleware, getExams);

// Create exam
router.post("/", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), createExam);

// Dashboard & Reports
router.get("/dashboard", authMiddleware, getExamDashboard);
router.get("/reports", authMiddleware, getExamReports);

// Add/Update subjects for an exam
router.post("/subjects", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), addExamSubjects);

// Enter/Update marks (bulk)
router.post("/marks", authMiddleware, allowRoles("ADMIN", "TEACHER", "SUPER_ADMIN"), enterMarks);

// Consolidated Report
router.get("/consolidated-report/:studentId", authMiddleware, getConsolidatedReport);

// Exam Schedule (static paths)
router.post("/schedule", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), createExamSchedule);
router.put("/schedule/:scheduleId", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), updateExamSchedule);
router.delete("/schedule/:scheduleId", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), deleteExamSchedule);

// Seating Arrangement
router.post("/seating/generate", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), generateSeating);
router.get("/seating/:scheduleId", authMiddleware, getSeatingBySchedule);

// Custom Seating (Multi-class, configurable)
router.post("/seating/generate-custom", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), generateCustomSeating);
router.post("/seating/ai-arrange", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), aiArrangeSeating);

// Admit Cards
router.post("/admit-cards/generate", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), generateAdmitCards);

// Question Papers
router.post("/question-papers", authMiddleware, allowRoles("ADMIN", "TEACHER", "SUPER_ADMIN"), uploadQuestionPaper);
router.delete("/question-papers/:paperId", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), deleteQuestionPaper);

// Invigilators
router.post("/invigilators", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), assignInvigilator);
router.get("/invigilators/:scheduleId", authMiddleware, getInvigilators);
router.delete("/invigilators/:assignmentId", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), removeInvigilator);

// ═══════════════════════════════════════════════════════
// DYNAMIC :id ROUTES (AFTER all static routes)
// ═══════════════════════════════════════════════════════

// Get single exam
router.get("/:id", authMiddleware, getExamById);

// Update exam
router.put("/:id", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), updateExam);

// Delete exam (soft)
router.delete("/:id", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), deleteExam);

// Get subjects of an exam
router.get("/:id/subjects", authMiddleware, getExamSubjects);

// Get marks
router.get("/:id/marks", authMiddleware, getMarks);

// Generate results
router.post("/:id/generate-results", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), generateResults);

// Get results
router.get("/:id/results", authMiddleware, getResults);

// Report card
router.get("/:examId/report-card/:studentId", authMiddleware, getReportCard);

// Exam Schedule (dynamic)
router.get("/:id/schedule", authMiddleware, getExamSchedule);

// Admit Cards (dynamic)
router.get("/:id/admit-cards", authMiddleware, getAdmitCards);
router.get("/:examId/admit-card/:studentId", authMiddleware, getAdmitCard);

// Question Papers (dynamic)
router.get("/:id/question-papers", authMiddleware, getQuestionPapers);

export default router;