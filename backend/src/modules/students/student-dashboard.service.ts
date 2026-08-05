// ══════════════════════════════════════════════════════════════════
// ENTERPRISE STUDENT MODULE — Dashboard Service
// ══════════════════════════════════════════════════════════════════

import prisma from "../../utils/prisma";
import {
  DashboardFullData,
  DashboardStats,
  ClassStrengthItem,
  SectionStrengthItem,
  CategoryItem,
  GenderRatioItem,
  MonthlyAdmissionItem,
  StudentGrowthItem,
  RecentAdmissionItem,
  BirthdayStudentItem,
  FeeDefaulterItem,
} from "./student.types";
import { MONTHS } from "./student.constants";

// Statuses that count as "active/enrolled" students
const ACTIVE_STATUSES = ["active", "pending", "verified"] as const;

// ============================================
// GET FULL DASHBOARD DATA (single API call)
// ============================================
export const getFullDashboardData = async (
  tenantId: string,
  academicYearId?: string
): Promise<DashboardFullData> => {
  // Normalize empty string to undefined
  if (!academicYearId) academicYearId = undefined;

  const safeCall = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn(); } catch (e) { console.error("Dashboard sub-query failed:", e); return fallback; }
  };

  const [
    stats,
    classStrength,
    sectionStrength,
    categoryDistribution,
    genderRatio,
    monthlyAdmission,
    studentGrowth,
    recentAdmissions,
    birthdayStudents,
    feeDefaultersList,
  ] = await Promise.all([
    safeCall(() => getDashboardStats(tenantId, academicYearId), {} as DashboardStats),
    safeCall(() => getClassStrength(tenantId, academicYearId), []),
    safeCall(() => getSectionStrength(tenantId, academicYearId), []),
    safeCall(() => getCategoryDistribution(tenantId, academicYearId), []),
    safeCall(() => getGenderRatio(tenantId, academicYearId), { male: 0, female: 0, other: 0, total: 0 } as any),
    safeCall(() => getMonthlyAdmissionTrend(tenantId, academicYearId), []),
    safeCall(() => getStudentGrowth(tenantId), []),
    safeCall(() => getRecentAdmissions(tenantId, 10), []),
    safeCall(() => getBirthdayToday(tenantId), []),
    safeCall(() => getFeeDefaulters(tenantId, academicYearId), []),
  ]);

  return {
    stats,
    classStrength,
    sectionStrength,
    categoryDistribution,
    genderRatio,
    monthlyAdmission,
    studentGrowth,
    admissionTrend: monthlyAdmission,
    recentAdmissions,
    birthdayStudents,
    feeDefaultersList,
  } as any;
};

// ============================================
// DASHBOARD STATS (counts)
// ============================================
export const getDashboardStats = async (
  tenantId: string,
  academicYearId?: string
): Promise<DashboardStats> => {
  const baseWhere: any = { tenantId, isDeleted: false };

  // Filter students by academic year via active enrollments
  if (academicYearId) {
    baseWhere.enrollments = {
      some: {
        academicYearId,
        status: "active",
        isDeleted: false,
      },
    };
  }

  const [
    totalStudents,
    activeStudents,
    inactiveStudents,
    boys,
    girls,
    newAdmissions,
    leavingStudents,
    transportStudents,
    hostelStudents,
    scholarshipStudents,
    feeDefaulters,
    birthdayToday,
  ] = await Promise.all([
    prisma.student.count({ where: baseWhere }),
    // Active = enrolled students (active + pending + verified)
    prisma.student.count({ where: { ...baseWhere, status: { in: [...ACTIVE_STATUSES] } } }),
    prisma.student.count({ where: { ...baseWhere, status: { notIn: [...ACTIVE_STATUSES] } } }),
    prisma.student.count({
      where: { ...baseWhere, status: { in: [...ACTIVE_STATUSES] }, gender: "MALE" },
    }),
    prisma.student.count({
      where: { ...baseWhere, status: { in: [...ACTIVE_STATUSES] }, gender: "FEMALE" },
    }),
    getNewAdmissionsCount(tenantId, 30),
    getLeavingStudentsCount(tenantId, 30),
    getTransportStudentCount(tenantId),
    getHostelStudentCount(tenantId),
    getScholarshipStudentCount(tenantId),
    getFeeDefaulterCount(tenantId, academicYearId),
    getBirthdayTodayCount(tenantId),
  ]);

  return {
    totalStudents,
    activeStudents,
    inactiveStudents,
    newAdmissions,
    leavingStudents,
    boysCount: boys,
    girlsCount: girls,
    transportStudents,
    hostelStudents,
    scholarshipStudents,
    feeDefaulters,
    birthdayToday,
  };
};

// ============================================
// BIRTHDAY TODAY
// ============================================
export const getBirthdayToday = async (tenantId: string): Promise<BirthdayStudentItem[]> => {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  // Fetch all active/enrolled students and filter by DOB day/month in app layer
  // (MongoDB does not support day/month extraction natively via Prisma)
  const students = await prisma.student.findMany({
    where: {
      tenantId,
      isDeleted: false,
      // Include all enrolled students (active + pending + verified)
      status: { in: [...ACTIVE_STATUSES] },
    },
    include: {
      enrollments: {
        where: { status: "active", isDeleted: false },
        include: {
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Filter students whose birthday is today
  const birthdayStudents = students.filter((s) => {
    const dob = new Date(s.dob);
    return dob.getMonth() + 1 === month && dob.getDate() === day;
  });

  return birthdayStudents.map((s) => {
    const enrollment = s.enrollments[0];
    const dob = new Date(s.dob);
    const age = today.getFullYear() - dob.getFullYear();

    return {
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      admissionNo: s.admissionNo,
      className: enrollment?.class?.name || "N/A",
      sectionName: enrollment?.section?.name || "N/A",
      dob: s.dob,
      age,
      photoUrl: s.photoUrl,
      fatherPhone: s.fatherPhone,
    };
  });
};

const getBirthdayTodayCount = async (tenantId: string): Promise<number> => {
  const students = await getBirthdayToday(tenantId);
  return students.length;
};

// ============================================
// CLASS STRENGTH
// ============================================
export const getClassStrength = async (
  tenantId: string,
  academicYearId?: string
): Promise<ClassStrengthItem[]> => {
  const classWhere: any = { tenantId, isDeleted: false };

  const classes = await prisma.class.findMany({
    where: classWhere,
    select: {
      id: true,
      name: true,
      enrollments: {
        where: {
          status: "active",
          isDeleted: false,
          ...(academicYearId ? { academicYearId } : {}),
        },
        include: {
          student: { select: { gender: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return classes.map((c) => {
    const activeEnrollments = c.enrollments.filter(
      (e: any) => e.student && !e.student.isDeleted
    );
    const boys = activeEnrollments.filter((e: any) =>
      e.student.gender === "MALE"
    ).length;
    const girls = activeEnrollments.filter((e: any) =>
      e.student.gender === "FEMALE"
    ).length;

    return {
      classId: c.id,
      className: c.name,
      count: activeEnrollments.length,
      boys,
      girls,
    };
  });
};

// ============================================
// SECTION STRENGTH
// ============================================
export const getSectionStrength = async (
  tenantId: string,
  academicYearId?: string
): Promise<SectionStrengthItem[]> => {
  const sections = await prisma.section.findMany({
    where: { tenantId },
    include: {
      class: { select: { id: true, name: true } },
      enrollments: {
        where: {
          status: "active",
          isDeleted: false,
          ...(academicYearId && { academicYearId }),
        },
        select: { id: true },
      },
    },
    orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
  });

  return sections.map((s) => ({
    classId: s.class?.id || "",
    className: s.class?.name || "N/A",
    sectionId: s.id,
    sectionName: s.name,
    count: s.enrollments.length,
  }));
};

// ============================================
// MONTHLY ADMISSION TREND (Last 12 months)
// ============================================
export const getMonthlyAdmissionTrend = async (
  tenantId: string,
  academicYearId?: string
): Promise<MonthlyAdmissionItem[]> => {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

  // Single DB query — bucket in memory
  const students = await prisma.student.findMany({
    where: {
      tenantId,
      isDeleted: false,
      admissionDate: { gte: twelveMonthsAgo },
      ...(academicYearId && { enrollments: { some: { academicYearId, isDeleted: false } } }),
    },
    select: { admissionDate: true },
  });

  // Build 12-month buckets
  const result: MonthlyAdmissionItem[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = MONTHS[d.getMonth()];
    const year = d.getFullYear();
    const count = students.filter((s) => {
      const admDate = new Date(s.admissionDate);
      return admDate.getMonth() === d.getMonth() && admDate.getFullYear() === d.getFullYear();
    }).length;
    result.push({ month, year, count });
  }

  return result;
};

// ============================================
// STUDENT GROWTH (Year-over-Year)
// Optimized: all 5 years fetched in parallel instead of sequentially
// ============================================
export const getStudentGrowth = async (tenantId: string): Promise<StudentGrowthItem[]> => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

  // Run all year queries in parallel (was sequential — 15 DB calls, now 1 batch)
  const allYearData = await Promise.all(
    years.map(async (year) => {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);

      const [totalStudents, newAdmissions, transfers] = await Promise.all([
        prisma.student.count({
          where: {
            tenantId,
            isDeleted: false,
            admissionDate: { lte: endOfYear },
          },
        }),
        prisma.student.count({
          where: {
            tenantId,
            admissionDate: { gte: startOfYear, lte: endOfYear },
          },
        }),
        prisma.student.count({
          where: {
            tenantId,
            status: "transferred",
            statusChangedAt: { gte: startOfYear, lte: endOfYear },
          },
        }),
      ]);

      return { year, totalStudents, newAdmissions, transfers };
    })
  );

  // Ensure result is sorted by year ascending
  return allYearData.sort((a, b) => a.year - b.year);
};

// ============================================
// TRANSPORT STUDENT COUNT
// ============================================
export const getTransportStudentCount = async (tenantId: string): Promise<number> => {
  try {
    const count = await prisma.transportAssignment.count({
      where: { tenantId, status: "ACTIVE" },
    });
    return count;
  } catch {
    // Model might not exist yet
    return 0;
  }
};

// ============================================
// HOSTEL STUDENT COUNT
// ============================================
export const getHostelStudentCount = async (tenantId: string): Promise<number> => {
  try {
    const count = await prisma.hostelAllocation.count({
      where: { tenantId, status: "ACTIVE" },
    });
    return count;
  } catch {
    return 0;
  }
};

// ============================================
// SCHOLARSHIP STUDENT COUNT
// ============================================
export const getScholarshipStudentCount = async (tenantId: string): Promise<number> => {
  try {
    const count = await prisma.feeDiscount.count({
      where: {
        tenantId,
        isDeleted: false,
        name: { contains: "scholarship", mode: "insensitive" },
      },
    });
    return count;
  } catch {
    return 0;
  }
};

// ============================================
// GENDER RATIO
// ============================================
export const getGenderRatio = async (
  tenantId: string,
  academicYearId?: string
): Promise<GenderRatioItem[]> => {
  // Include all enrolled students (active + pending + verified)
  const where: any = { tenantId, isDeleted: false, status: { in: [...ACTIVE_STATUSES] } };
  if (academicYearId) {
    where.enrollments = {
      some: {
        academicYearId,
        isDeleted: false,
      },
    };
  }

  const students = await prisma.student.findMany({
    where,
    select: { gender: true },
  });

  const total = students.length;
  const maleCount = students.filter((s) => s.gender === "MALE").length;
  const femaleCount = students.filter((s) => s.gender === "FEMALE").length;
  const otherCount = total - maleCount - femaleCount;

  return {
    male: maleCount,
    female: femaleCount,
    other: otherCount,
    total,
  } as any;
};

// ============================================
// CATEGORY DISTRIBUTION
// ============================================
export const getCategoryDistribution = async (
  tenantId: string,
  academicYearId?: string
): Promise<CategoryItem[]> => {
  const where: any = { tenantId, isDeleted: false };
  if (academicYearId) {
    where.enrollments = {
      some: {
        academicYearId,
        isDeleted: false,
      },
    };
  }

  const [students, categories] = await Promise.all([
    prisma.student.findMany({
      where,
      select: { categoryId: true },
    }),
    prisma.category.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    }),
  ]);

  const categoryMap = new Map<string, string>(categories.map((c: any) => [c.id, c.name]));

  const total = students.length;
  const categoryCount: Record<string, number> = {};
  students.forEach((s: any) => {
    const cat: string = s.categoryId ? (categoryMap.get(s.categoryId as string) || "Not Assigned") : "Not Assigned";
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  return Object.entries(categoryCount)
    .map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
};

// ============================================
// NEW ADMISSIONS COUNT (last N days)
// ============================================
export const getNewAdmissionsCount = async (
  tenantId: string,
  days: number = 30
): Promise<number> => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.student.count({
    where: {
      tenantId,
      isDeleted: false,
      admissionDate: { gte: since },
    },
  });
};

// ============================================
// LEAVING STUDENTS COUNT (last N days)
// ============================================
export const getLeavingStudentsCount = async (
  tenantId: string,
  days: number = 30
): Promise<number> => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.student.count({
    where: {
      tenantId,
      status: { in: ["transferred", "dropped", "passed"] },
      updatedAt: { gte: since },
    },
  });
};

// ============================================
// FEE DEFAULTER COUNT
// ============================================
const getFeeDefaulterCount = async (
  tenantId: string,
  academicYearId?: string
): Promise<number> => {
  try {
    const feeDefaulters = await prisma.studentFee.findMany({
      where: {
        tenantId,
        isDeleted: false,
        balanceAmount: { gt: 0 },
        ...(academicYearId && { enrollment: { academicYearId } }),
      },
      select: { enrollmentId: true },
      distinct: ["enrollmentId"],
    });
    return feeDefaulters.length;
  } catch {
    return 0;
  }
};

// ============================================
// FEE DEFAULTERS LIST (Top N)
// ============================================
const getFeeDefaulters = async (
  tenantId: string,
  academicYearId?: string,
  limit: number = 10
): Promise<FeeDefaulterItem[]> => {
  try {
    const studentFees = await prisma.studentFee.findMany({
      where: {
        tenantId,
        isDeleted: false,
        balanceAmount: { gt: 0 },
        ...(academicYearId && { enrollment: { academicYearId } }),
      },
      include: {
        enrollment: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
            class: { select: { name: true } },
          },
        },
      },
    });

    // Aggregate by student
    const studentMap: Record<string, FeeDefaulterItem> = {};
    for (const fee of studentFees) {
      const studentId = fee.enrollment?.student?.id;
      if (!studentId) continue;

      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          id: studentId,
          name: `${fee.enrollment.student.firstName} ${fee.enrollment.student.lastName}`,
          admissionNo: fee.enrollment.student.admissionNo,
          className: fee.enrollment.class?.name || "N/A",
          pendingAmount: 0,
        };
      }
      studentMap[studentId].pendingAmount += fee.balanceAmount;
    }

    return Object.values(studentMap)
      .sort((a, b) => b.pendingAmount - a.pendingAmount)
      .slice(0, limit);
  } catch {
    return [];
  }
};

// ============================================
// RECENT ADMISSIONS
// ============================================
const getRecentAdmissions = async (
  tenantId: string,
  limit: number = 10
): Promise<RecentAdmissionItem[]> => {
  const students = await prisma.student.findMany({
    where: { tenantId, isDeleted: false },
    orderBy: { admissionDate: "desc" },
    take: limit,
    include: {
      enrollments: {
        where: { status: "active", isDeleted: false },
        include: {
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return students.map((s) => {
    const enrollment = s.enrollments[0];
    return {
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      admissionNo: s.admissionNo,
      className: enrollment?.class?.name || "N/A",
      sectionName: enrollment?.section?.name || "N/A",
      date: s.admissionDate,
      photoUrl: s.photoUrl,
    };
  });
};
