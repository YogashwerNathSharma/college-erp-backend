import { Request, Response } from "express";
import * as hrService from "./hr.service";

// ============================================
// STAFF MANAGEMENT
// ============================================

export const createStaffHandler = async (req: any, res: Response) => {
  try {
    const result = await hrService.createStaff(req.body, req.tenantId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAllStaffHandler = async (req: any, res: Response) => {
  try {
    const { department, designation, search, page, limit } = req.query;
    const result = await hrService.getAllStaff(req.tenantId, {
      department,
      designation,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getStaffByIdHandler = async (req: any, res: Response) => {
  try {
    const staff = await hrService.getStaffById(req.params.id, req.tenantId);
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });
    res.json({ success: true, data: staff });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateStaffHandler = async (req: any, res: Response) => {
  try {
    const result = await hrService.updateStaff(req.params.id, req.body, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteStaffHandler = async (req: any, res: Response) => {
  try {
    await hrService.deleteStaff(req.params.id, req.tenantId);
    res.json({ success: true, message: "Staff record deleted successfully" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================================
// PAYROLL
// ============================================

export const generatePayrollHandler = async (req: any, res: Response) => {
  try {
    const result = await hrService.generatePayroll(req.body, req.tenantId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getPayrollListHandler = async (req: any, res: Response) => {
  try {
    const { month, year, staffId, status } = req.query;
    const result = await hrService.getPayrollList(req.tenantId, {
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      staffId,
      status,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPayslipHandler = async (req: any, res: Response) => {
  try {
    const result = await hrService.getPayslip(req.params.id, req.tenantId);
    if (!result) return res.status(404).json({ success: false, message: "Payslip not found" });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const processPayrollHandler = async (req: any, res: Response) => {
  try {
    const result = await hrService.processPayroll(req.params.id, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================================
// LEAVE MANAGEMENT
// ============================================

export const applyLeaveHandler = async (req: any, res: Response) => {
  try {
    const result = await hrService.applyLeave(req.body, req.tenantId, req.user?.userId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getLeaveRequestsHandler = async (req: any, res: Response) => {
  try {
    const { staffId, status, startDate, endDate } = req.query;
    const result = await hrService.getLeaveRequests(req.tenantId, { staffId, status, startDate, endDate });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const approveLeaveHandler = async (req: any, res: Response) => {
  try {
    const result = await hrService.approveLeave(req.params.id, req.tenantId, req.user?.userId, req.body.remarks);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const rejectLeaveHandler = async (req: any, res: Response) => {
  try {
    const result = await hrService.rejectLeave(req.params.id, req.tenantId, req.user?.userId, req.body.remarks);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getLeaveBalanceHandler = async (req: any, res: Response) => {
  try {
    const result = await hrService.getLeaveBalance(req.params.staffId, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// STAFF ATTENDANCE
// ============================================

export const markStaffAttendanceHandler = async (req: any, res: Response) => {
  try {
    const result = await hrService.markStaffAttendance(req.body, req.tenantId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getStaffAttendanceHandler = async (req: any, res: Response) => {
  try {
    const { staffId, date, month, year } = req.query;
    const result = await hrService.getStaffAttendance(req.tenantId, { staffId, date, month: month ? parseInt(month) : undefined, year: year ? parseInt(year) : undefined });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getStaffAttendanceReportHandler = async (req: any, res: Response) => {
  try {
    const { month, year } = req.query;
    const result = await hrService.getStaffAttendanceReport(req.tenantId, parseInt(month), parseInt(year));
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
