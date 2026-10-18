import { Response } from "express";
import * as service from "./transport.academicYear.service";

const context = (req: any) => ({ tenantId: req.user?.tenantId, academicYearId: req.academicYearId });

export const getDashboard = async (req: any, res: Response) => {
  try { const { tenantId, academicYearId } = context(req); return res.status(200).json({ success: true, data: await service.getDashboardStats(tenantId, academicYearId) }); }
  catch (error: any) { return res.status(500).json({ success: false, message: error.message || "Failed to fetch dashboard data" }); }
};

export const createAssignment = async (req: any, res: Response) => {
  try { const { tenantId, academicYearId } = context(req); return res.status(201).json({ success: true, data: await service.createAssignment(tenantId, academicYearId, req.body), message: "Student assigned successfully" }); }
  catch (error: any) { return res.status(400).json({ success: false, message: error.message || "Failed to create assignment" }); }
};

export const getAllAssignments = async (req: any, res: Response) => {
  try {
    const { tenantId, academicYearId } = context(req);
    const { page, limit, search, routeId, vehicleId, status, classInfo } = req.query;
    const data = await service.getAllAssignments(tenantId, academicYearId, { page: page ? parseInt(page) : undefined, limit: limit ? parseInt(limit) : undefined, search, routeId, vehicleId, status, classInfo });
    return res.status(200).json({ success: true, data });
  } catch (error: any) { return res.status(400).json({ success: false, message: error.message || "Failed to fetch assignments" }); }
};

export const getAssignmentById = async (req: any, res: Response) => {
  try { const { tenantId, academicYearId } = context(req); const assignment = await service.getAssignmentById(tenantId, academicYearId, req.params.id); if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" }); return res.status(200).json({ success: true, data: assignment }); }
  catch (error: any) { return res.status(400).json({ success: false, message: error.message || "Failed to fetch assignment" }); }
};

export const updateAssignment = async (req: any, res: Response) => {
  try { const { tenantId, academicYearId } = context(req); const assignment = await service.updateAssignment(tenantId, academicYearId, req.params.id, req.body); if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" }); return res.status(200).json({ success: true, data: assignment, message: "Assignment updated successfully" }); }
  catch (error: any) { return res.status(400).json({ success: false, message: error.message || "Failed to update assignment" }); }
};

export const unassignStudent = async (req: any, res: Response) => {
  try { const { tenantId, academicYearId } = context(req); const assignment = await service.unassignStudent(tenantId, academicYearId, req.params.id); if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" }); return res.status(200).json({ success: true, message: "Student unassigned successfully" }); }
  catch (error: any) { return res.status(400).json({ success: false, message: error.message || "Failed to unassign student" }); }
};

export const markAttendance = async (req: any, res: Response) => {
  try { const { tenantId, academicYearId } = context(req); const records = await service.markAttendance(tenantId, academicYearId, { ...req.body, markedBy: req.user?.id || req.user?.userId }); return res.status(200).json({ success: true, data: records, message: "Attendance marked successfully" }); }
  catch (error: any) { return res.status(400).json({ success: false, message: error.message || "Failed to mark attendance" }); }
};

export const getAttendance = async (req: any, res: Response) => {
  try { const { tenantId, academicYearId } = context(req); if (!req.query.date) return res.status(400).json({ success: false, message: "Date is required" }); const data = await service.getAttendanceByDate(tenantId, academicYearId, { date: req.query.date, routeId: req.query.routeId, type: req.query.type }); return res.status(200).json({ success: true, data }); }
  catch (error: any) { return res.status(400).json({ success: false, message: error.message || "Failed to fetch attendance" }); }
};
