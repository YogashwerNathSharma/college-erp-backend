
import prisma from "../../utils/prisma";
import { getPagination, buildPaginationMeta } from "../../utils/pagination";

//////////////////////////////////////////////////////
// CREATE / UPDATE PERFORMANCE EVALUATION
//////////////////////////////////////////////////////
export const createPerformance = async (data: any, tenantId: string) => {
  // Validate teacher
  const teacher = await prisma.teacher.findFirst({
    where: { id: data.teacherId, tenantId, isDeleted: false },
  });

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  // Check if evaluation already exists for this teacher + academic year
  const existing = await prisma.teacherPerformance.findFirst({
    where: {
      teacherId: data.teacherId,
      academicYearId: data.academicYearId,
      tenantId,
      isDeleted: false,
    },
  });

  const parameters = data.parameters || [];
  const overallRating =
    parameters.length > 0
      ? parameters.reduce((sum: number, p: any) => sum + (p.rating || 0), 0) /
        parameters.length
      : 0;

  if (existing) {
    // Update existing
    const updated = await prisma.teacherPerformance.update({
      where: { id: existing.id },
      data: {
        parameters,
        overallRating: Math.round(overallRating * 10) / 10,
        remarks: data.remarks,
        evaluatedBy: data.evaluatedBy,
      },
    });
    return updated;
  }

  // Create new
  const performance = await prisma.teacherPerformance.create({
    data: {
      teacherId: data.teacherId,
      academicYearId: data.academicYearId,
      tenantId,
      parameters,
      overallRating: Math.round(overallRating * 10) / 10,
      remarks: data.remarks,
      evaluatedBy: data.evaluatedBy,
    },
  });

  return performance;
};

//////////////////////////////////////////////////////
// GET PERFORMANCE BY TEACHER
//////////////////////////////////////////////////////
export const getPerformanceByTeacher = async (
  teacherId: string,
  academicYearId: string,
  tenantId: string
) => {
  const performance = await prisma.teacherPerformance.findFirst({
    where: {
      teacherId,
      academicYearId,
      tenantId,
      isDeleted: false,
    },
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      academicYear: { select: { id: true, name: true } },
    },
  });

  return performance;
};

//////////////////////////////////////////////////////
// GET ALL PERFORMANCES
//////////////////////////////////////////////////////
export const getAllPerformances = async (query: any, tenantId: string) => {
  const { skip, limit, page } = getPagination(query);

  const whereClause: any = {
    tenantId,
    isDeleted: false,
  };

  if (query.academicYearId) {
    whereClause.academicYearId = query.academicYearId;
  }

  const [performances, total] = await Promise.all([
    prisma.teacherPerformance.findMany({
      where: whereClause,
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        academicYear: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.teacherPerformance.count({ where: whereClause }),
  ]);

  return {
    data: performances,
    meta: buildPaginationMeta(total, page, limit),
  };
};

