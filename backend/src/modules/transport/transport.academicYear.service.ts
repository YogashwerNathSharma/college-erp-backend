import prisma from "../../utils/prisma";

const enrollmentStudentIds = async (tenantId: string, academicYearId: string) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { tenantId, academicYearId, isDeleted: false },
    select: { studentId: true },
  });
  return enrollments.map((e: any) => e.studentId);
};

const ensureContext = (academicYearId: string) => {
  if (!academicYearId) throw new Error("Academic year is required");
};

export const createAssignment = async (tenantId: string, academicYearId: string, data: any) => {
  ensureContext(academicYearId);
  const studentIds = await enrollmentStudentIds(tenantId, academicYearId);
  if (!studentIds.includes(data.studentId)) {
    throw new Error("Student is not enrolled in the selected academic year");
  }

  const existing = await prisma.transportAssignment.findFirst({
    where: { tenantId, academicYearId, studentId: data.studentId, isDeleted: false, status: "ACTIVE" },
  });
  if (existing) throw new Error("Student already has an active transport assignment in this academic year");

  const assignment = await prisma.transportAssignment.create({
    data: {
      studentId: data.studentId,
      studentName: data.studentName,
      classInfo: data.classInfo,
      assignmentType: data.assignmentType,
      monthlyFee: parseFloat(data.monthlyFee) || 0,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: "ACTIVE",
      academicYearId,
      tenant: { connect: { id: tenantId } },
      route: { connect: { id: data.routeId } },
      vehicle: { connect: { id: data.vehicleId } },
      ...(data.stopId ? { stop: { connect: { id: data.stopId } } } : {}),
    } as any,
    include: { route: true, stop: true, vehicle: true },
  });

  if (assignment.monthlyFee > 0) {
    try {
      const { addTransportFeeToStudent } = require("../fees/feeIntegration.service");
      await addTransportFeeToStudent(data.studentId, tenantId, assignment.monthlyFee, assignment.route?.name || "");
    } catch (err) {
      console.error("Auto transport fee add failed (non-blocking):", err);
    }
  }

  return assignment;
};

export const getAllAssignments = async (tenantId: string, academicYearId: string, query: any) => {
  ensureContext(academicYearId);
  const page = query.page || 1;
  const limit = query.limit || 10;
  const where: any = { tenantId, academicYearId, isDeleted: false };
  if (query.search) {
    where.OR = [
      { studentName: { contains: query.search, mode: "insensitive" } },
      { studentId: { contains: query.search, mode: "insensitive" } },
      { classInfo: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.routeId) where.routeId = query.routeId;
  if (query.vehicleId) where.vehicleId = query.vehicleId;
  if (query.status) where.status = query.status;
  if (query.classInfo) where.classInfo = { contains: query.classInfo, mode: "insensitive" };

  const [assignments, total] = await Promise.all([
    prisma.transportAssignment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { route: true, stop: true, vehicle: true },
    }),
    prisma.transportAssignment.count({ where }),
  ]);

  return { assignments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getAssignmentById = async (tenantId: string, academicYearId: string, id: string) => {
  ensureContext(academicYearId);
  return prisma.transportAssignment.findFirst({
    where: { id, tenantId, academicYearId, isDeleted: false },
    include: { route: true, stop: true, vehicle: true },
  });
};

export const updateAssignment = async (tenantId: string, academicYearId: string, id: string, data: any) => {
  ensureContext(academicYearId);
  const assignment = await getAssignmentById(tenantId, academicYearId, id);
  if (!assignment) return null;
  const updateData: any = { ...data };
  delete updateData.academicYearId;
  delete updateData.tenantId;
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);
  return prisma.transportAssignment.update({ where: { id }, data: updateData, include: { route: true, stop: true, vehicle: true } });
};

export const unassignStudent = async (tenantId: string, academicYearId: string, id: string) => {
  ensureContext(academicYearId);
  const assignment = await getAssignmentById(tenantId, academicYearId, id);
  if (!assignment) return null;
  const result = await prisma.transportAssignment.update({
    where: { id },
    data: { status: "INACTIVE", endDate: new Date(), isDeleted: true },
  });
  try {
    const { removeTransportFeeFromStudent } = require("../fees/feeIntegration.service");
    await removeTransportFeeFromStudent(assignment.studentId, tenantId);
  } catch (err) {
    console.error("Auto transport fee remove failed (non-blocking):", err);
  }
  return result;
};

export const markAttendance = async (tenantId: string, academicYearId: string, data: any) => {
  ensureContext(academicYearId);
  const records = data.records as Array<{ assignmentId: string; status: string; type: string; remarks?: string }>;
  const results = [];
  const date = new Date(data.date);
  date.setHours(0, 0, 0, 0);

  for (const record of records) {
    const assignment = await prisma.transportAssignment.findFirst({
      where: { id: record.assignmentId, tenantId, academicYearId, isDeleted: false },
    });
    if (!assignment) throw new Error("Transport assignment does not belong to the selected academic year");

    const existing = await prisma.transportAttendance.findFirst({
      where: { assignmentId: record.assignmentId, date, type: record.type as any, tenantId, isDeleted: false },
    });
    if (existing) {
      results.push(await prisma.transportAttendance.update({
        where: { id: existing.id },
        data: { status: record.status as any, remarks: record.remarks || null, markedBy: data.markedBy },
      }));
    } else {
      results.push(await prisma.transportAttendance.create({
        data: { assignmentId: record.assignmentId, date, status: record.status as any, type: record.type as any, remarks: record.remarks || null, markedBy: data.markedBy, tenantId },
      }));
    }
  }
  return results;
};

export const getAttendanceByDate = async (tenantId: string, academicYearId: string, query: any) => {
  ensureContext(academicYearId);
  const date = new Date(query.date);
  date.setHours(0, 0, 0, 0);
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  const where: any = { tenantId, isDeleted: false, date: { gte: date, lt: nextDay } };
  if (query.type) where.type = query.type;

  const assignmentWhere: any = { tenantId, academicYearId, isDeleted: false, status: "ACTIVE" };
  if (query.routeId) assignmentWhere.routeId = query.routeId;
  const assignmentIds = await prisma.transportAssignment.findMany({ where: assignmentWhere, select: { id: true } });
  where.assignmentId = { in: assignmentIds.map((a) => a.id) };

  return prisma.transportAttendance.findMany({
    where,
    include: { assignment: { include: { route: true, stop: true, vehicle: true } } },
    orderBy: { date: "desc" },
  });
};

export const getDashboardStats = async (tenantId: string, academicYearId: string) => {
  ensureContext(academicYearId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const activeAssignmentWhere = { tenantId, academicYearId, isDeleted: false, status: "ACTIVE" } as any;
  const [totalVehicles, activeRoutes, totalAssignments, assignmentIds, recentAssignments, vehiclesByStatus] = await Promise.all([
    prisma.vehicle.count({ where: { tenantId, isDeleted: false } }),
    prisma.route.count({ where: { tenantId, isDeleted: false, status: "ACTIVE" } }),
    prisma.transportAssignment.count({ where: activeAssignmentWhere }),
    prisma.transportAssignment.findMany({ where: activeAssignmentWhere, select: { id: true } }),
    prisma.transportAssignment.findMany({ where: { tenantId, academicYearId, isDeleted: false }, orderBy: { createdAt: "desc" }, take: 5, include: { route: true, stop: true, vehicle: true } }),
    prisma.vehicle.groupBy({ by: ["status"], where: { tenantId, isDeleted: false }, _count: { id: true } }),
  ]);
  const ids = assignmentIds.map((a) => a.id);
  const [todayAttendance, totalStudentsToday] = await Promise.all([
    prisma.transportAttendance.count({ where: { tenantId, isDeleted: false, date: { gte: today, lt: tomorrow }, status: "PRESENT", assignmentId: { in: ids } } }),
    prisma.transportAttendance.count({ where: { tenantId, isDeleted: false, date: { gte: today, lt: tomorrow }, assignmentId: { in: ids } } }),
  ]);
  return {
    totalVehicles,
    activeRoutes,
    totalAssignments,
    attendancePercentage: totalStudentsToday > 0 ? Math.round((todayAttendance / totalStudentsToday) * 100) : 0,
    recentAssignments,
    vehiclesByStatus: vehiclesByStatus.map((v) => ({ status: v.status, count: v._count.id })),
  };
};
