import { Request, Response } from "express";
import {
  getDashboardReportService,
  getStudentLedgerService,
} from "./reports.service";

import { generatePdf } from "./exports/pdf.service";
import { generateExcel } from "./exports/excel.service";
import { feeReportTemplate } from "./exports/template";
import prisma from "../../../config/prisma";

// 🔥 Dashboard
export const getDashboardController = async (
  req: Request,
  res: Response
) => {
  try {
    const tenantId = (req as any).tenantId;

    const data = await getDashboardReportService({
      tenantId,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 🧾 Student Ledger
export const getStudentLedgerController = async (
  req: Request,
  res: Response
) => {
  try {
    const tenantId = (req as any).tenantId;
    const studentId = req.params.studentId as string;

    const data = await getStudentLedgerService({
      studentId,
      tenantId,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("LEDGER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 📄 PDF Export
export const exportPdfReport = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const user = req.user as any; // only for name

    const { classId, studentId } = req.query as {
      classId?: string;
      studentId?: string;
    };

    const data = await getDashboardReportService({
      tenantId,
      classId,
      studentId,
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    let title = "Full School Report";
    if (studentId) title = "Student Report";
    else if (classId) title = "Class Report";

    const html = feeReportTemplate({
      ...data,
      schoolName: tenant?.name || "School",
      schoolLogo: tenant?.logoUrl,
      generatedBy: user?.name,
      date: new Date(),
      title,
    });

    const pdf = await generatePdf(html);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=report.pdf",
    });

    return res.send(pdf);
  } catch (error: any) {
    console.error("PDF ERROR:", error);

    return res.status(500).json({ message: error.message });
  }
};

// 📊 Excel Export
export const exportExcelReport = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    const { classId, studentId } = req.query as {
      classId?: string;
      studentId?: string;
    };

    const data = await getDashboardReportService({
      tenantId,
      classId,
      studentId,
    });

    const excel = await generateExcel(data);

    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=report.xlsx",
    });

    return res.send(excel);
  } catch (error: any) {
    console.error("EXCEL ERROR:", error);

    return res.status(500).json({ message: error.message });
  }
};