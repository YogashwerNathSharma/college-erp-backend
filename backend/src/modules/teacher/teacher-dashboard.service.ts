import prisma from "../../utils/prisma";
import logger from "../../config/logger";

export const getTeacherDashboardData = async (tenantId: string) => {
  const now = new Date();

  // Get all active teachers
  const teachers = await prisma.teacher.findMany({
    where: { tenantId, isDeleted: false },
    select: {
      id: true,
      gender: true,
      departmentId: true,
      createdAt: true,
      leaves: {
        where: {
          status: "APPROVED",
          startDate: { lte: now },
          endDate: { gte: now },
        },
        select: { id: true },
      },
    },
  });

  const totalTeachers = teachers.length;
  const onLeave = teachers.filter((t) => t.leaves.length > 0).length;
  const activeTeachers = totalTeachers - onLeave;
  const maleTeachers = teachers.filter((t) => t.gender === "MALE").length;
  const femaleTeachers = teachers.filter((t) => t.gender === "FEMALE").length;

  // New joinings this month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newJoinings = teachers.filter(
    (t) => new Date(t.createdAt) >= startOfMonth
  ).length;

  // Department distribution
  let departments: any[] = [];
  try {
    departments = await prisma.department.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true },
    });
  } catch { departments = []; }

  const deptMap = new Map(departments.map((d: any) => [d.id, d.name]));
  const deptCount: Record<string, number> = {};
  teachers.forEach((t) => {
    const dept = t.departmentId ? (deptMap.get(t.departmentId) || "Unassigned") : "Unassigned";
    deptCount[dept] = (deptCount[dept] || 0) + 1;
  });
  const departmentDistribution = Object.entries(deptCount)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // Experience distribution (based on createdAt as joining date)
  const experienceData = [
    { range: "0-5 yrs", count: 0 },
    { range: "5-10 yrs", count: 0 },
    { range: "10-15 yrs", count: 0 },
    { range: "15+ yrs", count: 0 },
  ];
  teachers.forEach((t) => {
    const years = (now.getTime() - new Date(t.createdAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (years < 5) experienceData[0].count++;
    else if (years < 10) experienceData[1].count++;
    else if (years < 15) experienceData[2].count++;
    else experienceData[3].count++;
  });

  // Teachers currently on leave (detailed)
  let teachersOnLeaveDetailed: any[] = [];
  try {
    const onLeaveTeachers = await prisma.teacher.findMany({
      where: {
        tenantId,
        isDeleted: false,
        leaves: {
          some: {
            status: "APPROVED",
            startDate: { lte: now },
            endDate: { gte: now },
          },
        },
      },
      select: {
        id: true,
        name: true,
        departmentId: true,
        leaves: {
          where: {
            status: "APPROVED",
            startDate: { lte: now },
            endDate: { gte: now },
          },
          select: { leaveTypeId: true, startDate: true, endDate: true, status: true },
          take: 1,
        },
      },
      take: 10,
    });

    teachersOnLeaveDetailed = onLeaveTeachers.map((t) => ({
      id: t.id,
      name: t.name,
      department: t.departmentId ? (deptMap.get(t.departmentId) || "N/A") : "N/A",
      leaveType: t.leaves[0]?.leaveTypeId || "Leave",
      fromDate: t.leaves[0]?.startDate,
      toDate: t.leaves[0]?.endDate,
      status: t.leaves[0]?.status || "APPROVED",
    }));
  } catch (e) {
    logger.warn("Teacher dashboard leave query failed", { error: (e as any)?.message });
  }

  return {
    stats: {
      totalTeachers,
      activeTeachers,
      onLeave,
      newJoinings,
      departments: departments.length || Object.keys(deptCount).length,
      maleTeachers,
      femaleTeachers,
    },
    departmentDistribution,
    experienceDistribution: experienceData,
    attendanceTrend: [],
    qualificationDistribution: [],
    teachersOnLeave: teachersOnLeaveDetailed,
    upcomingSalary: [],
  };
};
