

import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

// Existing sub-module routes
import feeHeadRoutes from "./feeHead.routes";
import feeStructureRoutes from "./feeStructure.routes";
import feeDiscountRoutes from "./feeDiscount.routes";
import fineRuleRoutes from "./fineRule.routes";
import feeCollectionRoutes from "./feeCollection.routes";

// New controllers
import { getFeeDashboardController } from "./feeDashboard.controller";
import { getDueSummaryController } from "./feeDue.controller";
import { getFeeReportsController } from "./feeReports.controller";
import { getStudentLedgerController, searchStudentForLedgerController } from "./studentLedger.controller";
import { getAssignStudentsController, assignFeesToStudentsController } from "./feeAssign.controller";
//import { sendReminderController, previewReminderController } from "./feeReminder.controller";
import { getFeeSettingsController, updateFeeSettingsController } from "./feeSettings.controller";

const router = Router();

// All routes are protected
router.use(authMiddleware);

// ═══════════════════════════════════════════
// EXISTING SUB-MODULE ROUTES
// ═══════════════════════════════════════════
router.use("/heads", feeHeadRoutes);
router.use("/structures", feeStructureRoutes);
router.use("/discounts", feeDiscountRoutes);
router.use("/fine-rules", fineRuleRoutes);
router.use("/collection", feeCollectionRoutes);

// ═══════════════════════════════════════════
// NEW ROUTES (Dashboard, Reports, Ledger, Assign, Reminders, Settings)
// ═══════════════════════════════════════════

// Fee Dashboard
router.get("/dashboard", getFeeDashboardController);

// Due Fees Summary
router.get("/due-summary", getDueSummaryController);

// Fee Reports
router.get("/reports", getFeeReportsController);

// Student Ledger
router.get("/ledger/search", searchStudentForLedgerController);
router.get("/ledger/:enrollmentId", getStudentLedgerController);

// Fee Assign
router.get("/assign/students", getAssignStudentsController);
router.post("/assign/students", assignFeesToStudentsController);

// Fee Reminders
//router.post("/reminders/send", sendReminderController);
//router.post("/reminders/preview", previewReminderController);

// Fee Settings
router.get("/settings", getFeeSettingsController);
router.put("/settings", updateFeeSettingsController);

export default router;

