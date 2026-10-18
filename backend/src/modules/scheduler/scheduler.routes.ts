import { Router } from "express";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  runTaskNow,
  toggleTask,
  getLogs,
  getTaskLogs,
  getTemplates,
  getStats,
} from "./scheduler.controller";

import { authMiddleware } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';

const router = Router({ mergeParams: true });

// ══════════════════════════════════════════════════════════
// SCHEDULER ROUTES
// Base: /api/scheduler
// ══════════════════════════════════════════════════════════

// Dashboard stats
router.use(authMiddleware);
router.use(resolveTenant);

router.get("/stats", getStats);

// Predefined templates
router.get("/templates", getTemplates);

// Task CRUD
router.get("/tasks", listTasks);
router.post("/tasks", createTask);
router.put("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);

// Task actions
router.post("/tasks/:id/run", runTaskNow);
router.post("/tasks/:id/toggle", toggleTask);

// Logs
router.get("/logs", getLogs);
router.get("/logs/:taskId", getTaskLogs);

export default router;
