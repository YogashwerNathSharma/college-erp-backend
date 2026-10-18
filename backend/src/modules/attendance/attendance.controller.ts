

import { Request, Response } from "express";
import { cacheAside, invalidateCache } from "../../utils/cache";
import {
  markAttendanceService,
  updateAttendanceService,
  getClassAttendanceService,
  getStudentAttendanceService,
  getAttendanceReportService,
  getAttendanceSummaryService,
} from "./attendance.service";
import { getAttendanceDashboardPerformance } from "./attendance.dashboard.performance.service";
import { MarkAttendanceBody, UpdateAttendanceBody } from "./attendance.types";

// ⚡ Cache TTL: 30 minutes
const ATTENDANCE_DASH_CACHE_TTL = 1800;

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const academicYearId = (req as any).academicYearId || req.query.academicYearId;
    if (!tenantId) return void res.status(401).json({ message: "Unauthorized" });
    if (!academicYearId) return void res.status(400).json({ message: "academicYearId is required" });
    const forceRefresh = (req.query as any).refresh === "true";
    const cacheKey = `attendance:dash:${tenantId}:${academicYearId}`;
    if (forceRefresh) await invalidateCache(cacheKey).catch(() => {});
    const stats = await cacheAside(cacheKey, () => getAttendanceDashboardPerformance(tenantId, academicYearId as string), ATTENDANCE_DASH_CACHE_TTL);
    res.json(stats);
  } catch (error) {
    console.error("DASHBOARD STATS ERROR:", error);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};

export const markAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return void res.status(401).json({ message: "Unauthorized" });
    const body = req.body as MarkAttendanceBody;
    if (!body.academicYearId) body.academicYearId = (req as any).academicYearId;
    if (!body.academicYearId) return void res.status(400).json({ message: "academicYearId is required" });
    res.json(await markAttendanceService(body, tenantId));
  } catch (error) {
    console.error("MARK ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Error marking attendance" });
  }
};

export const updateAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return void res.status(401).json({ message: "Unauthorized" });
    const body = req.body as UpdateAttendanceBody;
    if (!body.academicYearId) body.academicYearId = (req as any).academicYearId;
    if (!body.academicYearId) return void res.status(400).json({ message: "academicYearId is required" });
    res.json(await updateAttendanceService(body, tenantId));
  } catch (error) {
    console.error("UPDATE ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Error updating attendance" });
  }
};

export const getClassAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { classId, sectionId, date } = req.query;
    const academicYearId = (req as any).academicYearId || req.query.academicYearId;
    if (!classId || !sectionId || !date) return void res.status(400).json({ message: "classId, sectionId, and date are required" });
    res.json(await getClassAttendanceService(classId as string, sectionId as string, date as string, tenantId, academicYearId as string));
  } catch (error) {
    console.error("CLASS ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Error fetching attendance" });
  }
};

export const getStudentAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { studentId } = req.query;
    const academicYearId = (req as any).academicYearId || req.query.academicYearId;
    if (!studentId) return void res.status(400).json({ message: "studentId is required" });
    res.json(await getStudentAttendanceService(studentId as string, tenantId, academicYearId as string));
  } catch (error) {
    console.error("STUDENT ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Error fetching student attendance" });
  }
};

export const getAttendanceReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { studentId, month, year } = req.query;
    const academicYearId = (req as any).academicYearId || req.query.academicYearId;
    if (!studentId || !month || !year) return void res.status(400).json({ message: "studentId, month, and year are required" });
    res.json(await getAttendanceReportService(studentId as string, Number(month), Number(year), tenantId, academicYearId as string));
  } catch (error) {
    console.error("ATTENDANCE REPORT ERROR:", error);
    res.status(500).json({ message: "Error generating report" });
  }
};

export const getAttendanceSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { studentId } = req.query;
    const academicYearId = (req.query.academicYearId || (req as any).academicYearId) as string;
    if (!studentId || !academicYearId) return void res.status(400).json({ message: "studentId and academicYearId are required" });
    res.json(await getAttendanceSummaryService(studentId as string, academicYearId, tenantId));
  } catch (error) {
    console.error("ATTENDANCE SUMMARY ERROR:", error);
    res.status(500).json({ message: "Error generating summary" });
  }
};
