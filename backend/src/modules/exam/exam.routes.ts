// ═══════════════════════════════════════════════════════
// exam.routes.ts — Full Exam Routes (FIXED + NEW ENDPOINTS)
// ═══════════════════════════════════════════════════════

import express from "express";
import prisma from "../../utils/prisma";
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
  bulkCreateExam,
} from "./exam.controller";
import {
  generateInterleavedSeatingService,
  generateWholeExamSeatingService,
  getSeatingWithDetailsService,
  getAttendanceRegisterService,
} from "./seating.service";
import { getBulkAdmitCardsService } from "./bulk-admit-cards.service";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = express.Router();

// ═══════════════════════════════════════════════════════
// STATIC ROUTES FIRST (before :id routes)
// ═══════════════════════════════════════════════════════

router.get("/", authMiddleware, getExams);
router.post("/", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), createExam);

router.get("/dashboard", authMiddleware, getExamDashboard);

// Bulk Create Exam (All Classes + Schedule at once)
router.post("/bulk-create", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), bulkCreateExam);
router.get("/reports", authMiddleware, getExamReports);

router.post("/subjects", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), addExamSubjects);
router.post("/marks", authMiddleware, allowRoles("ADMIN", "TEACHER", "SUPER_ADMIN"), enterMarks);

router.get("/consolidated-report/:studentId", authMiddleware, getConsolidatedReport);

// Exam Schedule
router.post("/schedule", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), createExamSchedule);
router.put("/schedule/:scheduleId", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), updateExamSchedule);
router.delete("/schedule/:scheduleId", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), deleteExamSchedule);

// ─────────────────────────────────────────────────────────────
// SEATING ROUTES
// ─────────────────────────────────────────────────────────────
router.post("/seating/generate", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), generateSeating);
router.post("/seating/generate-custom", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), generateCustomSeating);
router.post("/seating/ai-arrange", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), aiArrangeSeating);

// Single schedule interleaved seating
router.post(
  "/seating/generate-interleaved",
  authMiddleware,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const result = await generateInterleavedSeatingService({ ...req.body, tenantId });
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error("INTERLEAVED SEATING ERROR:", error);
      res.status(500).json({ success: false, message: error.message || "Error generating seating" });
    }
  }
);

// Whole-exam seating — generates same plan for ALL subject schedules at once
router.post(
  "/seating/generate-whole-exam",
  authMiddleware,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const result = await generateWholeExamSeatingService({ ...req.body, tenantId });
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error("WHOLE EXAM SEATING ERROR:", error);
      res.status(500).json({ success: false, message: error.message || "Error generating whole-exam seating" });
    }
  }
);

// Get seating with full student details (enriched — includes fatherName, sectionName)
router.get(
  "/seating-detail/:scheduleId",
  authMiddleware,
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const { scheduleId } = req.params;
      const seats = await getSeatingWithDetailsService(scheduleId, tenantId);
      res.json({ success: true, data: seats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

router.get("/seating/:scheduleId", authMiddleware, getSeatingBySchedule);

// Attendance register — room-wise list with all subject dates as columns
router.get(
  "/attendance-register/:examId",
  authMiddleware,
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const { examId } = req.params;
      const data = await getAttendanceRegisterService(examId, tenantId);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("ATTENDANCE REGISTER ERROR:", error);
      res.status(500).json({ success: false, message: error.message || "Error fetching attendance register" });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// ADMIT CARD ROUTES
// ─────────────────────────────────────────────────────────────
router.post("/admit-cards/generate", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), generateAdmitCards);

router.get(
  "/admit-cards/bulk",
  authMiddleware,
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const { examName, classId } = req.query as { examName: string; classId?: string };
      if (!examName) return res.status(400).json({ success: false, message: "examName is required" });
      const data = await getBulkAdmitCardsService({ examName, classId, tenantId });
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("BULK ADMIT CARDS ERROR:", error);
      res.status(500).json({ success: false, message: error.message || "Error fetching bulk admit cards" });
    }
  }
);

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

router.get("/:id", authMiddleware, getExamById);
router.put("/:id", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), updateExam);
router.delete("/:id", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), deleteExam);

router.get("/:id/subjects", authMiddleware, getExamSubjects);
router.get("/:id/marks", authMiddleware, getMarks);
router.post("/:id/generate-results", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), generateResults);
router.get("/:id/results", authMiddleware, getResults);
router.get("/:examId/report-card/:studentId", authMiddleware, getReportCard);
router.get("/:id/schedule", authMiddleware, getExamSchedule);

router.get("/:id/admit-cards", authMiddleware, getAdmitCards);
router.get("/:examId/admit-card/:studentId", authMiddleware, getAdmitCard);

router.delete("/:id/admit-cards", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const examId = req.params.id;
    const result = await prisma.admitCard.deleteMany({ where: { examId, tenantId } });
    res.json({ success: true, message: `Deleted ${result.count} admit cards`, count: result.count });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/:id/question-papers", authMiddleware, getQuestionPapers);

export default router;
