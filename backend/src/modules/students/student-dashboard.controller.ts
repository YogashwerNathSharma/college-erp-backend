import { Response } from "express";
import prisma from "../../utils/prisma";
import { cached } from "../../utils/cache";

// ══════════════════════════════════════════════════════════════════
// STUDENT DASHBOARD CONTROLLER
// ══════════════════════════════════════════════════════════════════

// Statuses that count as "active/enrolled" (must match student-dashboard.service.ts)
const ACTIVE_STATUSES = ["active", "pending", "verified"] as const;

/**
 * GET /api/students/dashboard/full
 * Returns complete dashboard data in a single API call
 * 🚀 CACHED (30s TTL) — instant on repeated clicks/navigation
 */
export const getFullDashboardHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { academicYearId } = req.query;

    // ─── BATCH 1: Core counts (5 queries) ───
    const [totalStudents, activeStudents, inactiveStudents, maleStudents, femaleStudents] = await Promise.all([
      prisma.student.count({ where: { tenantId, isDeleted: false, ...(academicYearId && { academicYearId }) } }),
      prisma.student.count({ where: { tenantId, isDeleted: false, status: { in: [...ACTIVE_STATUSES] }, ...(academicYearId && { academicYearId }) } }),
      prisma.student.count({ where: { tenantId, isDeleted: false, status: { notIn: [...ACTIVE_STATUSES] }, ...(academicYearId && { academicYearId }) } }),
      prisma.student.count({ where: { tenantId, isDeleted: false, gender: "MALE", ...(academicYearId && { academicYearId }) } }),
      prisma.student.count({ where: { tenantId, isDeleted: false, gender: "FEMALE", ...(academicYearId && { academicYearId }) } }),
    ]);

    // ─── BATCH 2: Secondary counts (5 queries) ───
    const [transportCount, hostelCount, recentAdmissions, feeDefaulters, leavingStudents] = await Promise.all([
      prisma.transportAssignment.count({ where: { tenantId, status: "ACTIVE" } }).catch(() => 0),
      prisma.hostelAllocation.count({ where: { tenantId, status: "ACTIVE" } }).catch(() => 0),
      prisma.student.count({ where: { tenantId, isDeleted: false, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, ...(academicYearId && { academicYearId }) } }),
      prisma.studentFee.count({ where: { tenantId, isDeleted: false, balanceAmount: { gt: 0 } } }).catch(() => 0),
      prisma.student.count({ where: { tenantId, isDeleted: false, status: { in: ["transferred", "dropped", "passed"] }, statusChangedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }).catch(() => 0),
    ]);

    // ─── BATCH 3: Complex data (4 queries) ───
    const [classStrength, categoryDistribution, genderRatio, birthdayToday] = await Promise.all([
      getClassStrengthData(tenantId, academicYearId),
      getCategoryDistributionData(tenantId, academicYearId),
      getGenderRatioData(tenantId, academicYearId),
      getBirthdayTodayData(tenantId),
    ]);

    const data = {
      stats: {
        totalStudents, activeStudents, inactiveStudents,
        newAdmissions: recentAdmissions, leavingStudents,
        boys: maleStudents, girls: femaleStudents,
        transportStudents: transportCount, hostelStudents: hostelCount,
        scholarshipStudents: 0, feeDefaulters,
        birthdayTodayCount: birthdayToday.length,
      },
      birthdayToday,
      classStrength,
      sectionStrength: [], // Lazy load via separate endpoint
      categoryDistribution,
      monthlyAdmission: [], // Lazy load via separate endpoint
      genderRatio,
    };

    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Student Dashboard Error:", err.message);
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
 * Optimized: all 5 years fetched in parallel
 */
export const getStudentGrowthHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

    // Run all 5 years in parallel instead of a sequential for loop
    const growthData = await Promise.all(
      years.map(async (year) => {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        const count = await prisma.student.count({
          where: {
            tenantId,
            isDeleted: false,
            createdAt: { gte: startDate, lte: endDate },
          },
        });
        return { year, count };
      })
    );

    // Calculate cumulative totals
    let cumulative = 0;
    const cumulativeData = growthData
      .sort((a, b) => a.year - b.year)
      .map((item) => {
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
      where: { tenantId: req.tenantId, status: "ACTIVE" },
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

  // Fetch enrolled students (active + pending + verified) and filter by DOB in app layer
  const students = await prisma.student.findMany({
    where: {
      tenantId,
      isDeleted: false,
      status: { in: [...ACTIVE_STATUSES] },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      dob: true,
      photoUrl: true,
      admissionNo: true,
      enrollments: {
        where: { status: "active", isDeleted: false },
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
  const birthdayStudents = students.filter((s) => {
    const dobDate = new Date(s.dob);
    return dobDate.getMonth() + 1 === month && dobDate.getDate() === day;
  });

  return birthdayStudents.map((s) => ({
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
    where: { tenantId },
    select: {
      id: true,
      name: true,
      enrollments: {
        where: {
          isDeleted: false, status: "active",
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
    where: { tenantId, isActive: true },
    select: {
      id: true,
      name: true,
      class: { select: { id: true, name: true } },
      enrollments: {
        where: {
          isDeleted: false, status: "active",
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
  // Use ACTIVE_STATUSES for consistency with dashboard service
  const students = await prisma.student.findMany({
    where: {
      tenantId,
      isDeleted: false,
      status: { in: [...ACTIVE_STATUSES] },
      ...(academicYearId && { academicYearId }),
    },
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

/**
 * Optimized: single DB query + in-memory bucketing instead of 12 sequential queries
 */
async function getMonthlyAdmissionData(tenantId: string, academicYearId?: string) {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

  // Single DB query
  const students = await prisma.student.findMany({
    where: {
      tenantId,
      isDeleted: false,
      createdAt: { gte: twelveMonthsAgo },
      ...(academicYearId && { academicYearId }),
    },
    select: { createdAt: true },
  });

  // Build 12-month buckets in memory
  const months: { month: string; year: number; monthNum: number; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleString("en", { month: "short" });
    const count = students.filter((s) => {
      const d = new Date(s.createdAt);
      return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    }).length;
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
  // Use normalized enum values (MALE / FEMALE) and include pending/verified
  const where: any = {
    tenantId,
    isDeleted: false,
    status: { in: [...ACTIVE_STATUSES] },
    ...(academicYearId && { academicYearId }),
  };

  const [male, female, other] = await Promise.all([
    prisma.student.count({ where: { ...where, gender: "MALE" } }),
    prisma.student.count({ where: { ...where, gender: "FEMALE" } }),
    prisma.student.count({ where: { ...where, gender: "OTHER" } }),
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
