import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  getStudentReportHandler,
  getFeeReportHandler,
  getAttendanceReportHandler,
  getExamAnalyticsHandler,
  getCustomReportHandler,
  getReportTemplatesHandler,
} from "./report.controller";

import { getReportCardPDF, getBulkReportCardPDF } from "./report-card-pdf.controller";
import { exportStudentsHandler, exportFeesHandler, exportAttendanceHandler } from "./excel-export.controller";

const router = Router();

router.use(authMiddleware, resolveTenant, resolveAcademicYear);

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

// ============================================
// REPORT CARD PDF
// ============================================
router.get("/report-card/bulk/:classId/:examId", allowRoles("ADMIN", "TEACHER"), getBulkReportCardPDF);
router.get("/report-card/:studentId/:examId", allowRoles("ADMIN", "TEACHER"), getReportCardPDF);

// ============================================
// EXCEL EXPORTS
// ============================================
router.get("/students/export", allowRoles("ADMIN"), exportStudentsHandler);
router.get("/fees/export", allowRoles("ADMIN"), exportFeesHandler);
router.get("/attendance/export", allowRoles("ADMIN", "TEACHER"), exportAttendanceHandler);

export default router;
