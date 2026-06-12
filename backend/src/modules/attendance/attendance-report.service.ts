
import prisma from "../../config/prisma";

// ========================================
// 1. MONTHLY REPORT — Day-wise grid for a class
// ========================================
export const getMonthlyReportService = async (
  classId: string,
  sectionId: string,
  month: number,
  year: number,
  tenantId: string
) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const daysInMonth = endDate.getDate();

  // Get all students in this class/section
  const enrollments = await prisma.enrollment.findMany({
    where: { classId, sectionId, tenantId, isDeleted: false },
    include: {
      student: {
        select: { id: true, firstName: true, lastName: true, rollNumber: true },
      },
    },
    orderBy: { student: { rollNumber: "asc" } },
  });

  // Get all attendance records for this month
  const records = await prisma.attendance.findMany({
    where: {
      classId,
      sectionId,
      tenantId,
      isDeleted: false,
      date: { gte: startDate, lte: endDate },
    },
  });

  // Build attendance map: studentId -> { day -> status }
  const attendanceMap = new Map<string, Map<number, string>>();
  for (const r of records) {
    const day = r.date.getDate();
    if (!attendanceMap.has(r.studentId)) {
      attendanceMap.set(r.studentId, new Map());
    }
    attendanceMap.get(r.studentId)!.set(day, r.status);
  }

  // Build daily totals (present count per day)
  const dailyTotals: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    let count = 0;
    for (const [, dayMap] of attendanceMap) {
      if (dayMap.get(d) === "PRESENT") count++;
    }
    dailyTotals.push(count);
  }

  // Build student rows
  const students = enrollments.map((e) => {
    const dayMap = attendanceMap.get(e.student.id) || new Map();
    const days: string[] = [];
    let presentDays = 0;
    let absentDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const status = dayMap.get(d);
      if (status === "PRESENT") {
        days.push("P");
        presentDays++;
      } else if (status === "ABSENT") {
        days.push("A");
        absentDays++;
      } else {
        days.push("");
      }
    }

    const totalMarked = presentDays + absentDays;
    const percentage = totalMarked === 0 ? "0" : ((presentDays / totalMarked) * 100).toFixed(1);

    return {
      studentId: e.student.id,
      name: `${e.student.firstName} ${e.student.lastName}`,
      rollNumber: e.student.rollNumber || "",
      days,
      presentDays,
      absentDays,
      percentage,
    };
  });

  // Class average
  const totalPercentages = students.reduce((sum, s) => sum + parseFloat(s.percentage), 0);
  const classAverage = students.length > 0 ? (totalPercentages / students.length).toFixed(1) : "0";

  return {
    month,
    year,
    daysInMonth,
    totalStudents: students.length,
    classAverage,
    dailyTotals,
    students,
  };
};

// ========================================
// 2. DATE-WISE REPORT — Single date for a class
// ========================================
export const getDatewiseReportService = async (
  classId: string,
  sectionId: string,
  date: string,
  tenantId: string
) => {
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const enrollments = await prisma.enrollment.findMany({
    where: { classId, sectionId, tenantId, isDeleted: false },
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
    orderBy: { student: { rollNumber: "asc" } },
  });

  const records = await prisma.attendance.findMany({
    where: {
      classId,
      sectionId,
      tenantId,
      isDeleted: false,
      date: attendanceDate,
    },
  });

  const attendanceMap = new Map(records.map((r) => [r.studentId, r.status]));

  const students = enrollments.map((e) => ({
    studentId: e.student.id,
    name: `${e.student.firstName} ${e.student.lastName}`,
    rollNumber: e.student.rollNumber || "",
    admissionNo: e.student.admissionNo || "",
    status: attendanceMap.get(e.student.id) || "NOT_MARKED",
  }));

  const present = students.filter((s) => s.status === "PRESENT").length;
  const absent = students.filter((s) => s.status === "ABSENT").length;
  const total = students.length;
  const percentage = total === 0 ? "0" : ((present / total) * 100).toFixed(1);

  return {
    date: attendanceDate,
    total,
    present,
    absent,
    percentage,
    students,
  };
};

// ========================================
// 3. YEARLY REPORT — Month-wise summary for each student
// ========================================
export const getYearlyReportService = async (
  classId: string,
  sectionId: string,
  year: number,
  tenantId: string
) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  const enrollments = await prisma.enrollment.findMany({
    where: { classId, sectionId, tenantId, isDeleted: false },
    include: {
      student: {
        select: { id: true, firstName: true, lastName: true, rollNumber: true },
      },
    },
    orderBy: { student: { rollNumber: "asc" } },
  });

  const records = await prisma.attendance.findMany({
    where: {
      classId,
      sectionId,
      tenantId,
      isDeleted: false,
      date: { gte: startDate, lte: endDate },
    },
  });

  // Build map: studentId -> month -> { present, total }
  const studentMonthMap = new Map<string, Map<number, { present: number; total: number }>>();

  for (const r of records) {
    const month = r.date.getMonth();
    if (!studentMonthMap.has(r.studentId)) {
      studentMonthMap.set(r.studentId, new Map());
    }
    const monthMap = studentMonthMap.get(r.studentId)!;
    if (!monthMap.has(month)) {
      monthMap.set(month, { present: 0, total: 0 });
    }
    const data = monthMap.get(month)!;
    data.total++;
    if (r.status === "PRESENT") data.present++;
  }

  const students = enrollments.map((e) => {
    const monthMap = studentMonthMap.get(e.student.id) || new Map();
    const months: { present: number; total: number }[] = [];
    let totalPresent = 0;
    let totalAbsent = 0;

    for (let m = 0; m < 12; m++) {
      const data = monthMap.get(m) || { present: 0, total: 0 };
      months.push(data);
      totalPresent += data.present;
      totalAbsent += data.total - data.present;
    }

    const totalDays = totalPresent + totalAbsent;
    const percentage = totalDays === 0 ? "0" : ((totalPresent / totalDays) * 100).toFixed(1);

    return {
      studentId: e.student.id,
      name: `${e.student.firstName} ${e.student.lastName}`,
      rollNumber: e.student.rollNumber || "",
      months,
      totalPresent,
      totalAbsent,
      percentage,
    };
  });

  return { year, totalStudents: students.length, students };
};

// ========================================
// 4. CLASS-WISE SUMMARY — Overall attendance per student
// ========================================
export const getClasswiseReportService = async (
  classId: string,
  sectionId: string,
  tenantId: string
) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { classId, sectionId, tenantId, isDeleted: false },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          rollNumber: true,
          fatherName: true,
        },
      },
    },
    orderBy: { student: { rollNumber: "asc" } },
  });

  const records = await prisma.attendance.findMany({
    where: { classId, sectionId, tenantId, isDeleted: false },
  });

  // Build map: studentId -> { present, total }
  const studentMap = new Map<string, { present: number; total: number }>();
  for (const r of records) {
    if (!studentMap.has(r.studentId)) {
      studentMap.set(r.studentId, { present: 0, total: 0 });
    }
    const data = studentMap.get(r.studentId)!;
    data.total++;
    if (r.status === "PRESENT") data.present++;
  }

  const students = enrollments.map((e) => {
    const data = studentMap.get(e.student.id) || { present: 0, total: 0 };
    const absentDays = data.total - data.present;
    const percentage = data.total === 0 ? "0" : ((data.present / data.total) * 100).toFixed(1);

    return {
      studentId: e.student.id,
      name: `${e.student.firstName} ${e.student.lastName}`,
      rollNumber: e.student.rollNumber || "",
      fatherName: e.student.fatherName || "",
      totalDays: data.total,
      presentDays: data.present,
      absentDays,
      percentage,
    };
  });

  return { totalStudents: students.length, students };
};

// ========================================
// 5. FULL SCHOOL REPORT — Class-wise overview
// ========================================
export const getSchoolReportService = async (
  month: number,
  year: number,
  tenantId: string
) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const allClasses = await prisma.class.findMany({
    where: { tenantId, isDeleted: false, isActive: true },
    orderBy: { name: "asc" },
  });

  const allSections = await prisma.section.findMany({
    where: { tenantId, isDeleted: false },
  });

  const records = await prisma.attendance.findMany({
    where: {
      tenantId,
      isDeleted: false,
      date: { gte: startDate, lte: endDate },
    },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { tenantId, isDeleted: false },
  });

  const classesReport: any[] = [];
  let totalStudents = 0;
  let totalPresentSum = 0;
  let totalRecordsSum = 0;

  for (const cls of allClasses) {
    const classSections = allSections.filter((s) => s.classId === cls.id);

    for (const section of classSections) {
      const classEnrollments = enrollments.filter(
        (e) => e.classId === cls.id && e.sectionId === section.id
      );
      const classRecords = records.filter(
        (r) => r.classId === cls.id && r.sectionId === section.id
      );

      const presentCount = classRecords.filter((r) => r.status === "PRESENT").length;
      const totalCount = classRecords.length;
      const studentCount = classEnrollments.length;

      const percentage = totalCount === 0 ? "0" : ((presentCount / totalCount) * 100).toFixed(1);

      classesReport.push({
        className: cls.name,
        sectionName: section.name,
        totalStudents: studentCount,
        avgPresent: presentCount,
        avgAbsent: totalCount - presentCount,
        percentage,
      });

      totalStudents += studentCount;
      totalPresentSum += presentCount;
      totalRecordsSum += totalCount;
    }
  }

  const avgPresent = totalRecordsSum === 0 ? "0" : ((totalPresentSum / totalRecordsSum) * 100).toFixed(1);
  const avgAbsent = totalRecordsSum === 0 ? "0" : (((totalRecordsSum - totalPresentSum) / totalRecordsSum) * 100).toFixed(1);

  const uniqueDates = new Set(records.map((r) => r.date.toISOString().split("T")[0]));
  const workingDays = uniqueDates.size;

  return {
    month,
    year,
    totalStudents,
    avgPresent,
    avgAbsent,
    workingDays,
    classes: classesReport,
  };
};

