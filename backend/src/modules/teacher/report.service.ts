
import prisma from "../../utils/prisma";

//////////////////////////////////////////////////////
// TEACHER LIST REPORT
//////////////////////////////////////////////////////
export const getTeacherListReport = async (tenantId: string) => {
  const teachers = await prisma.teacher.findMany({
    where: { tenantId, isDeleted: false },
    include: {
      subjects: {
        where: { isDeleted: false },
        include: { subject: { select: { name: true } } },
      },
      classes: {
        where: { isDeleted: false },
        include: { class: { select: { name: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return teachers.map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    phone: t.phone,
    gender: t.gender || null,
    designation: (t as any).designation || null,
    department: (t as any).department || null,
    status: (t as any).status || "active",
    dob: t.dob || null,
    employeeId: t.employeeId || null,
    subjects: t.subjects.map((s) => s.subject.name).join(", "),
    classes: t.classes.map((c) => c.class.name).join(", "),
    createdAt: t.createdAt,
  }));
};

//////////////////////////////////////////////////////
// ATTENDANCE REPORT
//////////////////////////////////////////////////////
export const getAttendanceReport = async (
  tenantId: string,
  fromDate: string,
  toDate: string,
  teacherId?: string
) => {
  const whereClause: any = {
    tenantId,
    isDeleted: false,
    date: {
      gte: new Date(fromDate),
      lte: new Date(toDate),
    },
  };

  // If teacher-specific attendance is tracked via timetable
  const timetables = await prisma.timetable.findMany({
    where: {
      tenantId,
      isDeleted: false,
      ...(teacherId ? { teacherId } : {}),
    },
    include: {
      teacher: { select: { id: true, name: true } },
      subject: { select: { name: true } },
      class: { select: { name: true } },
    },
  });

  // Group by teacher
  const teacherMap: Record<string, any> = {};
  timetables.forEach((tt) => {
    if (!teacherMap[tt.teacherId]) {
      teacherMap[tt.teacherId] = {
        teacherId: tt.teacherId,
        teacherName: tt.teacher.name,
        totalPeriods: 0,
        subjects: new Set(),
        classes: new Set(),
      };
    }
    teacherMap[tt.teacherId].totalPeriods++;
    teacherMap[tt.teacherId].subjects.add(tt.subject.name);
    teacherMap[tt.teacherId].classes.add(tt.class.name);
  });

  return Object.values(teacherMap).map((t: any) => ({
    ...t,
    subjects: Array.from(t.subjects).join(", "),
    classes: Array.from(t.classes).join(", "),
  }));
};

//////////////////////////////////////////////////////
// LEAVE REPORT
//////////////////////////////////////////////////////
export const getLeaveReport = async (
  tenantId: string,
  fromDate?: string,
  toDate?: string,
  teacherId?: string
) => {
  const whereClause: any = {
    tenantId,
    isDeleted: false,
  };

  if (fromDate && toDate) {
    whereClause.fromDate = { gte: new Date(fromDate) };
    whereClause.toDate = { lte: new Date(toDate) };
  }

  if (teacherId) {
    whereClause.teacherId = teacherId;
  }

  const leaves = await prisma.teacherLeave.findMany({
    where: whereClause,
    include: {
      teacher: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return leaves;
};

//////////////////////////////////////////////////////
// SALARY REPORT
//////////////////////////////////////////////////////
export const getSalaryReport = async (
  tenantId: string,
  month?: number,
  year?: number
) => {
  const whereClause: any = {
    tenantId,
    isDeleted: false,
  };

  if (month) whereClause.month = month;
  if (year) whereClause.year = year;

  const salaries = await prisma.teacherSalary.findMany({
    where: whereClause,
    include: {
      teacher: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalBasic = salaries.reduce((sum, s) => sum + s.basicSalary, 0);
  const totalAllowances = salaries.reduce((sum, s) => sum + s.totalAllowances, 0);
  const totalDeductions = salaries.reduce((sum, s) => sum + s.totalDeductions, 0);
  const totalNet = salaries.reduce((sum, s) => sum + s.netSalary, 0);

  return {
    salaries,
    summary: {
      totalTeachers: salaries.length,
      totalBasic,
      totalAllowances,
      totalDeductions,
      totalNet,
    },
  };
};

//////////////////////////////////////////////////////
// PERFORMANCE REPORT
//////////////////////////////////////////////////////
export const getPerformanceReport = async (
  tenantId: string,
  academicYearId?: string
) => {
  const whereClause: any = {
    tenantId,
    isDeleted: false,
  };

  if (academicYearId) whereClause.academicYearId = academicYearId;

  const performances = await prisma.teacherPerformance.findMany({
    where: whereClause,
    include: {
      teacher: { select: { id: true, name: true } },
      academicYear: { select: { name: true } },
    },
    orderBy: { overallRating: "desc" },
  });

  return performances;
};

//////////////////////////////////////////////////////
// SUBJECT ASSIGNMENT REPORT
//////////////////////////////////////////////////////
export const getSubjectAssignmentReport = async (tenantId: string) => {
  const assignments = await prisma.teacherSubject.findMany({
    where: {
      isDeleted: false,
      teacher: { tenantId, isDeleted: false },
    },
    include: {
      teacher: { select: { id: true, name: true } },
      subject: {
        select: { name: true, class: { select: { name: true } } },
      },
    },
  });

  return assignments.map((a) => ({
    teacherName: a.teacher.name,
    subjectName: a.subject.name,
    className: a.subject.class.name,
  }));
};

