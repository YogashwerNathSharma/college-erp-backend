import { Response } from "express";
import prisma from "../../utils/prisma";

// ══════════════════════════════════════════════════════════════════
// STUDENT DASHBOARD CONTROLLER
// ══════════════════════════════════════════════════════════════════

/**
 * GET /api/students/dashboard/full
 * Returns complete dashboard data in a single API call
 */
export const getFullDashboardHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { academicYearId } = req.query;

    const [
      totalStudents,
      activeStudents,
      inactiveStudents,
      maleStudents,
      femaleStudents,
      transportCount,
      hostelCount,
      birthdayToday,
      recentAdmissions,
      classStrength,
      sectionStrength,
      categoryDistribution,
      monthlyAdmission,
      genderRatio,
      feeDefaulters,
      leavingStudents,
    ] = await Promise.all([
      // Total students
      prisma.student.count({
        where: { tenantId, isDeleted: false, ...(academicYearId && { academicYearId }) },
      }),
      // Active students
      prisma.student.count({
        where: { tenantId, isDeleted: false, status: "ACTIVE", ...(academicYearId && { academicYearId }) },
      }),
      // Inactive students
      prisma.student.count({
        where: { tenantId, isDeleted: false, status: { not: "active" }, ...(academicYearId && { academicYearId }) },
      }),
      // Male students
      prisma.student.count({
        where: { tenantId, isDeleted: false, gender: { in: ["Male", "male", "M", "MALE"] }, ...(academicYearId && { academicYearId }) },
      }),
      // Female students
      prisma.student.count({
        where: { tenantId, isDeleted: false, gender: { in: ["Female", "female", "F", "FEMALE"] }, ...(academicYearId && { academicYearId }) },
      }),
      // Transport students count
      prisma.transportAssignment.count({
        where: { tenantId, status: "ACTIVE", isDeleted: false },
      }).catch(() => 0),
      // Hostel students count
      prisma.hostelAllocation.count({
        where: { tenantId, status: "ACTIVE" },
      }).catch(() => 0),
      // Birthday today
      getBirthdayTodayData(tenantId),
      // Recent admissions (last 30 days)
      prisma.student.count({
        where: {
          tenantId,
          isDeleted: false,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          ...(academicYearId && { academicYearId }),
        },
      }),
      // Class strength
      getClassStrengthData(tenantId, academicYearId),
      // Section strength
      getSectionStrengthData(tenantId, academicYearId),
      // Category distribution
      getCategoryDistributionData(tenantId, academicYearId),
      // Monthly admission trend
      getMonthlyAdmissionData(tenantId, academicYearId),
      // Gender ratio
      getGenderRatioData(tenantId, academicYearId),
      // Fee defaulters count
      prisma.studentFee.count({
        where: { tenantId, isDeleted: false, balanceAmount: { gt: 0 } },
      }).catch(() => 0),
      // Leaving students (last 30 days)
      prisma.student.count({
        where: {
          tenantId,
          isDeleted: false,
          status: { in: ["transferred", "dropped", "passed"] },
          statusChangedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }).catch(() => 0),
    ]);

    // Scholarship count (students who have scholarship fee discounts)
    const scholarshipCount = await prisma.feeDiscount.count({
      where: { tenantId, isDeleted: false, name: { contains: "scholarship", mode: "insensitive" } },
    }).catch(() => 0);

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          activeStudents,
          inactiveStudents,
          newAdmissions: recentAdmissions,
          leavingStudents,
          boys: maleStudents,
          girls: femaleStudents,
          transportStudents: transportCount,
          hostelStudents: hostelCount,
          scholarshipStudents: scholarshipCount,
          feeDefaulters,
          birthdayTodayCount: birthdayToday.length,
        },
        birthdayToday,
        classStrength,
        sectionStrength,
        categoryDistribution,
        monthlyAdmission,
        genderRatio,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/dashboard/birthday-today
 */
export const getBirthdayTodayHandler = async (req: any, res: Response) => {
  try {
    const data = await getBirthdayTodayData(req.tenantId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/dashboard/section-strength
 */
export const getSectionStrengthHandler = async (req: any, res: Response) => {
  try {
    const data = await getSectionStrengthData(req.tenantId, req.query.academicYearId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/dashboard/monthly-admission
 */
export const getMonthlyAdmissionHandler = async (req: any, res: Response) => {
  try {
    const data = await getMonthlyAdmissionData(req.tenantId, req.query.academicYearId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/dashboard/student-growth
 */
export const getStudentGrowthHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;

    // Get student counts for last 5 years
    const currentYear = new Date().getFullYear();
    const growthData: { year: number; count: number }[] = [];

    for (let i = 4; i >= 0; i--) {
      const year = currentYear - i;
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);

      const count = await prisma.student.count({
        where: {
          tenantId,
          isDeleted: false,
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      growthData.push({ year, count });
    }

    // Calculate cumulative totals
    let cumulative = 0;
    const cumulativeData = growthData.map((item) => {
      cumulative += item.count;
      return { year: item.year, newAdmissions: item.count, totalStrength: cumulative };
    });

    res.json({ success: true, data: cumulativeData });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/dashboard/transport-count
 */
export const getTransportCountHandler = async (req: any, res: Response) => {
  try {
    const count = await prisma.transportAssignment.count({
      where: { tenantId: req.tenantId, status: "ACTIVE", isDeleted: false },
    }).catch(() => 0);

    res.json({ success: true, data: { count } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/dashboard/hostel-count
 */
export const getHostelCountHandler = async (req: any, res: Response) => {
  try {
    const count = await prisma.hostelAllocation.count({
      where: { tenantId: req.tenantId, status: "ACTIVE" },
    }).catch(() => 0);

    res.json({ success: true, data: { count } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/dashboard/scholarship-count
 */
export const getScholarshipCountHandler = async (req: any, res: Response) => {
  try {
    const count = await prisma.feeDiscount.count({
      where: { tenantId: req.tenantId, isDeleted: false, name: { contains: "scholarship", mode: "insensitive" } },
    }).catch(() => 0);

    res.json({ success: true, data: { count } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/dashboard/gender-ratio
 */
export const getGenderRatioHandler = async (req: any, res: Response) => {
  try {
    const data = await getGenderRatioData(req.tenantId, req.query.academicYearId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════

async function getBirthdayTodayData(tenantId: string) {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  // MongoDB date matching for birthday — get all students and filter by month/day
  const students = await prisma.student.findMany({
    where: { tenantId, isDeleted: false, status: "ACTIVE" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      dob: true,
      photoUrl: true,
      admissionNo: true,
      enrollments: {
        where: { status: "ACTIVE", isDeleted: false },
        select: {
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Filter students whose birthday is today
  const birthdayStudents = students.filter((s: any) => {
    const dobDate = new Date(s.dob);
    return dobDate.getMonth() + 1 === month && dobDate.getDate() === day;
  });

  return birthdayStudents.map((s: any) => ({
    id: s.id,
    name: s.fullName || `${s.firstName} ${s.lastName}`,
    photoUrl: s.photoUrl,
    admissionNo: s.admissionNo,
    class: s.enrollments?.[0]?.class?.name || "",
    section: s.enrollments?.[0]?.section?.name || "",
    dob: s.dob,
  }));
}

async function getClassStrengthData(tenantId: string, academicYearId?: string) {
  const classes = await prisma.class.findMany({
    where: { tenantId, isDeleted: false },
    select: {
      id: true,
      name: true,
      enrollments: {
        where: {
          isDeleted: false,
          status: "ACTIVE",
          ...(academicYearId && { academicYearId }),
        },
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return classes.map((c: any) => ({
    classId: c.id,
    className: c.name,
    count: c.enrollments?.length || 0,
  }));
}

async function getSectionStrengthData(tenantId: string, academicYearId?: string) {
  const sections = await prisma.section.findMany({
    where: { tenantId, isDeleted: false },
    select: {
      id: true,
      name: true,
      class: { select: { id: true, name: true } },
      enrollments: {
        where: {
          isDeleted: false,
          status: "ACTIVE",
          ...(academicYearId && { academicYearId }),
        },
        select: { id: true },
      },
    },
    orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
  });

  return sections.map((s: any) => ({
    sectionId: s.id,
    sectionName: s.name,
    classId: s.class?.id,
    className: s.class?.name,
    count: s.enrollments?.length || 0,
  }));
}

async function getCategoryDistributionData(tenantId: string, academicYearId?: string) {
  const students = await prisma.student.findMany({
    where: { tenantId, isDeleted: false, status: "ACTIVE", ...(academicYearId && { academicYearId }) },
    select: { category: true },
  });

  const categoryCount: Record<string, number> = {};
  students.forEach((s: any) => {
    const cat = s.category || "General";
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  const total = students.length;
  return Object.entries(categoryCount).map(([category, count]) => ({
    category,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

async function getMonthlyAdmissionData(tenantId: string, academicYearId?: string) {
  const now = new Date();
  const months: { month: string; year: number; monthNum: number; count: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

    const count = await prisma.student.count({
      where: {
        tenantId,
        isDeleted: false,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        ...(academicYearId && { academicYearId }),
      },
    });

    const monthName = date.toLocaleString("en", { month: "short" });
    months.push({
      month: monthName,
      year: date.getFullYear(),
      monthNum: date.getMonth() + 1,
      count,
    });
  }

  return months;
}

async function getGenderRatioData(tenantId: string, academicYearId?: string) {
  const where: any = { tenantId, isDeleted: false, status: "ACTIVE", ...(academicYearId && { academicYearId }) };

  const [male, female, other] = await Promise.all([
    prisma.student.count({ where: { ...where, gender: { in: ["Male", "male", "M", "MALE"] } } }),
    prisma.student.count({ where: { ...where, gender: { in: ["Female", "female", "F", "FEMALE"] } } }),
    prisma.student.count({ where: { ...where, gender: { in: ["Other", "other", "O", "OTHER"] } } }),
  ]);

  const total = male + female + other;
  return {
    male,
    female,
    other,
    total,
    malePercentage: total > 0 ? Math.round((male / total) * 100) : 0,
    femalePercentage: total > 0 ? Math.round((female / total) * 100) : 0,
    otherPercentage: total > 0 ? Math.round((other / total) * 100) : 0,
  };
}
