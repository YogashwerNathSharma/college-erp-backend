
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FEE REPORTS CONTROLLER — 21 Report Endpoints
 * ═══════════════════════════════════════════════════════════════════════════
 */

import {
  getDailyCollection,
  getMonthlyCollection,
  getHeadWiseCollection,
  getCategoryWiseCollection,
  getPendingFeeReport,
  getDefaulterReport,
  getFineReport,
  getConcessionReport,
  getScholarshipReport,
  getModuleWiseFeeReport,
  getCollectionRegister,
  getReceiptRegister,
  getStudentLedger,
  getClassLedger,
  getCashBook,
  getBankBook,
  getAdvanceBalanceReport,
  getRefundReport,
  getAdjustmentReport,
  getFeeReports,
} from "./feeReports.service";

// Legacy: GET /api/fees/reports (class-wise overview)
export const getFeeReportsController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { academicYearId, fromDate, toDate } = req.query;
    const data = await getFeeReports(tenantId, { academicYearId, fromDate, toDate });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 1. Daily Collection
export const dailyCollectionController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { date, fromDate, toDate } = req.query;
    const data = await getDailyCollection(tenantId, { date, fromDate, toDate });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Monthly Collection
export const monthlyCollectionController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { year, month, academicYearId } = req.query;
    const data = await getMonthlyCollection(tenantId, {
      year: year ? parseInt(year) : undefined,
      month: month ? parseInt(month) : undefined,
      academicYearId,
    });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Head-wise Collection
export const headWiseCollectionController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { fromDate, toDate, academicYearId } = req.query;
    const data = await getHeadWiseCollection(tenantId, { fromDate, toDate, academicYearId });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Category-wise Collection
export const categoryWiseCollectionController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { fromDate, toDate } = req.query;
    const data = await getCategoryWiseCollection(tenantId, { fromDate, toDate });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Pending Fee Report
export const pendingFeeController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { classId, sectionId, academicYearId } = req.query;
    const data = await getPendingFeeReport(tenantId, { classId, sectionId, academicYearId });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 6. Defaulter Report
export const defaulterReportController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { classId, sectionId, academicYearId, month, year, feeCategory } = req.query;
    const data = await getDefaulterReport(tenantId, {
      classId,
      sectionId,
      academicYearId,
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      feeCategory,
    });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 7. Fine Report
export const fineReportController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { fromDate, toDate, classId } = req.query;
    const data = await getFineReport(tenantId, { fromDate, toDate, classId });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 8. Concession Report
export const concessionReportController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { academicYearId, classId } = req.query;
    const data = await getConcessionReport(tenantId, { academicYearId, classId });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 9. Scholarship Report
export const scholarshipReportController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { academicYearId } = req.query;
    const data = await getScholarshipReport(tenantId, { academicYearId });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 10. Transport Fee Report
export const transportFeeReportController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { classId, academicYearId } = req.query;
    const data = await getModuleWiseFeeReport(tenantId, "Transport", { classId, academicYearId });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 11. Hostel Fee Report
export const hostelFeeReportController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { classId, academicYearId } = req.query;
    const data = await getModuleWiseFeeReport(tenantId, "Hostel", { classId, academicYearId });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 12. Exam Fee Report
export const examFeeReportController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { classId, academicYearId } = req.query;
    const data = await getModuleWiseFeeReport(tenantId, "Examination", { classId, academicYearId });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 13. Collection Register
export const collectionRegisterController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { fromDate, toDate, method } = req.query;
    const data = await getCollectionRegister(tenantId, { fromDate, toDate, method });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 14. Receipt Register
export const receiptRegisterController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { fromDate, toDate } = req.query;
    const data = await getReceiptRegister(tenantId, { fromDate, toDate });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 15. Student Ledger
export const studentLedgerReportController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { enrollmentId } = req.params;
    const data = await getStudentLedger(enrollmentId, tenantId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 16. Class Ledger
export const classLedgerController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { academicYearId, fromDate, toDate } = req.query;
    const data = await getClassLedger(tenantId, { academicYearId, fromDate, toDate });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 17. Cash Book
export const cashBookController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { fromDate, toDate } = req.query;
    const data = await getCashBook(tenantId, { fromDate, toDate });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 18. Bank Book
export const bankBookController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { fromDate, toDate } = req.query;
    const data = await getBankBook(tenantId, { fromDate, toDate });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 19. Advance Balance
export const advanceBalanceController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const data = await getAdvanceBalanceReport(tenantId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 20. Refund Report
export const refundReportController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const data = await getRefundReport(tenantId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 21. Adjustment Report
export const adjustmentReportController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const data = await getAdjustmentReport(tenantId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
