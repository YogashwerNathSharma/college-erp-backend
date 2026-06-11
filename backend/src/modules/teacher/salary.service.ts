

import prisma from "../../utils/prisma";
import { getPagination, buildPaginationMeta } from "../../utils/pagination";

//////////////////////////////////////////////////////
// CREATE SALARY RECORD
//////////////////////////////////////////////////////
export const createSalary = async (data: any, tenantId: string) => {
  // Validate teacher
  const teacher = await prisma.teacher.findFirst({
    where: { id: data.teacherId, tenantId, isDeleted: false },
  });

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  // Check duplicate for same month/year
  const existing = await prisma.teacherSalary.findFirst({
    where: {
      teacherId: data.teacherId,
      month: data.month,
      year: data.year,
      tenantId,
      isDeleted: false,
    },
  });

  if (existing) {
    throw new Error("Salary already exists for this month");
  }

  // Calculate totals
  const allowances = data.allowances || [];
  const deductions = data.deductions || [];

  const totalAllowances = allowances.reduce(
    (sum: number, item: any) => sum + (item.amount || 0),
    0
  );
  const totalDeductions = deductions.reduce(
    (sum: number, item: any) => sum + (item.amount || 0),
    0
  );
  const netSalary = data.basicSalary + totalAllowances - totalDeductions;

  const salary = await prisma.teacherSalary.create({
    data: {
      teacherId: data.teacherId,
      month: data.month,
      year: data.year,
      basicSalary: data.basicSalary,
      allowances,
      deductions,
      totalAllowances,
      totalDeductions,
      netSalary,
      tenantId,
      academicYearId: data.academicYearId,
    },
  });

  return salary;
};

//////////////////////////////////////////////////////
// GET SALARIES (with month/year filter)
//////////////////////////////////////////////////////
export const getSalaries = async (query: any, tenantId: string) => {
  const { skip, limit, page } = getPagination(query);

  const whereClause: any = {
    tenantId,
    isDeleted: false,
  };

  if (query.teacherId) whereClause.teacherId = query.teacherId;
  if (query.month) whereClause.month = parseInt(query.month);
  if (query.year) whereClause.year = parseInt(query.year);
  if (query.status) whereClause.status = query.status;

  const [salaries, total] = await Promise.all([
    prisma.teacherSalary.findMany({
      where: whereClause,
      include: {
        teacher: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.teacherSalary.count({ where: whereClause }),
  ]);

  return {
    data: salaries,
    meta: buildPaginationMeta(total, page, limit),
  };
};

//////////////////////////////////////////////////////
// GET PAYSLIP
//////////////////////////////////////////////////////
export const getPayslip = async (
  teacherId: string,
  month: number,
  year: number,
  tenantId: string
) => {
  const salary = await prisma.teacherSalary.findFirst({
    where: {
      teacherId,
      month,
      year,
      tenantId,
      isDeleted: false,
    },
    include: {
      teacher: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!salary) {
    throw new Error("Salary record not found");
  }

  return salary;
};

//////////////////////////////////////////////////////
// UPDATE SALARY
//////////////////////////////////////////////////////
export const updateSalary = async (id: string, data: any, tenantId: string) => {
  const existing = await prisma.teacherSalary.findFirst({
    where: { id, tenantId, isDeleted: false },
  });

  if (!existing) {
    throw new Error("Salary record not found");
  }

  const allowances = data.allowances || existing.allowances;
  const deductions = data.deductions || existing.deductions;
  const basicSalary = data.basicSalary || existing.basicSalary;

  const totalAllowances = (allowances as any[]).reduce(
    (sum: number, item: any) => sum + (item.amount || 0),
    0
  );
  const totalDeductions = (deductions as any[]).reduce(
    (sum: number, item: any) => sum + (item.amount || 0),
    0
  );
  const netSalary = basicSalary + totalAllowances - totalDeductions;

  const updated = await prisma.teacherSalary.update({
    where: { id },
    data: {
      basicSalary,
      allowances,
      deductions,
      totalAllowances,
      totalDeductions,
      netSalary,
      status: data.status || existing.status,
      paidAt: data.status === "PAID" ? new Date() : existing.paidAt,
    },
  });

  return updated;
};

