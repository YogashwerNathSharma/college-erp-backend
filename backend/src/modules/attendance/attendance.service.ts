

import prisma from "../../config/prisma";
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

  const attendanceData: any[] = [];

  for (const s of students) {
    const existing = await prisma.attendance.findFirst({
      where: {
        studentId: s.studentId,
        date: attendanceDate,
        tenantId,
        isDeleted: false,
      },
    });

    if (existing) continue;

    attendanceData.push({
      studentId: s.studentId,
      classId,
      sectionId,
      academicYearId,
      tenantId,
      date: attendanceDate,
      status: s.status,
    });
  }

  if (attendanceData.length > 0) {
    await prisma.attendance.createMany({
      data: attendanceData,
    });
  }

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
  const { classId, sectionId, date, students } = data;
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  let updatedCount = 0;

  for (const s of students) {
    const existing = await prisma.attendance.findFirst({
      where: {
        studentId: s.studentId,
        classId,
        sectionId,
        date: attendanceDate,
        tenantId,
        isDeleted: false,
      },
    });

    if (existing) {
      await prisma.attendance.update({
        where: { id: existing.id },
        data: { status: s.status, updatedAt: new Date() },
      });
      updatedCount++;
    } else {
      await prisma.attendance.create({
        data: {
          studentId: s.studentId,
          classId,
          sectionId,
          academicYearId: "",
          tenantId,
          date: attendanceDate,
          status: s.status,
        },
      });
      updatedCount++;
    }
  }

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
      isDeleted: false,
    },
    include: {
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
    rollNumber: e.student.rollNumber || "",
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Total students (from enrollments for this academic year)
  const totalStudents = await prisma.enrollment.count({
    where: { tenantId, academicYearId, isDeleted: false },
  });

  // Today's attendance
  const todayRecords = await prisma.attendance.findMany({
    where: {
      tenantId,
      date: today,
      isDeleted: false,
    },
  });

  const presentToday = todayRecords.filter((r) => r.status === "PRESENT").length;
  const absentToday = todayRecords.filter((r) => r.status === "ABSENT").length;

  // Monthly trend (last 30 days)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const monthRecords = await prisma.attendance.findMany({
    where: {
      tenantId,
      isDeleted: false,
      date: { gte: thirtyDaysAgo, lte: today },
    },
  });

  // Group by date
  const dateMap = new Map<string, { present: number; absent: number }>();
  for (const r of monthRecords) {
    const dateKey = r.date.toISOString().split("T")[0];
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, { present: 0, absent: 0 });
    }
    const data = dateMap.get(dateKey)!;
    if (r.status === "PRESENT") data.present++;
    else data.absent++;
  }

  const monthlyTrend = Array.from(dateMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Overall attendance % for this academic year
  const allRecords = await prisma.attendance.count({
    where: { tenantId, academicYearId, isDeleted: false },
  });
  const allPresent = await prisma.attendance.count({
    where: { tenantId, academicYearId, isDeleted: false, status: "PRESENT" },
  });
  const attendancePercentage = allRecords === 0 ? "0" : ((allPresent / allRecords) * 100).toFixed(1);

  return {
    totalStudents,
    presentToday,
    absentToday,
    attendancePercentage,
    monthlyTrend,
  };
};

