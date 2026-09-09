import prisma from "../../config/prisma";

// Fast, tenant/year-scoped dashboard aggregation.
// The existing attendance.service remains untouched so all other attendance
// operations keep their current behavior.
export const getAttendanceDashboardPerformance = async (
  tenantId: string,
  academicYearId: string
) => {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const nowUTC = Date.now();
  const istMidnightUTC = new Date(nowUTC + IST_OFFSET_MS);
  istMidnightUTC.setUTCHours(0, 0, 0, 0);
  const today = new Date(istMidnightUTC.getTime() - IST_OFFSET_MS);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Only fetch fields needed to build the dashboard. These four reads run in parallel.
  const [enrollments, todayRecords, weekRecords, overall] = await Promise.all([
    prisma.enrollment.findMany({
      where: { tenantId, academicYearId, isDeleted: false, status: "active" },
      select: { studentId: true, classId: true },
    }),
    prisma.attendance.findMany({
      where: { tenantId, academicYearId, date: { gte: today, lt: tomorrow }, isDeleted: false },
      select: { studentId: true, classId: true, status: true },
    }),
    prisma.attendance.findMany({
      where: { tenantId, academicYearId, isDeleted: false, date: { gte: sevenDaysAgo, lt: tomorrow } },
      select: { studentId: true, classId: true, date: true, status: true },
    }),
    Promise.all([
      prisma.attendance.count({ where: { tenantId, academicYearId, isDeleted: false } }),
      prisma.attendance.count({ where: { tenantId, academicYearId, isDeleted: false, status: "PRESENT" } }),
    ]),
  ]);

  const totalStudents = enrollments.length;
  const presentToday = todayRecords.filter(r => r.status === "PRESENT").length;
  const absentToday = todayRecords.filter(r => r.status === "ABSENT").length;
  const lateToday = todayRecords.filter(r => r.status === "LATE").length;
  const onLeave = todayRecords.filter(r => r.status === "LEAVE").length;
  const [allRecords, allPresent] = overall;
  const attendancePercentage = allRecords === 0 ? "0" : ((allPresent / allRecords) * 100).toFixed(1);

  const classIds = [...new Set(enrollments.map(e => e.classId).filter(Boolean))];
  const classes = classIds.length
    ? await prisma.class.findMany({ where: { id: { in: classIds } }, select: { id: true, name: true } })
    : [];

  const enrollmentClass = new Map<string, string>();
  const classTotals = new Map<string, number>();
  for (const e of enrollments) {
    enrollmentClass.set(e.studentId, e.classId);
    classTotals.set(e.classId, (classTotals.get(e.classId) || 0) + 1);
  }

  const classToday = new Map<string, { present: number; absent: number; marked: number }>();
  for (const r of todayRecords) {
    const classId = enrollmentClass.get(r.studentId) || r.classId;
    if (!classId) continue;
    const v = classToday.get(classId) || { present: 0, absent: 0, marked: 0 };
    v.marked++;
    if (r.status === "PRESENT") v.present++;
    if (r.status === "ABSENT" || r.status === "LATE") v.absent++;
    classToday.set(classId, v);
  }

  const classWise = classes.map(cls => {
    const v = classToday.get(cls.id) || { present: 0, absent: 0, marked: 0 };
    const total = classTotals.get(cls.id) || 0;
    const percentage = v.marked > 0
      ? Math.round((v.present / v.marked) * 100)
      : (allRecords > 0 ? Math.round(parseFloat(attendancePercentage)) : 0);
    return { className: cls.name, present: v.present, absent: v.absent, total, percentage };
  }).sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true }));

  const dateMap = new Map<string, { present: number; absent: number }>();
  for (const r of weekRecords) {
    const key = r.date.toISOString().split("T")[0];
    const v = dateMap.get(key) || { present: 0, absent: 0 };
    if (r.status === "PRESENT") v.present++;
    else v.absent++;
    dateMap.set(key, v);
  }
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyTrend = Array.from(dateMap.entries()).map(([date, v]) => {
    const total = v.present + v.absent;
    return { date, day: days[new Date(date).getDay()], present: v.present, absent: v.absent, percentage: total ? Math.round((v.present / total) * 100) : 0 };
  }).sort((a, b) => a.date.localeCompare(b.date));

  const weekClassDay = new Map<string, { present: number; total: number }>();
  for (const r of weekRecords) {
    const classId = enrollmentClass.get(r.studentId) || r.classId;
    if (!classId) continue;
    const dateKey = r.date.toISOString().split("T")[0];
    const key = `${classId}|${dateKey}`;
    const v = weekClassDay.get(key) || { present: 0, total: 0 };
    v.total++;
    if (r.status === "PRESENT") v.present++;
    weekClassDay.set(key, v);
  }

  const heatmapData = classes.map(cls => {
    const daysOut = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + idx + 1);
      const key = `${cls.id}|${d.toISOString().split("T")[0]}`;
      const v = weekClassDay.get(key);
      return { day, percentage: v && v.total ? Math.round((v.present / v.total) * 100) : 0 };
    });
    return { className: cls.name, days: daysOut };
  }).sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true }));

  const absentRecords = todayRecords.filter(r => r.status === "ABSENT").slice(0, 10);
  const absentIds = absentRecords.map(r => r.studentId);
  let absentStudents: any[] = [];
  if (absentIds.length) {
    const students = await prisma.student.findMany({
      where: { id: { in: absentIds }, isDeleted: false },
      select: {
        id: true, firstName: true, lastName: true, phone: true,
        enrollments: {
          where: { isDeleted: false, status: "active", academicYearId },
          select: { class: { select: { name: true } }, section: { select: { name: true } } },
          orderBy: { createdAt: "desc" }, take: 1,
        },
      },
    });
    absentStudents = students.map(s => {
      const e = s.enrollments?.[0];
      return { id: s.id, name: `${s.firstName} ${s.lastName || ""}`.trim(), className: e?.class?.name || "", section: e?.section?.name || "", contact: s.phone || "", daysAbsent: 1 };
    });
  }

  return {
    totalStudents, presentToday, absentToday, lateToday, onLeave,
    attendancePercentage, weeklyTrend, monthlyTrend: weeklyTrend,
    classWise, absentStudents, heatmapData,
  };
};
