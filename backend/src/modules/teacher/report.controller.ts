

import { Request, Response } from "express";
import {
  getTeacherListReport,
  getAttendanceReport,
  getLeaveReport,
  getSalaryReport,
  getPerformanceReport,
  getSubjectAssignmentReport,
} from "./report.service";

// ✅ TEACHER LIST REPORT
export const teacherList = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getTeacherListReport(tenantId);
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("TEACHER LIST REPORT ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ ATTENDANCE REPORT
export const attendance = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { fromDate, toDate, teacherId } = req.query;

    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!fromDate || !toDate) {
      return res.status(400).json({ success: false, message: "Date range required" });
    }

    const data = await getAttendanceReport(
      tenantId,
      fromDate as string,
      toDate as string,
      teacherId as string
    );
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("ATTENDANCE REPORT ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ LEAVE REPORT
export const leave = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { fromDate, toDate, teacherId } = req.query;

    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getLeaveReport(
      tenantId,
      fromDate as string,
      toDate as string,
      teacherId as string
    );
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("LEAVE REPORT ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ SALARY REPORT
export const salary = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { month, year } = req.query;

    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getSalaryReport(
      tenantId,
      month ? parseInt(month as string) : undefined,
      year ? parseInt(year as string) : undefined
    );
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("SALARY REPORT ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ PERFORMANCE REPORT
export const performance = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { academicYearId } = req.query;

    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getPerformanceReport(tenantId, academicYearId as string);
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("PERFORMANCE REPORT ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ SUBJECT ASSIGNMENT REPORT
export const subjectAssignment = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getSubjectAssignmentReport(tenantId);
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("SUBJECT ASSIGNMENT REPORT ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

