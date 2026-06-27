import { Request, Response } from "express";
import * as reportService from "./report.service";

// ============================================
// STUDENT REPORTS
// ============================================

export const getStudentReportHandler = async (req: any, res: Response) => {
  try {
    const { classId, sectionId, academicYearId, format } = req.query;
    const result = await reportService.generateStudentReport(req.tenantId, {
      classId, sectionId, academicYearId, format: format || "json",
    });

    if (format === "excel" || format === "pdf") {
      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      return res.send(result.buffer);
    }

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// FEE REPORTS
// ============================================

export const getFeeReportHandler = async (req: any, res: Response) => {
  try {
    const { academicYearId, classId, status, format, startDate, endDate } = req.query;
    const result = await reportService.generateFeeReport(req.tenantId, {
      academicYearId, classId, status, format: format || "json", startDate, endDate,
    });

    if (format === "excel" || format === "pdf") {
      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      return res.send(result.buffer);
    }

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// ATTENDANCE REPORTS
// ============================================

export const getAttendanceReportHandler = async (req: any, res: Response) => {
  try {
    const { classId, sectionId, month, year, format } = req.query;
    const result = await reportService.generateAttendanceReport(req.tenantId, {
      classId, sectionId,
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      format: format || "json",
    });

    if (format === "excel" || format === "pdf") {
      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      return res.send(result.buffer);
    }

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// EXAM ANALYTICS
// ============================================

export const getExamAnalyticsHandler = async (req: any, res: Response) => {
  try {
    const { examId, classId, sectionId, format } = req.query;
    const result = await reportService.generateExamAnalytics(req.tenantId, {
      examId, classId, sectionId, format: format || "json",
    });

    if (format === "excel" || format === "pdf") {
      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      return res.send(result.buffer);
    }

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// CUSTOM REPORTS
// ============================================

export const getCustomReportHandler = async (req: any, res: Response) => {
  try {
    const result = await reportService.generateCustomReport(req.body, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================================
// REPORT TEMPLATES
// ============================================

export const getReportTemplatesHandler = async (req: any, res: Response) => {
  try {
    const result = await reportService.getReportTemplates(req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
