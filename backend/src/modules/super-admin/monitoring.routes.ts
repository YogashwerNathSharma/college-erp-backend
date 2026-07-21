import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  getMonitoringDashboard,
  getSystemMetrics,
  getCPUHistory,
  getRAMHistory,
  getServerHealth,
  getResponseTimeHistory,
  getAPIMonitoring,
  getQueues,
  getBackgroundJobs,
} from "./monitoring.controller";

const router = Router();

// All routes require SUPER_ADMIN
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

// Full Dashboard
router.get("/dashboard", getMonitoringDashboard);

// System Metrics
router.get("/metrics", getSystemMetrics);

// CPU History
router.get("/cpu-history", getCPUHistory);

// RAM History
router.get("/ram-history", getRAMHistory);

// Server Health
router.get("/health", getServerHealth);

// Response Time
router.get("/response-time", getResponseTimeHistory);

// API Monitoring
router.get("/api-stats", getAPIMonitoring);

// Queues
router.get("/queues", getQueues);

// Background Jobs
router.get("/jobs", getBackgroundJobs);

export default router;
