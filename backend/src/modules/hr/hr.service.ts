import prisma from "../../config/prisma";
import { calculatePayroll } from "./helpers/payroll.helper";
import { calculateLeaveBalance } from "./helpers/leave.helper";
import { getAttendanceSummary } from "./helpers/staffAttendance.helper";

// ============================================
// STAFF MANAGEMENT
// ============================================

export const createStaff = async (data: any, tenantId: string) => {
  const existing = await prisma.staff.findFirst({
    where: { tenantId, employeeId: data.employeeId, isDeleted: false },
  });
  if (existing) throw new Error("Employee ID already exists");

  return prisma.staff.create({
    data: { ...data, tenantId, joiningDate: new Date(data.joiningDate) },
  });
};

export const getAllStaff = async (tenantId: string, filters?: {
  department?: string;
  designation?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = { tenantId, isDeleted: false };
  if (filters?.department) where.department = filters.department;
  if (filters?.designation) where.designation = filters.designation;
  if (filters?.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { employeeId: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [staff, total] = await Promise.all([
    prisma.staff.findMany({ where, orderBy: { firstName: "asc" }, skip, take: limit }),
    prisma.staff.count({ where }),
  ]);

  return { staff, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getStaffById = async (id: string, tenantId: string) => {
  return prisma.staff.findFirst({
    where: { id, tenantId, isDeleted: false },
    include: { payrolls: { orderBy: { createdAt: "desc" }, take: 5 } },
  });
};

export const updateStaff = async (id: string, data: any, tenantId: string) => {
  return prisma.staff.update({
    where: { id, tenantId },
    data,
  });
};

export const deleteStaff = async (id: string, tenantId: string) => {
  return prisma.staff.update({
    where: { id, tenantId },
    data: { isDeleted: true },
  });
};

// ============================================
// PAYROLL
// ============================================

export const generatePayroll = async (data: any, tenantId: string) => {
  const { staffId, month, year } = data;

  const staff = await prisma.staff.findFirst({ where: { id: staffId, tenantId, isDeleted: false } });
  if (!staff) throw new Error("Staff not found");

  // Check duplicate
  const existing = await prisma.payroll.findFirst({
    where: { staffId, month, year, tenantId },
  });
  if (existing) throw new Error("Payroll already generated for this month");

  const payrollData = calculatePayroll(staff, month, year);

  return prisma.payroll.create({
    data: {
      ...payrollData,
      staffId,
      month,
      year,
      tenantId,
      status: "GENERATED",
    },
  });
};

export const getPayrollList = async (tenantId: string, filters?: {
  month?: number;
  year?: number;
  staffId?: string;
  status?: string;
}) => {
  const where: any = { tenantId };
  if (filters?.month) where.month = filters.month;
  if (filters?.year) where.year = filters.year;
  if (filters?.staffId) where.staffId = filters.staffId;
  if (filters?.status) where.status = filters.status;

  return prisma.payroll.findMany({
    where,
    include: { staff: { select: { firstName: true, lastName: true, employeeId: true, department: true } } },
    orderBy: { createdAt: "desc" },
  });
};

export const getPayslip = async (id: string, tenantId: string) => {
  return prisma.payroll.findFirst({
    where: { id, tenantId },
    include: { staff: true },
  });
};

export const processPayroll = async (id: string, tenantId: string) => {
  return prisma.payroll.update({
    where: { id, tenantId },
    data: { status: "PAID", paidAt: new Date() },
  });
};

// ============================================
// LEAVE MANAGEMENT
// ============================================

export const applyLeave = async (data: any, tenantId: string, userId: string) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  if (endDate < startDate) throw new Error("End date cannot be before start date");

  // Calculate number of days
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return prisma.leaveRequest.create({
    data: {
      staffId: data.staffId,
      tenantId,
      leaveType: data.leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason: data.reason,
      status: "PENDING",
      appliedBy: userId,
    },
  });
};

export const getLeaveRequests = async (tenantId: string, filters?: {
  staffId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const where: any = { tenantId };
  if (filters?.staffId) where.staffId = filters.staffId;
  if (filters?.status) where.status = filters.status;
  if (filters?.startDate || filters?.endDate) {
    where.startDate = {};
    if (filters.startDate) where.startDate.gte = new Date(filters.startDate);
    if (filters.endDate) where.startDate.lte = new Date(filters.endDate);
  }

  return prisma.leaveRequest.findMany({
    where,
    include: { staff: { select: { firstName: true, lastName: true, employeeId: true } } },
    orderBy: { createdAt: "desc" },
  });
};

export const approveLeave = async (id: string, tenantId: string, approvedBy: string, remarks?: string) => {
  return prisma.leaveRequest.update({
    where: { id, tenantId },
    data: { status: "APPROVED", approvedBy, remarks, approvedAt: new Date() },
  });
};

export const rejectLeave = async (id: string, tenantId: string, rejectedBy: string, remarks?: string) => {
  return prisma.leaveRequest.update({
    where: { id, tenantId },
    data: { status: "REJECTED", approvedBy: rejectedBy, remarks, approvedAt: new Date() },
  });
};

export const getLeaveBalance = async (staffId: string, tenantId: string) => {
  const staff = await prisma.staff.findFirst({ where: { id: staffId, tenantId } });
  if (!staff) throw new Error("Staff not found");

  return calculateLeaveBalance(staffId, tenantId);
};

// ============================================
// STAFF ATTENDANCE
// ============================================

export const markStaffAttendance = async (data: any, tenantId: string) => {
  const { staffMembers, date } = data;
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const records = [];
  for (const member of staffMembers) {
    const existing = await prisma.staffAttendance.findFirst({
      where: { staffId: member.staffId, date: attendanceDate, tenantId },
    });

    if (existing) {
      const updated = await prisma.staffAttendance.update({
        where: { id: existing.id },
        data: { status: member.status, checkInTime: member.checkInTime, checkOutTime: member.checkOutTime },
      });
      records.push(updated);
    } else {
      const created = await prisma.staffAttendance.create({
        data: {
          staffId: member.staffId,
          tenantId,
          date: attendanceDate,
          status: member.status,
          checkInTime: member.checkInTime || null,
          checkOutTime: member.checkOutTime || null,
        },
      });
      records.push(created);
    }
  }

  return { message: "Attendance marked successfully", count: records.length };
};

export const getStaffAttendance = async (tenantId: string, filters?: {
  staffId?: string;
  date?: string;
  month?: number;
  year?: number;
}) => {
  const where: any = { tenantId };
  if (filters?.staffId) where.staffId = filters.staffId;

  if (filters?.date) {
    const d = new Date(filters.date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.date = { gte: d, lt: next };
  } else if (filters?.month && filters?.year) {
    const start = new Date(filters.year, filters.month - 1, 1);
    const end = new Date(filters.year, filters.month, 1);
    where.date = { gte: start, lt: end };
  }

  return prisma.staffAttendance.findMany({
    where,
    include: { staff: { select: { firstName: true, lastName: true, employeeId: true, department: true } } },
    orderBy: { date: "desc" },
  });
};

export const getStaffAttendanceReport = async (tenantId: string, month: number, year: number) => {
  return getAttendanceSummary(tenantId, month, year);
};
