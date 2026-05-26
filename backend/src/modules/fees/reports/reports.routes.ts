import express from "express";
import { authMiddleware } from "../../../middleware/auth.middleware";
import {
  getDashboardController,
  getStudentLedgerController,
  exportPdfReport,
  exportExcelReport,
} from "./reports.controller";
import { resolveTenant } from "../../../middleware/tenant.middleware";
import { allowRoles } from "../../../middleware/role.middleware";

const router = express.Router();

// 🔥 Dashboard API
router.get(
  "/dashboard",
  authMiddleware,
  resolveTenant, // 🔥 FIX
  getDashboardController
);

// 🧾 Student Ledger API
router.get(
  "/student-ledger/:studentId",
  authMiddleware,
  resolveTenant, // 🔥 FIX
  getStudentLedgerController
);

// 📄 PDF
router.get(
  "/pdf",
  authMiddleware,
  resolveTenant,
  exportPdfReport
);

// 📊 Excel
router.get(
  "/excel",
  authMiddleware,
  resolveTenant,
  exportExcelReport
);

export default router;