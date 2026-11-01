/**
 * 📊 Excel Export Controller
 *
 * GET /api/report/students/export  — Student list Excel
 * GET /api/report/fees/export      — Fee collection Excel
 * GET /api/report/attendance/export — Attendance Excel
 */

import { Response } from "express";
import {
  exportStudentsExcel,
  exportFeesExcel,
  exportAttendanceExcel,
} from "./excel-export.service";

export const exportStudentsHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || req.tenantId;
    if (!tenantId) return res.status(400).json({ success: false, message: "Tenant ID required" });

    const { classId, sectionId, academicYearId } = req.query;
    const result = await exportStudentsExcel(tenantId, {
      classId,
      sectionId,
      academicYearId: academicYearId || (req as any).academicYearId,
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    return res.send(result.buffer);
  } catch (err: any) {
    console.error("Student export error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const exportFeesHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || req.tenantId;
    if (!tenantId) return res.status(400).json({ success: false, message: "Tenant ID required" });

    const { classId, month, year, status, academicYearId } = req.query;
    const result = await exportFeesExcel(tenantId, {
      classId,
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      status,
      academicYearId: academicYearId || (req as any).academicYearId,
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    return res.send(result.buffer);
  } catch (err: any) {
    console.error("Fee export error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const exportAttendanceHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || req.tenantId;
    if (!tenantId) return res.status(400).json({ success: false, message: "Tenant ID required" });

    const { classId, sectionId, month, year, academicYearId } = req.query;
    const result = await exportAttendanceExcel(tenantId, {
      classId,
      sectionId,
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      academicYearId: academicYearId || (req as any).academicYearId,
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    return res.send(result.buffer);
  } catch (err: any) {
    console.error("Attendance export error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
