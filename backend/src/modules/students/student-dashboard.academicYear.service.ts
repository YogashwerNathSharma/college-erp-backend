import prisma from "../../utils/prisma";
import { getFullDashboardData } from "./student-dashboard.service";

/**
 * Production-safe academic-year adapter for the student dashboard.
 *
 * The existing dashboard service is intentionally left intact. This adapter
 * corrects the remaining cross-year aggregate counts without rewriting the
 * large dashboard implementation.
 */
export const getFullDashboardDataAcademicYear = async (
  tenantId: string,
  academicYearId: string
) => {
  if (!tenantId || !academicYearId) {
    throw new Error("Academic year context is required");
  }

  const base = await getFullDashboardData(tenantId, academicYearId);

  const [transportStudents, hostelStudents] = await Promise.all([
    prisma.transportAssignment.count({
      where: {
        tenantId,
        academicYearId,
        status: "ACTIVE",
      },
    }).catch(() => 0),
    prisma.hostelAllocation.count({
      where: {
        tenantId,
        academicYearId,
        status: "ACTIVE",
      },
    }).catch(() => 0),
  ]);

  return {
    ...base,
    stats: {
      ...base.stats,
      transportStudents,
      hostelStudents,
    },
  };
};

export const getTransportStudentCountAcademicYear = async (
  tenantId: string,
  academicYearId: string
): Promise<number> => {
  if (!tenantId || !academicYearId) throw new Error("Academic year context is required");
  return prisma.transportAssignment.count({
    where: { tenantId, academicYearId, status: "ACTIVE" },
  });
};

export const getHostelStudentCountAcademicYear = async (
  tenantId: string,
  academicYearId: string
): Promise<number> => {
  if (!tenantId || !academicYearId) throw new Error("Academic year context is required");
  return prisma.hostelAllocation.count({
    where: { tenantId, academicYearId, status: "ACTIVE" },
  });
};
