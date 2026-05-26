import express from "express";
import { authMiddleware } from "../../../middleware/auth.middleware";
import {
  getDashboardController,
  getStudentLedgerController,
  exportPdfReport,
  exportExcelReport,
} from "./reports.controller";

const router = express.Router();

// 🔥 Dashboard API
router.get("/dashboard", authMiddleware, getDashboardController);


// 🧾 Student Ledger API
router.get("/student-ledger/:studentId", authMiddleware, getStudentLedgerController);

// 📄 PDF

router.get("/pdf", authMiddleware, exportPdfReport);


// 📊 Excel
router.get("/excel", authMiddleware, exportExcelReport);

export default router;