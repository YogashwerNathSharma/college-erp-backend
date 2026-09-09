import prisma from "../../utils/prisma";
import logger from "../../config/logger";

/**
 * Performance-oriented teacher dashboard loader.
 * Keeps tenant + academic-year isolation while avoiding the old N+1 leave query
 * and unnecessary teacher relation payloads.
 */
export const getTeacherDashboardPerformance = async (
  tenantId: string,
  academicYearId?: string,
) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const teacherWhere = {
    tenantId,
    isDeleted: false,
    ...(academicYearId ? { academicYearId } : {}),
  };

  // Keep the main teacher projection small. Leave/salary/lookup data is loaded
  // separately so a large teacher table does not create a nested N+1 query.
  const [teachers, departments] = await Promise.all([
    prisma.teacher.findMany({
      where: teacherWhere,
      select: {
        id: true,
        name: true,
        gender: true,
        departmentId: true,
        designationId: true,
        createdAt: true,
      },
    }),
    prisma.department.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true },
    }).catch(() => []),
  ]);

  const teacherIds = teachers.map((t) => t.id);
  const teacherIdSet = new Set(teacherIds);

  // Only current approved leaves are needed for the dashboard.
  const currentLeaves = teacherIds.length
    ? await prisma.leave.findMany({
        where: {
          tenantId,
          isDeleted: false,
          status: "APPROVED",
          startDate: { lte: now },
          endDate: { gte: now },
          teacherId: { in: teacherIds },
          ...(academicYearId ? { academicYearId } : {}),
        },
        select: {
          id: true,
          teacherId: true,
          leaveType: true,
          startDate: true,
          endDate: true,
          status: true,
        },
        orderBy: { startDate: "asc" },
      })
    : [];

  const deptMap = new Map(departments.map((d: any) => [d.id, d.name]));
  const leaveByTeacher = new Map<string, any>();
  for (const leave of currentLeaves) {
    if (teacherIdSet.has(leave.teacherId) && !leaveByTeacher.has(leave.teacherId)) {
      leaveByTeacher.set(leave.teacherId, leave);
    }
  }

  const totalTeachers = teachers.length;
  const onLeave = leaveByTeacher.size;
  const activeTeachers = Math.max(0, totalTeachers - onLeave);
  const maleTeachers = teachers.reduce((n, t) => n + (t.gender === "MALE" ? 1 : 0), 0);
  const femaleTeachers = teachers.reduce((n, t) => n + (t.gender === "FEMALE" ? 1 : 0), 0);
  const newJoinings = teachers.reduce(
    (n, t) => n + (new Date(t.createdAt) >= startOfMonth ? 1 : 0),
    0,
  );

  const deptCount = new Map<string, number>();
  for (const teacher of teachers) {
    const name = teacher.departmentId
      ? deptMap.get(teacher.departmentId) || "Unassigned"
      : "Unassigned";
    deptCount.set(name, (deptCount.get(name) || 0) + 1);
  }
  const departmentDistribution = Array.from(deptCount.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const experienceData = [
    { range: "0-5 yrs", count: 0 },
    { range: "5-10 yrs", count: 0 },
    { range: "10-15 yrs", count: 0 },
    { range: "15+ yrs", count: 0 },
  ];
  const yearMs = 365.25 * 24 * 60 * 60 * 1000;
  for (const teacher of teachers) {
    const years = (now.getTime() - new Date(teacher.createdAt).getTime()) / yearMs;
    if (years < 5) experienceData[0].count++;
    else if (years < 10) experienceData[1].count++;
    else if (years < 15) experienceData[2].count++;
    else experienceData[3].count++;
  }

  const teachersOnLeave = teachers
    .filter((t) => leaveByTeacher.has(t.id))
    .slice(0, 10)
    .map((t) => {
      const leave = leaveByTeacher.get(t.id);
      return {
        id: t.id,
        name: t.name,
        department: t.departmentId ? deptMap.get(t.departmentId) || "N/A" : "N/A",
        leaveType: leave?.leaveType || "Leave",
        fromDate: leave?.startDate,
        toDate: leave?.endDate,
        status: leave?.status || "APPROVED",
      };
    });

  // Salary query is independent of the teacher list and can be safely executed
  // after the small base query; it is bounded to the current month and 10 rows.
  let upcomingSalary: any[] = [];
  try {
    const [pendingSalaries, designations] = await Promise.all([
      prisma.teacherSalary.findMany({
        where: {
          tenantId,
          ...(academicYearId ? { academicYearId } : {}),
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          status: "PENDING",
        },
        select: {
          id: true,
          teacherId: true,
          basicSalary: true,
          totalDeductions: true,
          netSalary: true,
          teacher: { select: { name: true, departmentId: true } },
        },
        take: 10,
        orderBy: { netSalary: "desc" },
      }),
      (async () => {
        const ids = [...new Set(teachers.map((t) => t.designationId).filter(Boolean))];
        if (!ids.length) return [];
        return (prisma as any).designation?.findMany?.({
          where: { id: { in: ids } },
          select: { id: true, name: true },
        }) || [];
      })(),
    ]);

    upcomingSalary = pendingSalaries.map((s: any) => ({
      id: s.id,
      name: s.teacher?.name || "N/A",
      department: s.teacher?.departmentId
        ? deptMap.get(s.teacher.departmentId) || "N/A"
        : "N/A",
      gross: s.basicSalary,
      deductions: s.totalDeductions,
      net: s.netSalary,
    }));

    const designationMap = new Map((designations || []).map((d: any) => [d.id, d.name]));
    const designationCount = new Map<string, number>();
    for (const teacher of teachers) {
      if (!teacher.designationId) continue;
      const name = designationMap.get(teacher.designationId) || "Other";
      designationCount.set(name, (designationCount.get(name) || 0) + 1);
    }

    return {
      stats: {
        totalTeachers,
        activeTeachers,
        onLeave,
        newJoinings,
        departments: departments.length || deptCount.size,
        maleTeachers,
        femaleTeachers,
      },
      departmentDistribution,
      experienceDistribution: experienceData,
      genderDistribution: [
        { name: "Male", value: maleTeachers },
        { name: "Female", value: femaleTeachers },
        { name: "Other", value: Math.max(0, totalTeachers - maleTeachers - femaleTeachers) },
      ].filter((g) => g.value > 0),
      attendanceTrend: [],
      qualificationDistribution: Array.from(designationCount.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      teachersOnLeave,
      upcomingSalary,
    };
  } catch (e: any) {
    logger.warn("Teacher dashboard secondary queries failed", { error: e?.message });
    return {
      stats: {
        totalTeachers,
        activeTeachers,
        onLeave,
        newJoinings,
        departments: departments.length || deptCount.size,
        maleTeachers,
        femaleTeachers,
      },
      departmentDistribution,
      experienceDistribution: experienceData,
      genderDistribution: [
        { name: "Male", value: maleTeachers },
        { name: "Female", value: femaleTeachers },
        { name: "Other", value: Math.max(0, totalTeachers - maleTeachers - femaleTeachers) },
      ].filter((g) => g.value > 0),
      attendanceTrend: [],
      qualificationDistribution: [],
      teachersOnLeave,
      upcomingSalary,
    };
  }
};
