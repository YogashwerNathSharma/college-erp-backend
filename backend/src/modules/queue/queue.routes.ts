import { Router } from "express";
import {
  getStatus,
  listJobs,
  addJob,
  retryJob,
  retryAllFailed,
  cancelJob,
  updateConfig,
  getConfig,
  triggerProcessing,
  cleanup,
} from "./queue.controller";

import { authMiddleware } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';

const router = Router({ mergeParams: true });

// ══════════════════════════════════════════════════════════
// QUEUE ROUTES
// Base: /api/queue
// ══════════════════════════════════════════════════════════

// Dashboard & Monitoring
router.use(authMiddleware);
router.use(resolveTenant);

router.get("/status", getStatus);
router.get("/jobs", listJobs);

// Job Management
router.post("/add", addJob);
router.post("/retry/:id", retryJob);
router.post("/retry-all", retryAllFailed);
router.delete("/jobs/:id", cancelJob);

// Processing Control
router.post("/process", triggerProcessing);
router.post("/cleanup", cleanup);

// Configuration
router.get("/config", getConfig);
router.put("/config", updateConfig);

export default router;
