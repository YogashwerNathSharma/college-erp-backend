import { Request, Response } from "express";
import {
  markAttendanceService,
  getClassAttendanceService,
  getStudentAttendanceService,
  getAttendanceReportService,
} from "./attendance.service";
import { MarkAttendanceBody } from "./attendance.types";

/////////////////////////
// MARK ATTENDANCE
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
// CLASS ATTENDANCE
/////////////////////////
export const getClassAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;

    const { classId, sectionId, date } = req.query;

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
// STUDENT ATTENDANCE
/////////////////////////
export const getStudentAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;

    const { studentId } = req.query;

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
// ATTENDANCE REPORT
/////////////////////////
export const getAttendanceReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;

    const { studentId, month, year } = req.query;

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