

import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";

import { addTransportFeeToStudent, addHostelFeeToStudent, removeTransportFeeFromStudent, removeHostelFeeFromStudent, addModuleFeeToStudent } from "./feeIntegration.service";
// Existing sub-module routes
import feeHeadRoutes from "./feeHead.routes";
import feeStructureRoutes from "./feeStructure.routes";
import feeDiscountRoutes from "./feeDiscount.routes";
import fineRuleRoutes from "./fineRule.routes";
import feeCollectionRoutes from "./feeCollection.routes";

// Controllers
import { getFeeDashboardController } from "./feeDashboard.controller";
import { getDueSummaryController } from "./feeDue.controller";
import { getAssignStudentsController, assignFeesToStudentsController, unassignFeesController } from "./feeAssign.controller";
import { getFeeSettingsController, updateFeeSettingsController } from "./feeSettings.controller";

// Report Controllers (21 reports)
import {
  getFeeReportsController,
  dailyCollectionController,
  monthlyCollectionController,
  headWiseCollectionController,
  categoryWiseCollectionController,
  pendingFeeController,
  defaulterReportController,
  fineReportController,
  concessionReportController,
  scholarshipReportController,
  transportFeeReportController,
  hostelFeeReportController,
  examFeeReportController,
  collectionRegisterController,
  receiptRegisterController,
  studentLedgerReportController,
  classLedgerController,
  cashBookController,
  bankBookController,
  advanceBalanceController,
  refundReportController,
  adjustmentReportController,
  classWiseStudentFeeSummaryController,
  individualStudentFeeReportController,
} from "./feeReports.controller";

// Student Ledger (search)
import { getStudentLedgerController, searchStudentForLedgerController } from "./studentLedger.controller";

const router = Router();

// All routes are protected
router.use(authMiddleware);

// ═══════════════════════════════════════════════════════════════════════════
// EXISTING SUB-MODULE ROUTES
// ═══════════════════════════════════════════════════════════════════════════
router.use("/heads", feeHeadRoutes);
router.use("/structures", feeStructureRoutes);
router.use("/discounts", feeDiscountRoutes);
router.use("/fine-rules", fineRuleRoutes);
router.use("/collection", feeCollectionRoutes);

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD & DUE SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
router.get("/dashboard", requirePermission("fees.view"), getFeeDashboardController);
router.get("/due-summary", requirePermission("fees.view"), getDueSummaryController);

// ═══════════════════════════════════════════════════════════════════════════
// REPORTS — All 21 Professional Reports
// ═══════════════════════════════════════════════════════════════════════════

// Legacy overview (class-wise)
router.get("/reports", requirePermission("fees.view"), getFeeReportsController);

// 1. Daily Collection
router.get("/reports/daily-collection", requirePermission("fees.view"), dailyCollectionController);

// 2. Monthly Collection
router.get("/reports/monthly-collection", requirePermission("fees.view"), monthlyCollectionController);

// 3. Head-wise Collection
router.get("/reports/head-wise", requirePermission("fees.view"), headWiseCollectionController);

// 4. Category-wise Collection
router.get("/reports/category-wise", requirePermission("fees.view"), categoryWiseCollectionController);

// 5. Pending Fee
router.get("/reports/pending", requirePermission("fees.view"), pendingFeeController);

// 6. Defaulter Report
router.get("/reports/defaulter", requirePermission("fees.view"), defaulterReportController);

// 7. Fine Report
router.get("/reports/fine", requirePermission("fees.view"), fineReportController);

// 8. Concession Report
router.get("/reports/concession", requirePermission("fees.view"), concessionReportController);

// 9. Scholarship Report
router.get("/reports/scholarship", requirePermission("fees.view"), scholarshipReportController);

// 10. Transport Fee Report
router.get("/reports/transport", requirePermission("fees.view"), transportFeeReportController);

// 11. Hostel Fee Report
router.get("/reports/hostel", requirePermission("fees.view"), hostelFeeReportController);

// 12. Exam Fee Report
router.get("/reports/exam", requirePermission("fees.view"), examFeeReportController);

// 13. Collection Register
router.get("/reports/collection-register", requirePermission("fees.view"), collectionRegisterController);

// 14. Receipt Register
router.get("/reports/receipt-register", requirePermission("fees.view"), receiptRegisterController);

// 15. Student Ledger (per student)
router.get("/reports/student-ledger/:enrollmentId", requirePermission("fees.view"), studentLedgerReportController);

// 16. Class Ledger
router.get("/reports/class-ledger", requirePermission("fees.view"), classLedgerController);

// 17. Cash Book
router.get("/reports/cash-book", requirePermission("fees.view"), cashBookController);

// 18. Bank Book
router.get("/reports/bank-book", requirePermission("fees.view"), bankBookController);

// 19. Advance Balance
router.get("/reports/advance-balance", requirePermission("fees.view"), advanceBalanceController);

// 20. Refund Report
router.get("/reports/refund", requirePermission("fees.view"), refundReportController);

// 21. Adjustment Report
// 22. Class-wise Student Fee Summary (printable with tenant logo)
router.get("/reports/class-wise-summary", requirePermission("fees.view"), classWiseStudentFeeSummaryController);
// 23. Individual Student Fee Report (printable with all installments + payments)
router.get("/reports/student-fee-report/:enrollmentId", requirePermission("fees.view"), individualStudentFeeReportController);
router.get("/reports/adjustment", requirePermission("fees.view"), adjustmentReportController);

// ═══════════════════════════════════════════════════════════════════════════
// STUDENT LEDGER (standalone page)
// ═══════════════════════════════════════════════════════════════════════════
router.get("/ledger/search", requirePermission("fees.view"), searchStudentForLedgerController);
router.get("/ledger/:enrollmentId", requirePermission("fees.view"), getStudentLedgerController);

// ═══════════════════════════════════════════════════════════════════════════
// FEE ASSIGN
// ═══════════════════════════════════════════════════════════════════════════
router.get("/assign/students", requirePermission("fees.view"), getAssignStudentsController);
router.post("/assign/students", requirePermission("fees.collect"), assignFeesToStudentsController);
router.delete("/assign/students", requirePermission("fees.collect"), unassignFeesController);

// ═══════════════════════════════════════════════════════════════════════════
// FEE SETTINGS
// ═══════════════════════════════════════════════════════════════════════════
router.get("/settings", requirePermission("fees.view"), getFeeSettingsController);
router.put("/settings", requirePermission("fees.collect"), updateFeeSettingsController);

// ═══════════════════════════════════════════════════════════════════════════
// FEE INTEGRATION — External modules add/remove fees
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/fees/integration/transport/add
router.post("/integration/transport/add", requirePermission("fees.collect"), async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { studentId, monthlyFee, routeName } = req.body;
    if (!studentId || !monthlyFee) return res.status(400).json({ error: "studentId and monthlyFee required" });
    const result = await addTransportFeeToStudent(studentId, tenantId, parseFloat(monthlyFee), routeName);
    res.json({ ...result, success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/fees/integration/transport/remove
router.post("/integration/transport/remove", requirePermission("fees.collect"), async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: "studentId required" });
    const result = await removeTransportFeeFromStudent(studentId, tenantId);
    res.json({ ...result, success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/fees/integration/hostel/add
router.post("/integration/hostel/add", requirePermission("fees.collect"), async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { studentId, monthlyFee, hostelName } = req.body;
    if (!studentId || !monthlyFee) return res.status(400).json({ error: "studentId and monthlyFee required" });
    const result = await addHostelFeeToStudent(studentId, tenantId, parseFloat(monthlyFee), hostelName);
    res.json({ ...result, success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/fees/integration/hostel/remove
router.post("/integration/hostel/remove", requirePermission("fees.collect"), async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: "studentId required" });
    const result = await removeHostelFeeFromStudent(studentId, tenantId);
    res.json({ ...result, success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════
// FEE RECEIPT PDF
// ═══════════════════════════════════════════════════════
import { getFeeReceiptPDF } from "./fee-receipt-pdf.controller";

router.get("/receipt/:paymentId/pdf", getFeeReceiptPDF);

export default router;
