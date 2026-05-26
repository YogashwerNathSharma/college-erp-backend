import prisma from "../../config/prisma";
import { MarkAttendanceBody } from "./attendance.types";

export const markAttendanceService = async (
  data: MarkAttendanceBody,
  tenantId: string
) => {
  const { classId, sectionId, date, students } = data;

  const attendanceData: any[] = [];

  for (const s of students) {
    const existing = await prisma.attendance.findFirst({
      where: {
        studentId: s.studentId,
        date: new Date(date),
        tenantId,
      },
    });

    if (existing) continue;

    attendanceData.push({
      studentId: s.studentId,
      classId,
      sectionId,
      tenantId,
      date: new Date(date),
      status: s.status,
    });
  }

  if (attendanceData.length > 0) {
    await prisma.attendance.createMany({
      data: attendanceData,
    });
  }

  return { message: "Attendance marked successfully" };
};

// 👉 Get class attendance
export const getClassAttendanceService = async (
  classId: string,
  sectionId: string,
  date: string,
  tenantId: string
) => {
  return prisma.attendance.findMany({
    where: {
      classId,
      sectionId,
      tenantId,
      date: new Date(date),
    },
  });
};

// 👉 Student history
export const getStudentAttendanceService = async (
  studentId: string,
  tenantId: string
) => {
  return prisma.attendance.findMany({
    where: {
      studentId,
      tenantId,
    },
    orderBy: { date: "desc" },
  });
};

// 👉 Monthly report + percentage
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
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const total = records.length;
  const present = records.filter(r => r.status === "PRESENT").length;

  const percentage = total === 0 ? 0 : (present / total) * 100;

  return {
    totalDays: total,
    presentDays: present,
    percentage: percentage.toFixed(2),
  };
};