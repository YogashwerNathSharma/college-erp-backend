import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  getStudentReportHandler,
  getFeeReportHandler,
  getAttendanceReportHandler,
  getExamAnalyticsHandler,
  getCustomReportHandler,
  getReportTemplatesHandler,
} from "./report.controller";

const router = Router();

router.use(authMiddleware, resolveTenant);

// ============================================
// REPORT TEMPLATES
// ============================================
router.get("/templates", getReportTemplatesHandler);

// ============================================
// STUDENT REPORTS
// ============================================
router.get("/students", allowRoles("ADMIN", "TEACHER"), getStudentReportHandler);

// ============================================
// FEE REPORTS
// ============================================
router.get("/fees", allowRoles("ADMIN"), getFeeReportHandler);

// ============================================
// ATTENDANCE REPORTS
// ============================================
router.get("/attendance", allowRoles("ADMIN", "TEACHER"), getAttendanceReportHandler);

// ============================================
// EXAM ANALYTICS
// ============================================
router.get("/exams", allowRoles("ADMIN", "TEACHER"), getExamAnalyticsHandler);

// ============================================
// CUSTOM REPORT
// ============================================
router.post("/custom", allowRoles("ADMIN"), getCustomReportHandler);

export default router;
