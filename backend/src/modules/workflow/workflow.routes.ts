import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  createWorkflow,
  listWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  initiateWorkflow,
  approveWorkflow,
  rejectWorkflow,
  getPendingApprovals,
  getWorkflowHistory,
  listWorkflowInstances,
  cancelWorkflow,
  getWorkflowStats,
} from "./workflow.controller";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ═══════════════════════════════════════════
// WORKFLOW TEMPLATES
// ═══════════════════════════════════════════
router.post("/", createWorkflow);
router.get("/", listWorkflows);
router.get("/stats", getWorkflowStats);
router.get("/pending", getPendingApprovals);
router.get("/:id", getWorkflow);
router.put("/:id", updateWorkflow);
router.delete("/:id", deleteWorkflow);

// ═══════════════════════════════════════════
// WORKFLOW INSTANCES
// ═══════════════════════════════════════════
router.post("/initiate", initiateWorkflow);
router.get("/instances", listWorkflowInstances);
router.get("/instances/:id/history", getWorkflowHistory);
router.post("/instances/:id/approve", approveWorkflow);
router.post("/instances/:id/reject", rejectWorkflow);
router.post("/instances/:id/cancel", cancelWorkflow);

export default router;
