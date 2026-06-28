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

// Insights
router.get("/insights", getInsights);
router.put("/insights/:id/dismiss", dismissInsight);

export default router;
