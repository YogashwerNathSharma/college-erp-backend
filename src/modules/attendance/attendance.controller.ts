import { Request, Response } from "express";
import {
  markAttendanceService,
  getClassAttendanceService,
  getStudentAttendanceService,
  getAttendanceReportService,
} from "./attendance.service";
import { MarkAttendanceBody } from "./attendance.types";

interface AuthRequest extends Request {
  user?: {
    tenantId: string;
  };
}

export const markAttendance = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
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
    res.status(500).json({ message: "Error marking attendance" });
  }
};

export const getClassAttendance = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { classId, sectionId, date } = req.query;
    const tenantId = req.user?.tenantId!;

    const data = await getClassAttendanceService(
      classId as string,
      sectionId as string,
      date as string,
      tenantId
    );

    res.json(data);
  } catch {
    res.status(500).json({ message: "Error fetching attendance" });
  }
};

export const getStudentAttendance = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { studentId } = req.query;
    const tenantId = req.user?.tenantId!;

    const data = await getStudentAttendanceService(
      studentId as string,
      tenantId
    );

    res.json(data);
  } catch {
    res.status(500).json({ message: "Error fetching student attendance" });
  }
};

export const getAttendanceReport = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { studentId, month, year } = req.query;
    const tenantId = req.user?.tenantId!;

    const report = await getAttendanceReportService(
      studentId as string,
      Number(month),
      Number(year),
      tenantId
    );

    res.json(report);
  } catch {
    res.status(500).json({ message: "Error generating report" });
  }
};