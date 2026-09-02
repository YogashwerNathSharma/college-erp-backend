import prisma from "../../utils/prisma";

type EnrollmentContext = {
  student: any;
  enrollment: any;
  academicYearId: string;
};

async function getEnrollmentContext(
  userId: string,
  tenantId: string,
  academicYearId: string
): Promise<EnrollmentContext> {
  if (!userId || !tenantId || !academicYearId) {
    throw new Error("Academic year context is required");
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    select: { email: true },
  });
  if (!user) throw new Error("User not found");

  const student = await prisma.student.findFirst({
    where: { tenantId, email: user.email, isDeleted: false },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      gender: true,
      dob: true,
      bloodGroup: true,
      address: true,
      photoUrl: true,
      admissionNo: true,
      rollNumber: true,
      fatherName: true,
      motherName: true,
      fatherPhone: true,
      motherPhone: true,
      guardianName: true,
      guardianPhone: true,
    },
  });
  if (!student) throw new Error("Student record not found for this user");

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: student.id,
      tenantId,
      academicYearId,
      isDeleted: false,
      status: "active",
    },
    orderBy: { createdAt: "desc" },
    include: {
      class: { select: { id: true, name: true, academicYearId: true } },
      section: { select: { id: true, name: true, academicYearId: true } },
      academicYear: { select: { id: true, name: true, isCurrent: true } },
    },
  });

  if (!enrollment) {
    throw new Error("No active enrollment found for the selected academic year");
  }

  if (
    enrollment.class.academicYearId !== academicYearId ||
    enrollment.section.academicYearId !== academicYearId ||
    enrollment.academicYear.id !== academicYearId
  ) {
    throw new Error("Student enrollment is inconsistent with the selected academic year");
  }

  return { student, enrollment, academicYearId };
}

export const getMyProfileServiceAY = async (userId: string, tenantId: string, academicYearId: string) => {
  const { student, enrollment } = await getEnrollmentContext(userId, tenantId, academicYearId);
  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    fullName: `${student.firstName} ${student.lastName}`,
    email: student.email,
    phone: student.phone,
    gender: student.gender,
    dob: student.dob,
    bloodGroup: student.bloodGroup,
    address: student.address,
    photoUrl: student.photoUrl,
    admissionNo: student.admissionNo,
    rollNumber: enrollment.rollNumber || student.rollNumber,
    className: enrollment.class.name,
    sectionName: enrollment.section.name,
    academicYear: enrollment.academicYear.name,
    fatherName: student.fatherName,
    motherName: student.motherName,
    fatherPhone: student.fatherPhone,
    motherPhone: student.motherPhone,
    guardianName: student.guardianName,
    guardianPhone: student.guardianPhone,
  };
};

export const getMyDashboardServiceAY = async (userId: string, tenantId: string, academicYearId: string) => {
  const { student, enrollment } = await getEnrollmentContext(userId, tenantId, academicYearId);
  const studentId = student.id;
  const classId = enrollment.class.id;
  const sectionId = enrollment.section.id;
  const now = new Date();

  const [attendanceRecords, subjects, fees, upcomingExams, todayClasses] = await Promise.all([
    prisma.attendance.findMany({
      where: { studentId, tenantId, academicYearId, isDeleted: false },
      select: { status: true },
    }),
    prisma.subject.findMany({
      where: { classId, tenantId, isDeleted: false },
      select: { id: true },
    }),
    prisma.studentFee.findMany({
      where: { enrollmentId: enrollment.id, tenantId, isDeleted: false },
      select: { totalAmount: true, paidAmount: true, balanceAmount: true, status: true },
    }),
    prisma.exam.findMany({
      where: { classId, academicYearId, tenantId, isDeleted: false, startDate: { gte: now } },
      orderBy: { startDate: "asc" },
      take: 5,
      select: { id: true, name: true, type: true, startDate: true, endDate: true },
    }),
    prisma.timetable.count({
      where: { classId, sectionId, tenantId, day: (["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as any)[now.getDay()], isDeleted: false },
    }),
  ]);

  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(a => a.status === "PRESENT").length;
  const attendancePercentage = totalDays ? Math.round((presentDays / totalDays) * 100) : 0;
  const totalFees = fees.reduce((s, f) => s + f.totalAmount, 0);
  const paidFees = fees.reduce((s, f) => s + f.paidAmount, 0);
  const pendingFees = fees.reduce((s, f) => s + f.balanceAmount, 0);
  const pendingInstallments = fees.filter(f => ["PENDING", "OVERDUE", "PARTIAL"].includes(f.status)).length;

  return {
    student: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      photoUrl: student.photoUrl,
      rollNumber: enrollment.rollNumber || student.rollNumber,
      className: enrollment.class.name,
      sectionName: enrollment.section.name,
      academicYear: enrollment.academicYear.name,
    },
    overview: { totalSubjects: subjects.length, attendancePercentage, pendingInstallments, pendingFees, totalFees, paidFees, todayClasses },
    upcomingExams,
  };
};

export const getMyTimetableServiceAY = async (userId: string, tenantId: string, academicYearId: string, day?: string) => {
  const { enrollment } = await getEnrollmentContext(userId, tenantId, academicYearId);
  let queryDay: string | undefined;
  if (day === "today") queryDay = (["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"])[new Date().getDay()];
  else if (day) queryDay = day.toUpperCase();

  const timetable = await prisma.timetable.findMany({
    where: { classId: enrollment.class.id, sectionId: enrollment.section.id, tenantId, isDeleted: false, ...(queryDay ? { day: queryDay } : {}) },
    orderBy: [{ day: "asc" }, { period: "asc" }],
    include: {
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true, firstName: true, lastName: true } },
    },
  });
  const grouped: Record<string, any[]> = {};
  for (const entry of timetable) {
    (grouped[entry.day] ||= []).push({ id: entry.id, period: entry.period, subject: entry.subject.name, teacher: entry.teacher.name || `${entry.teacher.firstName} ${entry.teacher.lastName}`, day: entry.day });
  }
  return { className: enrollment.class.name, sectionName: enrollment.section.name, timetable: queryDay ? (grouped[queryDay] || []) : grouped };
};

export const getMyAttendanceSummaryServiceAY = async (userId: string, tenantId: string, academicYearId: string) => {
  const { student } = await getEnrollmentContext(userId, tenantId, academicYearId);
  const records = await prisma.attendance.findMany({ where: { studentId: student.id, tenantId, academicYearId, isDeleted: false }, select: { status: true, date: true }, orderBy: { date: "desc" } });
  const presentDays = records.filter(a => a.status === "PRESENT").length;
  const absentDays = records.filter(a => a.status === "ABSENT").length;
  const monthlyMap: Record<string, { present: number; absent: number; total: number }> = {};
  for (const r of records) {
    const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] ||= { present: 0, absent: 0, total: 0 };
    monthlyMap[key].total++;
    if (r.status === "PRESENT") monthlyMap[key].present++; else if (r.status === "ABSENT") monthlyMap[key].absent++;
  }
  return {
    totalDays: records.length,
    presentDays,
    absentDays,
    percentage: records.length ? Math.round((presentDays / records.length) * 100) : 0,
    monthlyBreakdown: Object.entries(monthlyMap).map(([month, data]) => ({ ...data, month, percentage: data.total ? Math.round((data.present / data.total) * 100) : 0 })),
  };
};

export const getMyAttendanceDetailServiceAY = async (userId: string, tenantId: string, academicYearId: string, month?: number, year?: number) => {
  const { student } = await getEnrollmentContext(userId, tenantId, academicYearId);
  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();
  if (targetMonth < 1 || targetMonth > 12) throw new Error("Invalid month");
  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
  const records = await prisma.attendance.findMany({ where: { studentId: student.id, tenantId, academicYearId, date: { gte: startDate, lte: endDate }, isDeleted: false }, select: { date: true, status: true }, orderBy: { date: "asc" } });
  return { month: targetMonth, year: targetYear, records: records.map(r => ({ date: r.date, status: r.status, day: r.date.getDate() })) };
};

export const getMyFeeSummaryServiceAY = async (userId: string, tenantId: string, academicYearId: string) => {
  const { enrollment } = await getEnrollmentContext(userId, tenantId, academicYearId);
  const fees = await prisma.studentFee.findMany({ where: { enrollmentId: enrollment.id, tenantId, isDeleted: false }, select: { netAmount: true, discountAmount: true, fineAmount: true, paidAmount: true, balanceAmount: true, status: true, dueDate: true, installmentNo: true }, orderBy: { installmentNo: "asc" } });
  const nextDue = fees.find(f => ["PENDING", "OVERDUE", "PARTIAL"].includes(f.status));
  return {
    totalAmount: fees.reduce((s, f) => s + f.netAmount, 0),
    totalPaid: fees.reduce((s, f) => s + f.paidAmount, 0),
    totalBalance: fees.reduce((s, f) => s + f.balanceAmount, 0),
    totalDiscount: fees.reduce((s, f) => s + f.discountAmount, 0),
    totalFine: fees.reduce((s, f) => s + f.fineAmount, 0),
    installmentStats: {
      total: fees.length,
      paid: fees.filter(f => f.status === "PAID").length,
      pending: fees.filter(f => f.status === "PENDING").length,
      overdue: fees.filter(f => f.status === "OVERDUE").length,
      partial: fees.filter(f => f.status === "PARTIAL").length,
    },
    nextDue: nextDue ? { installmentNo: nextDue.installmentNo, amount: nextDue.balanceAmount, dueDate: nextDue.dueDate, status: nextDue.status } : null,
  };
};

export const getMyFeeDetailsServiceAY = async (userId: string, tenantId: string, academicYearId: string) => {
  const { enrollment } = await getEnrollmentContext(userId, tenantId, academicYearId);
  const fees = await prisma.studentFee.findMany({ where: { enrollmentId: enrollment.id, tenantId, isDeleted: false }, orderBy: { installmentNo: "asc" }, include: { feeStructure: { select: { name: true } }, payments: { where: { isDeleted: false }, orderBy: { paymentDate: "desc" }, select: { id: true, amount: true, method: true, reference: true, receiptNo: true, paymentDate: true } } } });
  return fees.map(f => ({ id: f.id, installmentNo: f.installmentNo, structureName: f.feeStructure.name, totalAmount: f.totalAmount, discountAmount: f.discountAmount, fineAmount: f.fineAmount, netAmount: f.netAmount, paidAmount: f.paidAmount, balanceAmount: f.balanceAmount, dueDate: f.dueDate, status: f.status, payments: f.payments }));
};

export const getMyExamsServiceAY = async (userId: string, tenantId: string, academicYearId: string) => {
  const { enrollment } = await getEnrollmentContext(userId, tenantId, academicYearId);
  const exams = await prisma.exam.findMany({ where: { classId: enrollment.class.id, academicYearId, tenantId, isDeleted: false }, orderBy: { startDate: "desc" }, include: { examSchedules: { where: { isDeleted: false }, include: { subject: { select: { name: true } }, room: { select: { name: true } } }, orderBy: { examDate: "asc" } } } });
  return exams.map(e => ({ id: e.id, name: e.name, type: e.type, startDate: e.startDate, endDate: e.endDate, isPublished: e.isPublished, schedule: e.examSchedules.map(s => ({ subject: s.subject.name, date: s.examDate, startTime: s.startTime, endTime: s.endTime, room: s.room.name })) }));
};

export const getMyMarksServiceAY = async (userId: string, tenantId: string, academicYearId: string, examId?: string) => {
  const { student, enrollment } = await getEnrollmentContext(userId, tenantId, academicYearId);
  const examWhere: any = { classId: enrollment.class.id, academicYearId, tenantId, isDeleted: false, isPublished: true };
  if (examId) examWhere.id = examId;
  const exams = await prisma.exam.findMany({ where: examWhere, orderBy: { startDate: "desc" }, select: { id: true, name: true, type: true, startDate: true } });
  const results = [];
  for (const exam of exams) {
    const marks = await prisma.marksEntry.findMany({ where: { examId: exam.id, studentId: student.id, tenantId, isDeleted: false } });
    const subjectIds = marks.map(m => m.subjectId);
    const subjects = subjectIds.length ? await prisma.subject.findMany({ where: { id: { in: subjectIds }, classId: enrollment.class.id, tenantId, isDeleted: false }, select: { id: true, name: true } }) : [];
    const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s.name]));
    const resultSummary = await prisma.resultSummary.findFirst({ where: { examId: exam.id, studentId: student.id, tenantId, isDeleted: false } });
    results.push({ examId: exam.id, examName: exam.name, examType: exam.type, examDate: exam.startDate, marks: marks.map(m => ({ subject: subjectMap[m.subjectId] || "Unknown", marksObtained: m.marksObtained, isAbsent: m.isAbsent })), summary: resultSummary ? { totalMarks: resultSummary.totalMarks, totalMaxMarks: resultSummary.totalMaxMarks, percentage: resultSummary.percentage, grade: resultSummary.grade, rank: resultSummary.rank, division: resultSummary.division, status: resultSummary.status } : null });
  }
  return results;
};

export const getMySubjectsServiceAY = async (userId: string, tenantId: string, academicYearId: string) => {
  const { enrollment } = await getEnrollmentContext(userId, tenantId, academicYearId);
  const subjects = await prisma.subject.findMany({ where: { classId: enrollment.class.id, tenantId, isDeleted: false }, include: { teachers: { include: { teacher: { select: { id: true, name: true, firstName: true, lastName: true, photoUrl: true } } } } } });
  return subjects.map(s => ({ id: s.id, name: s.name, periodsPerWeek: s.periodsPerWeek, teachers: s.teachers.map(t => ({ id: t.teacher.id, name: t.teacher.name || `${t.teacher.firstName} ${t.teacher.lastName}`, photoUrl: t.teacher.photoUrl })) }));
};

export const getMyLibraryServiceAY = async (userId: string, tenantId: string, academicYearId: string) => {
  const { student } = await getEnrollmentContext(userId, tenantId, academicYearId);
  const member = await prisma.libraryMember.findFirst({ where: { tenantId, memberType: "STUDENT", isDeleted: false, OR: [{ userId }, ...(student.email ? [{ email: student.email }] : []), { name: `${student.firstName} ${student.lastName}` }] }, select: { id: true, membershipId: true } });
  if (!member) return { isMember: false, membershipId: null, issuedBooks: [], stats: { totalIssued: 0, currentlyIssued: 0, returned: 0, overdue: 0 } };
  const issues = await prisma.bookIssue.findMany({ where: { memberId: member.id, tenantId, isDeleted: false }, orderBy: { issueDate: "desc" }, include: { book: { select: { id: true, title: true, author: true, isbn: true } } } });
  const currentlyIssued = issues.filter(i => i.status === "ISSUED");
  const returned = issues.filter(i => i.status === "RETURNED");
  const overdue = currentlyIssued.filter(i => new Date(i.dueDate) < new Date());
  return { isMember: true, membershipId: member.membershipId, issuedBooks: issues.map(i => ({ id: i.id, book: i.book, issueDate: i.issueDate, dueDate: i.dueDate, returnDate: i.returnDate, status: i.status, fineAmount: i.fineAmount })), stats: { totalIssued: issues.length, currentlyIssued: currentlyIssued.length, returned: returned.length, overdue: overdue.length } };
};
