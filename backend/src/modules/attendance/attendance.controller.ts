

import { Request, Response } from "express";
import {
  markAttendanceService,
  updateAttendanceService,
  getClassAttendanceService,
  getStudentAttendanceService,
  getAttendanceReportService,
  getAttendanceSummaryService,
  getDashboardStatsService,
} from "./attendance.service";
import { MarkAttendanceBody, UpdateAttendanceBody } from "./attendance.types";

/////////////////////////
// DASHBOARD STATS
/////////////////////////
export const getDashboardStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { academicYearId } = req.query;

    if (!academicYearId) {
      res.status(400).json({ message: "academicYearId is required" });
      return;
    }

    const stats = await getDashboardStatsService(
      tenantId,
      academicYearId as string
    );

    res.json(stats);
  } catch (error) {
    console.error("DASHBOARD STATS ERROR:", error);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};

/////////////////////////
// MARK ATTENDANCE (Bulk)
/////////////////////////
export const markAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const result = await markAttendanceService(
      req.body as MarkAttendanceBody,
      tenantId
    );

    res.json(result);
  } catch (error) {
    console.error("MARK ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Error marking attendance" });
  }
};

/////////////////////////
// UPDATE ATTENDANCE (Edit)
/////////////////////////
export const updateAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const result = await updateAttendanceService(
      req.body as UpdateAttendanceBody,
      tenantId
    );

    res.json(result);
  } catch (error) {
    console.error("UPDATE ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Error updating attendance" });
  }
};

/////////////////////////
// GET CLASS ATTENDANCE
/////////////////////////
export const getClassAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { classId, sectionId, date } = req.query;

    if (!classId || !sectionId || !date) {
      res.status(400).json({ message: "classId, sectionId, and date are required" });
      return;
    }

    const data = await getClassAttendanceService(
      classId as string,
      sectionId as string,
      date as string,
      tenantId
    );

    res.json(data);
  } catch (error) {
    console.error("CLASS ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Error fetching attendance" });
  }
};

/////////////////////////
// GET STUDENT ATTENDANCE
/////////////////////////
export const getStudentAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { studentId } = req.query;

    if (!studentId) {
      res.status(400).json({ message: "studentId is required" });
      return;
    }

    const data = await getStudentAttendanceService(
      studentId as string,
      tenantId
    );

    res.json(data);
  } catch (error) {
    console.error("STUDENT ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Error fetching student attendance" });
  }
};

/////////////////////////
// ATTENDANCE REPORT (Monthly)
/////////////////////////
export const getAttendanceReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { studentId, month, year } = req.query;

    if (!studentId || !month || !year) {
      res.status(400).json({ message: "studentId, month, and year are required" });
      return;
    }

    const report = await getAttendanceReportService(
      studentId as string,
      Number(month),
      Number(year),
      tenantId
    );

    res.json(report);
  } catch (error) {
    console.error("ATTENDANCE REPORT ERROR:", error);
    res.status(500).json({ message: "Error generating report" });
  }
};

/////////////////////////
// ATTENDANCE SUMMARY (Academic Year)
/////////////////////////
export const getAttendanceSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { studentId, academicYearId } = req.query;

    if (!studentId || !academicYearId) {
      res.status(400).json({ message: "studentId and academicYearId are required" });
      return;
    }

    const summary = await getAttendanceSummaryService(
      studentId as string,
      academicYearId as string,
      tenantId
    );

    res.json(summary);
  } catch (error) {
    console.error("ATTENDANCE SUMMARY ERROR:", error);
    res.status(500).json({ message: "Error generating summary" });
  }
};

