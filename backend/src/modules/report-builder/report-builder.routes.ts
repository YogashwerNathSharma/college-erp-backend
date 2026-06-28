import { Router } from "express";
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  generateReport,
  previewReport,
  getGeneratedReports,
  createSchedule,
  getSchedules,
  updateSchedule,
  deleteSchedule,
  getDashboardStats,
} from "./report-builder.controller";

const router = Router();

// Dashboard
router.get("/dashboard", getDashboardStats);

// Templates
router.post("/templates", createTemplate);
router.get("/templates", getTemplates);
router.get("/templates/:id", getTemplateById);
router.put("/templates/:id", updateTemplate);
router.delete("/templates/:id", deleteTemplate);

// Generation
router.post("/generate", generateReport);
router.get("/preview", previewReport);
router.get("/generated", getGeneratedReports);

// Schedules
router.post("/schedules", createSchedule);
router.get("/schedules", getSchedules);
router.put("/schedules/:id", updateSchedule);
router.delete("/schedules/:id", deleteSchedule);

export default router;
