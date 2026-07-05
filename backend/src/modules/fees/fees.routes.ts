

import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

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
import { getAssignStudentsController, assignFeesToStudentsController } from "./feeAssign.controller";
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
router.get("/dashboard", getFeeDashboardController);
router.get("/due-summary", getDueSummaryController);

// ═══════════════════════════════════════════════════════════════════════════
// REPORTS — All 21 Professional Reports
// ═══════════════════════════════════════════════════════════════════════════

// Legacy overview (class-wise)
router.get("/reports", getFeeReportsController);

// 1. Daily Collection
router.get("/reports/daily-collection", dailyCollectionController);

// 2. Monthly Collection
router.get("/reports/monthly-collection", monthlyCollectionController);

// 3. Head-wise Collection
router.get("/reports/head-wise", headWiseCollectionController);

// 4. Category-wise Collection
router.get("/reports/category-wise", categoryWiseCollectionController);

// 5. Pending Fee
router.get("/reports/pending", pendingFeeController);

// 6. Defaulter Report
router.get("/reports/defaulter", defaulterReportController);

// 7. Fine Report
router.get("/reports/fine", fineReportController);

// 8. Concession Report
router.get("/reports/concession", concessionReportController);

// 9. Scholarship Report
router.get("/reports/scholarship", scholarshipReportController);

// 10. Transport Fee Report
router.get("/reports/transport", transportFeeReportController);

// 11. Hostel Fee Report
router.get("/reports/hostel", hostelFeeReportController);

// 12. Exam Fee Report
router.get("/reports/exam", examFeeReportController);

// 13. Collection Register
router.get("/reports/collection-register", collectionRegisterController);

// 14. Receipt Register
router.get("/reports/receipt-register", receiptRegisterController);

// 15. Student Ledger (per student)
router.get("/reports/student-ledger/:enrollmentId", studentLedgerReportController);

// 16. Class Ledger
router.get("/reports/class-ledger", classLedgerController);

// 17. Cash Book
router.get("/reports/cash-book", cashBookController);

// 18. Bank Book
router.get("/reports/bank-book", bankBookController);

// 19. Advance Balance
router.get("/reports/advance-balance", advanceBalanceController);

// 20. Refund Report
router.get("/reports/refund", refundReportController);

// 21. Adjustment Report
router.get("/reports/adjustment", adjustmentReportController);

// ═══════════════════════════════════════════════════════════════════════════
// STUDENT LEDGER (standalone page)
// ═══════════════════════════════════════════════════════════════════════════
router.get("/ledger/search", searchStudentForLedgerController);
router.get("/ledger/:enrollmentId", getStudentLedgerController);

// ═══════════════════════════════════════════════════════════════════════════
// FEE ASSIGN
// ═══════════════════════════════════════════════════════════════════════════
router.get("/assign/students", getAssignStudentsController);
router.post("/assign/students", assignFeesToStudentsController);

// ═══════════════════════════════════════════════════════════════════════════
// FEE SETTINGS
// ═══════════════════════════════════════════════════════════════════════════
router.get("/settings", getFeeSettingsController);
router.put("/settings", updateFeeSettingsController);

// ═══════════════════════════════════════════════════════════════════════════
// FEE INTEGRATION — External modules add/remove fees
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/fees/integration/transport/add
router.post("/integration/transport/add", async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { studentId, monthlyFee, routeName } = req.body;
    if (!studentId || !monthlyFee) return res.status(400).json({ error: "studentId and monthlyFee required" });
    const result = await addTransportFeeToStudent(studentId, tenantId, parseFloat(monthlyFee), routeName);
    res.json({ ...result, success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/fees/integration/transport/remove
router.post("/integration/transport/remove", async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: "studentId required" });
    const result = await removeTransportFeeFromStudent(studentId, tenantId);
    res.json({ ...result, success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/fees/integration/hostel/add
router.post("/integration/hostel/add", async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { studentId, monthlyFee, hostelName } = req.body;
    if (!studentId || !monthlyFee) return res.status(400).json({ error: "studentId and monthlyFee required" });
    const result = await addHostelFeeToStudent(studentId, tenantId, parseFloat(monthlyFee), hostelName);
    res.json({ ...result, success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/fees/integration/hostel/remove
router.post("/integration/hostel/remove", async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: "studentId required" });
    const result = await removeHostelFeeFromStudent(studentId, tenantId);
    res.json({ ...result, success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
