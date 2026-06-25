import { Router } from "express";
import { processAiCommand, searchFeeReceipts, searchReportCard, searchAttendance, searchStudents } from "./ai.controller";
import { generateContent } from "./ai-generate.controller";
import { getAllPayments, getRealDefaulters } from "./dashboard-modal.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
router.use(authMiddleware);

// Main AI command processor
router.post("/process-command", processAiCommand);

// Specific search endpoints for AI
router.post("/fees/receipts/search", searchFeeReceipts);
router.post("/exams/report-card/search", searchReportCard);
router.post("/attendance/search", searchAttendance);
router.post("/students/search", searchStudents);

// AI Content Generation
router.post("/generate", generateContent);

// ━━━ DASHBOARD MODAL ENDPOINTS (Prisma direct) ━━━
router.get("/dashboard/all-payments", getAllPayments);
router.get("/dashboard/defaulters", getRealDefaulters);

export default router;
