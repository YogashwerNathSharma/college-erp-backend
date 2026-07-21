// ══════════════════════════════════════════════════════════════════
// ENTERPRISE STUDENT MODULE — Dashboard Service
// ══════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
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

const prisma = new PrismaClient();

// ============================================
// GET FULL DASHBOARD DATA (single API call)
// ============================================
export const getFullDashboardData = async (
  tenantId: string,
  academicYearId?: string
): Promise<DashboardFullData> => {
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
    getDashboardStats(tenantId, academicYearId),
    getClassStrength(tenantId, academicYearId),
    getSectionStrength(tenantId, academicYearId),
    getCategoryDistribution(tenantId, academicYearId),
    getGenderRatio(tenantId, academicYearId),
    getMonthlyAdmissionTrend(tenantId, academicYearId),
    getStudentGrowth(tenantId),
    getRecentAdmissions(tenantId, 10),
    getBirthdayToday(tenantId),
    getFeeDefaulters(tenantId, academicYearId),
  ]);

  return {
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
  };
};

// ============================================
// DASHBOARD STATS (counts)
// ============================================
const getDashboardStats = async (
  tenantId: string,
  academicYearId?: string
): Promise<DashboardStats> => {
  const baseWhere: any = { tenantId, isDeleted: false };
  if (academicYearId) baseWhere.academicYearId = academicYearId;

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
    prisma.student.count({ where: { ...baseWhere, status: "active" } }),
    prisma.student.count({ where: { ...baseWhere, status: { not: "active" } } }),
    prisma.student.count({
      where: { ...baseWhere, gender: { in: ["Male", "male", "M", "MALE"] } },
    }),
    prisma.student.count({
      where: { ...baseWhere, gender: { in: ["Female", "female", "F", "FEMALE"] } },
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
    boys,
    girls,
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

  // MongoDB aggregation to match day and month of DOB
  const students = await prisma.student.findMany({
    where: {
      tenantId,
      isDeleted: false,
      status: "active",
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

  // Filter in application layer for DOB day/month match
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
  const classes = await prisma.class.findMany({
    where: { tenantId, isDeleted: false },
    select: {
      id: true,
      name: true,
      enrollments: {
        where: {
          isDeleted: false,
          status: "active",
          ...(academicYearId && { academicYearId }),
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
      ["Male", "male", "M", "MALE"].includes(e.student.gender)
    ).length;
    const girls = activeEnrollments.filter((e: any) =>
      ["Female", "female", "F", "FEMALE"].includes(e.student.gender)
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
    where: { tenantId, isDeleted: false },
    include: {
      class: { select: { id: true, name: true } },
      enrollments: {
        where: {
          isDeleted: false,
          status: "active",
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

  const students = await prisma.student.findMany({
    where: {
      tenantId,
      isDeleted: false,
      admissionDate: { gte: twelveMonthsAgo },
      ...(academicYearId && { academicYearId }),
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
// ============================================
export const getStudentGrowth = async (tenantId: string): Promise<StudentGrowthItem[]> => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

  const result: StudentGrowthItem[] = [];

  for (const year of years) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const [totalStudents, newAdmissions, transfers] = await Promise.all([
      prisma.student.count({
        where: {
          tenantId,
          isDeleted: false,
          createdAt: { lte: endOfYear },
          OR: [{ deletedAt: null }, { deletedAt: { gt: endOfYear } }],
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

    result.push({ year, totalStudents, newAdmissions, transfers });
  }

  return result;
};

// ============================================
// TRANSPORT STUDENT COUNT
// ============================================
export const getTransportStudentCount = async (tenantId: string): Promise<number> => {
  try {
    const count = await prisma.transportAssignment.count({
      where: { tenantId, isActive: true },
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
      where: { tenantId, status: "active" },
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
        type: { in: ["scholarship", "Scholarship", "SCHOLARSHIP"] },
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
  const where: any = { tenantId, isDeleted: false, status: "active" };
  if (academicYearId) where.academicYearId = academicYearId;

  const students = await prisma.student.findMany({
    where,
    select: { gender: true },
  });

  const total = students.length;
  const maleCount = students.filter((s) =>
    ["Male", "male", "M", "MALE"].includes(s.gender)
  ).length;
  const femaleCount = students.filter((s) =>
    ["Female", "female", "F", "FEMALE"].includes(s.gender)
  ).length;
  const otherCount = total - maleCount - femaleCount;

  const result: GenderRatioItem[] = [
    { gender: "Male", count: maleCount, percentage: total > 0 ? Math.round((maleCount / total) * 100) : 0 },
    { gender: "Female", count: femaleCount, percentage: total > 0 ? Math.round((femaleCount / total) * 100) : 0 },
  ];

  if (otherCount > 0) {
    result.push({ gender: "Other", count: otherCount, percentage: Math.round((otherCount / total) * 100) });
  }

  return result;
};

// ============================================
// CATEGORY DISTRIBUTION
// ============================================
const getCategoryDistribution = async (
  tenantId: string,
  academicYearId?: string
): Promise<CategoryItem[]> => {
  const where: any = { tenantId, isDeleted: false };
  if (academicYearId) where.academicYearId = academicYearId;

  const students = await prisma.student.findMany({
    where,
    select: { category: true },
  });

  const total = students.length;
  const categoryCount: Record<string, number> = {};
  students.forEach((s) => {
    const cat = s.category || "General";
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  return Object.entries(categoryCount)
    .map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
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
        ...(academicYearId && { enrollment: { academicYearId, isDeleted: false } }),
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
