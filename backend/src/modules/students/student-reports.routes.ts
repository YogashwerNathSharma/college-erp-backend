import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  getAdmissionReportHandler,
  getStrengthReportHandler,
  getGenderReportHandler,
  getCategoryReportHandler,
  getReligionReportHandler,
  getTransportReportHandler,
  getHostelReportHandler,
  getScholarshipReportHandler,
  getMedicalReportHandler,
  getBirthdayReportHandler,
  getInactiveReportHandler,
  getTransferReportHandler,
  getPromotionReportHandler,
  getDocumentReportHandler,
  getCustomReportHandler,
} from "./student-reports.controller";

const router = Router();

// ============================================
// ALL ROUTES USE AUTH + TENANT
// ============================================
router.use(authMiddleware, resolveTenant);

// ══════════════════════════════════════════════════════════════════
// STUDENT REPORTS ROUTES
// ══════════════════════════════════════════════════════════════════

// GET /api/students/reports/admission — Admission report (date range, class)
router.get("/admission", getAdmissionReportHandler);

// GET /api/students/reports/strength — Student strength report (class-wise)
router.get("/strength", getStrengthReportHandler);

// GET /api/students/reports/gender — Gender report
router.get("/gender", getGenderReportHandler);

// GET /api/students/reports/category — Category report (SC/ST/OBC/Gen)
router.get("/category", getCategoryReportHandler);

// GET /api/students/reports/religion — Religion report
router.get("/religion", getReligionReportHandler);

// GET /api/students/reports/transport — Transport students report
router.get("/transport", getTransportReportHandler);

// GET /api/students/reports/hostel — Hostel students report
router.get("/hostel", getHostelReportHandler);

// GET /api/students/reports/scholarship — Scholarship students report
router.get("/scholarship", getScholarshipReportHandler);

// GET /api/students/reports/medical — Medical/health report
router.get("/medical", getMedicalReportHandler);

// GET /api/students/reports/birthday — Birthday report (by month)
router.get("/birthday", getBirthdayReportHandler);

// GET /api/students/reports/inactive — Inactive students report
router.get("/inactive", getInactiveReportHandler);

// GET /api/students/reports/transfer — Transferred students report
router.get("/transfer", getTransferReportHandler);

// GET /api/students/reports/promotion — Promotion report
router.get("/promotion", getPromotionReportHandler);

// GET /api/students/reports/document — Document status report
router.get("/document", getDocumentReportHandler);

// POST /api/students/reports/custom — Custom report builder
router.post("/custom", allowRoles("ADMIN"), getCustomReportHandler);

export default router;
