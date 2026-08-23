

import prisma from "../../config/prisma";
import { cacheAside, invalidateCache, CacheKeys } from "../../utils/cache";
import { MarkAttendanceBody, UpdateAttendanceBody } from "./attendance.types";

// ========================================
// MARK ATTENDANCE (Bulk - first time)
// ========================================
export const markAttendanceService = async (
  data: MarkAttendanceBody,
  tenantId: string
) => {
  const { classId, sectionId, academicYearId, date, students } = data;
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  // ⚡ PERF: Single bulk query instead of N+1
  const existingRecords = await prisma.attendance.findMany({
    where: {
      date: attendanceDate,
      tenantId,
      isDeleted: false,
      studentId: { in: students.map(s => s.studentId) },
    },
    select: { studentId: true },
  });

  const existingIds = new Set(existingRecords.map(r => r.studentId));

  const attendanceData = students
    .filter(s => !existingIds.has(s.studentId))
    .map(s => ({
      studentId: s.studentId,
      classId,
      sectionId,
      academicYearId,
      tenantId,
      date: attendanceDate,
      status: s.status,
    }));

  if (attendanceData.length > 0) {
    await prisma.attendance.createMany({
      data: attendanceData,
    });
  }

  // ⚡ Invalidate attendance dashboard cache
  await invalidateCache(CacheKeys.attendanceReport(tenantId, attendanceDate.toISOString().split("T")[0])).catch(() => {});
  // Also invalidate the dashboard stats cache for this academic year
  await invalidateCache(`attendance:dash:${tenantId}:${data.academicYearId}`).catch(() => {});

  return {
    message: "Attendance marked successfully",
    markedCount: attendanceData.length,
    skippedCount: students.length - attendanceData.length,
  };
};

// ========================================
// UPDATE ATTENDANCE (Edit existing - P↔A toggle)
// ========================================
export const updateAttendanceService = async (
  data: UpdateAttendanceBody,
  tenantId: string
) => {
  const { classId, sectionId, academicYearId, date, students } = data;
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  // ⚡ PERF: Single bulk query to find all existing records
  const existingRecords = await prisma.attendance.findMany({
    where: {
      classId,
      sectionId,
      date: attendanceDate,
      tenantId,
      isDeleted: false,
      studentId: { in: students.map(s => s.studentId) },
    },
  });

  const existingMap = new Map(existingRecords.map((r: any) => [r.studentId, r]));

  // ⚡ PERF: Batch updates and creates
  const updatePromises: Promise<any>[] = [];
  const createData: any[] = [];

  for (const s of students) {
    const existing = existingMap.get(s.studentId);
    if (existing) {
      updatePromises.push(
        prisma.attendance.update({
          where: { id: existing.id },
          data: { status: s.status, updatedAt: new Date() },
        })
      );
    } else {
      createData.push({
        studentId: s.studentId, classId, sectionId, academicYearId,
        tenantId, date: attendanceDate, status: s.status,
      });
    }
  }

  await Promise.all([
    ...updatePromises,
    createData.length > 0 ? prisma.attendance.createMany({ data: createData }) : Promise.resolve(),
  ]);

  const updatedCount = updatePromises.length + createData.length;

  // ⚡ Invalidate attendance dashboard cache
  await invalidateCache(CacheKeys.attendanceReport(tenantId, attendanceDate.toISOString().split("T")[0])).catch(() => {});
  // Also invalidate the dashboard stats cache
  await invalidateCache(`attendance:dash:${tenantId}:${data.academicYearId}`).catch(() => {});

  return {
    message: "Attendance updated successfully",
    updatedCount,
  };
};

// ========================================
// GET CLASS ATTENDANCE (for a specific date)
// ========================================
export const getClassAttendanceService = async (
  classId: string,
  sectionId: string,
  date: string,
  tenantId: string
) => {
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  // Get all students in this class/section
  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId,
      sectionId,
      tenantId,
      status: "active",
      isDeleted: false,
    },
    select: {
      rollNumber: true,
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          rollNumber: true,
          admissionNo: true,
        },
      },
    },
    orderBy: {
      student: { rollNumber: "asc" },
    },
  });

  // Get existing attendance for this date
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      classId,
      sectionId,
      date: attendanceDate,
      tenantId,
      isDeleted: false,
    },
  });

  // Map attendance by studentId
  const attendanceMap = new Map(
    attendanceRecords.map((a) => [a.studentId, a.status])
  );

  // Build response with student info + status
  const students = enrollments.map((e) => ({
    studentId: e.student.id,
    name: `${e.student.firstName} ${e.student.lastName}`,
    rollNumber: (e as any).rollNumber || e.student.rollNumber || e.student.admissionNo || "",
    admissionNo: e.student.admissionNo || "",
    status: attendanceMap.get(e.student.id) || null,
  }));

  return {
    date: attendanceDate,
    classId,
    sectionId,
    totalStudents: students.length,
    markedCount: attendanceRecords.length,
    isMarked: attendanceRecords.length > 0,
    students,
  };
};

// ========================================
// GET STUDENT ATTENDANCE HISTORY
// ========================================
export const getStudentAttendanceService = async (
  studentId: string,
  tenantId: string
) => {
  return prisma.attendance.findMany({
    where: {
      studentId,
      tenantId,
      isDeleted: false,
    },
    orderBy: { date: "desc" },
  });
};

// ========================================
// ATTENDANCE REPORT (Monthly - for student)
// ========================================
export const getAttendanceReportService = async (
  studentId: string,
  month: number,
  year: number,
  tenantId: string
) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const records = await prisma.attendance.findMany({
    where: {
      studentId,
      tenantId,
      isDeleted: false,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const total = records.length;
  const present = records.filter((r) => r.status === "PRESENT").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;
  const percentage = total === 0 ? 0 : (present / total) * 100;

  return {
    month,
    year,
    totalDays: total,
    presentDays: present,
    absentDays: absent,
    percentage: percentage.toFixed(2),
    records,
  };
};

// ========================================
// ATTENDANCE SUMMARY (Academic Year - for report card)
// ========================================
export const getAttendanceSummaryService = async (
  studentId: string,
  academicYearId: string,
  tenantId: string
) => {
  const records = await prisma.attendance.findMany({
    where: {
      studentId,
      academicYearId,
      tenantId,
      isDeleted: false,
    },
  });

  const total = records.length;
  const present = records.filter((r) => r.status === "PRESENT").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;
  const percentage = total === 0 ? 0 : (present / total) * 100;

  return {
    totalDays: total,
    presentDays: present,
    absentDays: absent,
    percentage: percentage.toFixed(2),
  };
};

// ========================================
// DASHBOARD STATS (like image #1 - Dashboard)
// ========================================
export const getDashboardStatsService = async (
  tenantId: string,
  academicYearId: string
) => {
  // ⚡ FIX: Calculate "today" in IST regardless of server timezone
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const nowUTC = Date.now();
  const istMidnightUTC = new Date(nowUTC + IST_OFFSET_MS);
  istMidnightUTC.setUTCHours(0, 0, 0, 0);
  const today = new Date(istMidnightUTC.getTime() - IST_OFFSET_MS);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  // Total students (from enrollments for this academic year)
  const enrollments = await prisma.enrollment.findMany({
    where: { tenantId, academicYearId, isDeleted: false, status: "active" },
    select: { studentId: true, classId: true },
  });
  const totalStudents = enrollments.length;
  const studentIds = enrollments.map((e: any) => e.studentId);

  // Today's attendance — use range query to handle timezone
  const todayRecords = await prisma.attendance.findMany({
    where: {
      tenantId,
      date: { gte: today, lt: tomorrow },
      isDeleted: false,
    },
  });

  const presentToday = todayRecords.filter((r) => r.status === "PRESENT").length;
  const absentToday = todayRecords.filter((r) => r.status === "ABSENT").length;
  const lateToday = todayRecords.filter((r) => r.status === "LATE").length;
  const onLeave = todayRecords.filter((r) => r.status === "LEAVE").length;

  // Weekly trend (last 7 days)
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weekRecords = await prisma.attendance.findMany({
    where: {
      tenantId,
      isDeleted: false,
      date: { gte: sevenDaysAgo, lt: tomorrow },
    },
  });

  // Group by date for weekly trend
  const dateMap = new Map<string, { present: number; absent: number }>();
  for (const r of weekRecords) {
    const dateKey = r.date.toISOString().split("T")[0];
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, { present: 0, absent: 0 });
    }
    const data = dateMap.get(dateKey)!;
    if (r.status === "PRESENT") data.present++;
    else data.absent++;
  }

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyTrend = Array.from(dateMap.entries())
    .map(([date, data]) => {
      const d = new Date(date);
      const total = data.present + data.absent;
      return {
        date,
        day: days[d.getDay()],
        present: data.present,
        absent: data.absent,
        percentage: total > 0 ? Math.round((data.present / total) * 100) : 0,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Overall attendance % for this academic year
  const allRecords = await prisma.attendance.count({
    where: { tenantId, academicYearId, isDeleted: false },
  });
  const allPresent = await prisma.attendance.count({
    where: { tenantId, academicYearId, isDeleted: false, status: "PRESENT" },
  });
  const attendancePercentage = allRecords === 0 ? "0" : ((allPresent / allRecords) * 100).toFixed(1);

  // Class-wise attendance (today or overall if no today data)
  const classIds = [...new Set(enrollments.map((e: any) => e.classId).filter(Boolean))];
  const classes = classIds.length > 0
    ? await prisma.class.findMany({ where: { id: { in: classIds } }, select: { id: true, name: true } })
    : [];

  // Build enrollment map per class
  const classEnrollMap = new Map<string, string[]>();
  for (const e of enrollments) {
    if (!classEnrollMap.has(e.classId)) classEnrollMap.set(e.classId, []);
    classEnrollMap.get(e.classId)!.push(e.studentId);
  }

  const classWise = classes.map((cls: any) => {
    const classStudentIds = classEnrollMap.get(cls.id) || [];
    const classRecords = todayRecords.filter((r) => classStudentIds.includes(r.studentId));
    const present = classRecords.filter((r) => r.status === "PRESENT").length;
    const absent = classRecords.filter((r) => r.status === "ABSENT" || r.status === "LATE").length;
    const total = classStudentIds.length;
    // If no today data, use overall
    const pct = classRecords.length > 0
      ? Math.round((present / Math.max(classRecords.length, 1)) * 100)
      : (allRecords > 0 ? Math.round(parseFloat(attendancePercentage)) : 0);
    return {
      className: cls.name,
      present,
      absent,
      total,
      percentage: pct,
    };
  }).sort((a: any, b: any) => a.className.localeCompare(b.className, undefined, { numeric: true }));

  // Absent students today (with details)
  const absentRecords = todayRecords.filter((r) => r.status === "ABSENT");
  let absentStudents: any[] = [];
  if (absentRecords.length > 0) {
    const absentStudentIds = absentRecords.map((r) => r.studentId);
    const students = await prisma.student.findMany({
      where: { id: { in: absentStudentIds }, isDeleted: false },
      select: {
        id: true, firstName: true, lastName: true, phone: true,
        enrollments: {
          where: { isDeleted: false, status: "active" },
          select: {
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    absentStudents = students.slice(0, 10).map((s: any) => {
      const enrollment = s.enrollments?.[0];
      return {
        id: s.id,
        name: `${s.firstName} ${s.lastName || ""}`.trim(),
        className: enrollment?.class?.name || "",
        section: enrollment?.section?.name || "",
        contact: s.phone || "",
        daysAbsent: 1,
      };
    });
  }

  // Heatmap data (class x day for this week)
  const heatmapData = classes.map((cls: any) => {
    const classStudentIds = classEnrollMap.get(cls.id) || [];
    const classDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName, idx) => {
      const dayDate = new Date(sevenDaysAgo);
      dayDate.setDate(sevenDaysAgo.getDate() + idx + 1);
      const dateKey = dayDate.toISOString().split("T")[0];
      const dayRecords = weekRecords.filter(
        (r) => r.date.toISOString().split("T")[0] === dateKey && classStudentIds.includes(r.studentId)
      );
      const p = dayRecords.filter((r) => r.status === "PRESENT").length;
      const total = dayRecords.length;
      return { day: dayName, percentage: total > 0 ? Math.round((p / total) * 100) : 0 };
    });
    return { className: cls.name, days: classDays };
  }).sort((a: any, b: any) => a.className.localeCompare(b.className, undefined, { numeric: true }));

  return {
    totalStudents,
    presentToday,
    absentToday,
    lateToday,
    onLeave,
    attendancePercentage,
    weeklyTrend,
    monthlyTrend: weeklyTrend,
    classWise,
    absentStudents,
    heatmapData,
  };
};

