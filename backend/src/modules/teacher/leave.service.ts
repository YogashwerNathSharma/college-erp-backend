

import prisma from "../../utils/prisma";
import { getPagination, buildPaginationMeta } from "../../utils/pagination";

//////////////////////////////////////////////////////
// APPLY LEAVE
//////////////////////////////////////////////////////
export const applyLeave = async (data: any, tenantId: string) => {
  // Validate teacher
  const teacher = await prisma.teacher.findFirst({
    where: { id: data.teacherId, tenantId, isDeleted: false },
  });

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  // Validate dates
  const fromDate = new Date(data.fromDate);
  const toDate = new Date(data.toDate);

  if (toDate < fromDate) {
    throw new Error("To date cannot be before from date");
  }

  // Calculate days
  const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Check overlapping leaves
  const overlapping = await prisma.teacherLeave.findFirst({
    where: {
      teacherId: data.teacherId,
      isDeleted: false,
      status: { not: "REJECTED" },
      OR: [
        {
          fromDate: { lte: toDate },
          toDate: { gte: fromDate },
        },
      ],
    },
  });

  if (overlapping) {
    throw new Error("Leave already applied for overlapping dates");
  }

  const leave = await prisma.teacherLeave.create({
    data: {
      teacherId: data.teacherId,
      leaveType: data.leaveType,
      fromDate,
      toDate,
      days,
      reason: data.reason,
      tenantId,
      academicYearId: data.academicYearId,
    },
  });

  return leave;
};

//////////////////////////////////////////////////////
// GET LEAVES (with filters + pagination)
//////////////////////////////////////////////////////
export const getLeaves = async (query: any, tenantId: string) => {
  const { skip, limit, page } = getPagination(query);

  const whereClause: any = {
    tenantId,
    isDeleted: false,
  };

  if (query.teacherId) {
    whereClause.teacherId = query.teacherId;
  }

  if (query.status) {
    whereClause.status = query.status;
  }

  if (query.leaveType) {
    whereClause.leaveType = query.leaveType;
  }

  const [leaves, total] = await Promise.all([
    prisma.teacherLeave.findMany({
      where: whereClause,
      include: {
        teacher: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.teacherLeave.count({ where: whereClause }),
  ]);

  return {
    data: leaves,
    meta: buildPaginationMeta(total, page, limit),
  };
};

//////////////////////////////////////////////////////
// GET LEAVE STATS
//////////////////////////////////////////////////////
export const getLeaveStats = async (tenantId: string, teacherId?: string) => {
  const whereBase: any = { tenantId, isDeleted: false };
  if (teacherId) whereBase.teacherId = teacherId;

  const [total, approved, pending, rejected] = await Promise.all([
    prisma.teacherLeave.count({ where: whereBase }),
    prisma.teacherLeave.count({ where: { ...whereBase, status: "APPROVED" } }),
    prisma.teacherLeave.count({ where: { ...whereBase, status: "PENDING" } }),
    prisma.teacherLeave.count({ where: { ...whereBase, status: "REJECTED" } }),
  ]);

  return { total, approved, pending, rejected };
};

//////////////////////////////////////////////////////
// APPROVE / REJECT LEAVE
//////////////////////////////////////////////////////
export const updateLeaveStatus = async (
  id: string,
  status: "APPROVED" | "REJECTED",
  approvedBy: string,
  tenantId: string
) => {
  const leave = await prisma.teacherLeave.findFirst({
    where: { id, tenantId, isDeleted: false },
  });

  if (!leave) {
    throw new Error("Leave not found");
  }

  if (leave.status !== "PENDING") {
    throw new Error("Leave already processed");
  }

  const updated = await prisma.teacherLeave.update({
    where: { id },
    data: { status, approvedBy },
  });

  return updated;
};

//////////////////////////////////////////////////////
// CANCEL / DELETE LEAVE
//////////////////////////////////////////////////////
export const cancelLeave = async (id: string, tenantId: string) => {
  const leave = await prisma.teacherLeave.findFirst({
    where: { id, tenantId, isDeleted: false },
  });

  if (!leave) {
    throw new Error("Leave not found");
  }

  await prisma.teacherLeave.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

