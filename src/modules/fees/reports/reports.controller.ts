import { Request, Response } from "express";
import {
  getDashboardReportService,
  getStudentLedgerService,
} from "./reports.service";

import { generatePdf } from "./exports/pdf.service";
import { generateExcel } from "./exports/excel.service";
import { feeReportTemplate } from "./exports/template"; // ✅ FIXED IMPORT
import prisma from "../../../config/prisma";

// 🔥 Dashboard
export const getDashboardController = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await getDashboardReportService({
      user: req.user as any,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
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
    const studentId = req.params.studentId as string;

    const data = await getStudentLedgerService({
      studentId,
      user: req.user as any,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// 📄 PDF Export (🔥 FILTER ENABLED)
export const exportPdfReport = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    const { classId, studentId } = req.query as {
      classId?: string;
      studentId?: string;
    };

    const data = await getDashboardReportService({
      user,
      classId,
      studentId,
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
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

    res.send(pdf);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 📊 Excel Export (🔥 FILTER ENABLED)
export const exportExcelReport = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    const { classId, studentId } = req.query as {
      classId?: string;
      studentId?: string;
    };

    const data = await getDashboardReportService({
      user,
      classId,
      studentId,
    });

    const excel = await generateExcel(data);

    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=report.xlsx",
    });

    res.send(excel);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};