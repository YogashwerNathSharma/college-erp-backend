

import { Request, Response } from "express";
import { cacheAside, invalidateCache } from "../../utils/cache";
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

// ⚡ Cache TTL: 30 minutes
const ATTENDANCE_DASH_CACHE_TTL = 1800;

/////////////////////////
// DASHBOARD STATS
// ✅ FIXED: Uses req.academicYearId from middleware as primary source
/////////////////////////
export const getDashboardStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    // ✅ Primary: middleware-injected academicYearId, fallback: query param
    const academicYearId = (req as any).academicYearId || req.query.academicYearId;

    if (!academicYearId) {
      res.status(400).json({ message: "academicYearId is required" });
      return;
    }

    // ⚡ PERF: 30-min cache + refresh support
    const forceRefresh = (req.query as any).refresh === "true";
    const cacheKey = `attendance:dash:${tenantId}:${academicYearId}`;

    if (forceRefresh) {
      await invalidateCache(cacheKey).catch(() => {});
      console.log(`🔄 Attendance Dashboard cache cleared`);
    }

    const stats = await cacheAside(cacheKey, () =>
      getDashboardStatsService(tenantId, academicYearId as string),
      ATTENDANCE_DASH_CACHE_TTL
    );

    res.json(stats);
  } catch (error) {
    console.error("DASHBOARD STATS ERROR:", error);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};

/////////////////////////
// MARK ATTENDANCE (Bulk)
// ✅ FIXED: Ensures academicYearId is injected from middleware if missing in body
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

    // ✅ Ensure academicYearId from middleware is used if not in body
    const body = req.body as MarkAttendanceBody;
    if (!body.academicYearId) {
      body.academicYearId = (req as any).academicYearId;
    }

    if (!body.academicYearId) {
      res.status(400).json({ message: "academicYearId is required" });
      return;
    }

    const result = await markAttendanceService(body, tenantId);

    res.json(result);
  } catch (error) {
    console.error("MARK ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Error marking attendance" });
  }
};

/////////////////////////
// UPDATE ATTENDANCE (Edit)
// ✅ FIXED: Ensures academicYearId is injected from middleware if missing in body
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

    // ✅ Ensure academicYearId from middleware is used if not in body
    const body = req.body as UpdateAttendanceBody;
    if (!body.academicYearId) {
      body.academicYearId = (req as any).academicYearId;
    }

    if (!body.academicYearId) {
      res.status(400).json({ message: "academicYearId is required" });
      return;
    }

    const result = await updateAttendanceService(body, tenantId);

    res.json(result);
  } catch (error) {
    console.error("UPDATE ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Error updating attendance" });
  }
};

/////////////////////////
// GET CLASS ATTENDANCE
// ✅ FIXED: Passes academicYearId to service for enrollment scoping
/////////////////////////
export const getClassAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { classId, sectionId, date } = req.query;
    const academicYearId = (req as any).academicYearId || req.query.academicYearId;

    if (!classId || !sectionId || !date) {
      res.status(400).json({ message: "classId, sectionId, and date are required" });
      return;
    }

    const data = await getClassAttendanceService(
      classId as string,
      sectionId as string,
      date as string,
      tenantId,
      academicYearId as string
    );

    res.json(data);
  } catch (error) {
    console.error("CLASS ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Error fetching attendance" });
  }
};

/////////////////////////
// GET STUDENT ATTENDANCE
// ✅ FIXED: Passes academicYearId for year-scoped history
/////////////////////////
export const getStudentAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { studentId } = req.query;
    const academicYearId = (req as any).academicYearId || req.query.academicYearId;

    if (!studentId) {
      res.status(400).json({ message: "studentId is required" });
      return;
    }

    const data = await getStudentAttendanceService(
      studentId as string,
      tenantId,
      academicYearId as string
    );

    res.json(data);
  } catch (error) {
    console.error("STUDENT ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Error fetching student attendance" });
  }
};

/////////////////////////
// ATTENDANCE REPORT (Monthly)
// ✅ FIXED: Passes academicYearId for year-scoped report
/////////////////////////
export const getAttendanceReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { studentId, month, year } = req.query;
    const academicYearId = (req as any).academicYearId || req.query.academicYearId;

    if (!studentId || !month || !year) {
      res.status(400).json({ message: "studentId, month, and year are required" });
      return;
    }

    const report = await getAttendanceReportService(
      studentId as string,
      Number(month),
      Number(year),
      tenantId,
      academicYearId as string
    );

    res.json(report);
  } catch (error) {
    console.error("ATTENDANCE REPORT ERROR:", error);
    res.status(500).json({ message: "Error generating report" });
  }
};

/////////////////////////
// ATTENDANCE SUMMARY (Academic Year)
// ✅ Uses academicYearId from middleware as fallback
/////////////////////////
export const getAttendanceSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { studentId } = req.query;
    const academicYearId = (req.query.academicYearId || (req as any).academicYearId) as string;

    if (!studentId || !academicYearId) {
      res.status(400).json({ message: "studentId and academicYearId are required" });
      return;
    }

    const summary = await getAttendanceSummaryService(
      studentId as string,
      academicYearId,
      tenantId
    );

    res.json(summary);
  } catch (error) {
    console.error("ATTENDANCE SUMMARY ERROR:", error);
    res.status(500).json({ message: "Error generating summary" });
  }
};
