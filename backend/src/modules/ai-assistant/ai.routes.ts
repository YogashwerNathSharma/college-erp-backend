import { Router } from "express";
import {
  analyzePerformance,
  predictAttendance,
  predictDefaulters,
  chat,
  getInsights,
  dismissInsight,
  getConversations,
} from "./ai.controller";
import { generateContent } from "./ai-generate.controller";
import { processAiCommand, aiSearchStudents, aiSearchFees, aiSearchAttendance, aiSearchReportCard } from "./ai-command.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = Router();

router.use(authMiddleware);
router.use(resolveTenant);

// Analysis & Predictions
router.post("/analyze/performance", analyzePerformance);
router.post("/predict/attendance", predictAttendance);
router.post("/predict/defaulters", predictDefaulters);

// Chat
router.post("/chat", chat);
router.get("/conversations", getConversations);

// AI Command processing (used by yn AI frontend assistant)
router.post("/process-command", processAiCommand);
router.post("/students/search", aiSearchStudents);
router.post("/fees/receipts/search", aiSearchFees);
router.post("/attendance/search", aiSearchAttendance);
router.post("/exams/report-card/search", aiSearchReportCard);

// Content Generation
router.post("/generate", generateContent);

// Insights
router.get("/insights", getInsights);
router.put("/insights/:id/dismiss", dismissInsight);

export default router;
