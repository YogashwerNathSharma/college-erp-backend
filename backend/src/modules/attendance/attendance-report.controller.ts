

import { Request, Response } from "express";
import {
  getMonthlyReportService,
  getDatewiseReportService,
  getYearlyReportService,
  getClasswiseReportService,
  getSchoolReportService,
} from "./attendance-report.service";

// 1. Monthly Report
export const getMonthlyReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { classId, sectionId, month, year } = req.query;

    if (!classId || !sectionId || !month || !year) {
      res.status(400).json({ message: "classId, sectionId, month, and year are required" });
      return;
    }

    const data = await getMonthlyReportService(
      classId as string,
      sectionId as string,
      Number(month),
      Number(year),
      tenantId
    );

    res.json(data);
  } catch (error) {
    console.error("MONTHLY REPORT ERROR:", error);
    res.status(500).json({ message: "Error generating monthly report" });
  }
};

// 2. Date-wise Report
export const getDatewiseReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { classId, sectionId, date } = req.query;

    if (!classId || !sectionId || !date) {
      res.status(400).json({ message: "classId, sectionId, and date are required" });
      return;
    }

    const data = await getDatewiseReportService(
      classId as string,
      sectionId as string,
      date as string,
      tenantId
    );

    res.json(data);
  } catch (error) {
    console.error("DATEWISE REPORT ERROR:", error);
    res.status(500).json({ message: "Error generating date-wise report" });
  }
};

// 3. Yearly Report
export const getYearlyReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { classId, sectionId, year } = req.query;

    if (!classId || !sectionId || !year) {
      res.status(400).json({ message: "classId, sectionId, and year are required" });
      return;
    }

    const data = await getYearlyReportService(
      classId as string,
      sectionId as string,
      Number(year),
      tenantId
    );

    res.json(data);
  } catch (error) {
    console.error("YEARLY REPORT ERROR:", error);
    res.status(500).json({ message: "Error generating yearly report" });
  }
};

// 4. Class-wise Summary
export const getClasswiseReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { classId, sectionId } = req.query;

    if (!classId || !sectionId) {
      res.status(400).json({ message: "classId and sectionId are required" });
      return;
    }

    const data = await getClasswiseReportService(
      classId as string,
      sectionId as string,
      tenantId
    );

    res.json(data);
  } catch (error) {
    console.error("CLASSWISE REPORT ERROR:", error);
    res.status(500).json({ message: "Error generating class-wise report" });
  }
};

// 5. Full School Report
export const getSchoolReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { month, year } = req.query;

    if (!month || !year) {
      res.status(400).json({ message: "month and year are required" });
      return;
    }

    const data = await getSchoolReportService(
      Number(month),
      Number(year),
      tenantId
    );

    res.json(data);
  } catch (error) {
    console.error("SCHOOL REPORT ERROR:", error);
    res.status(500).json({ message: "Error generating school report" });
  }
};
