
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STUDENT PORTAL SERVICE
// Student login ke baad apna data dekhne ke liye
// User table se email match karke Student find karte hain
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import prisma from "../../utils/prisma";

// ─────────────────────────────────────────
// HELPER: Find student from userId
// User ka email = Student ka email
// ─────────────────────────────────────────

async function findStudentByUserId(userId: string, tenantId: string) {
  // Get user first
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user) throw new Error("User not found");

  // Find student by email in this tenant
  const student = await prisma.student.findFirst({
    where: {
      tenantId,
      email: user.email,
      isDeleted: false,
    },
    include: {
      enrollments: {
        where: { isDeleted: false, status: "active" },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          class: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
          academicYear: { select: { id: true, name: true, isCurrent: true } },
        },
      },
    },
  });

  if (!student) throw new Error("Student record not found for this user");

  return student;
}

// Helper: Get current enrollment
async function getCurrentEnrollment(userId: string, tenantId: string) {
  const student = await findStudentByUserId(userId, tenantId);
  const enrollment = student.enrollments[0];
  if (!enrollment) throw new Error("No active enrollment found");
  return { student, enrollment };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY PROFILE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getMyProfileService = async (userId: string, tenantId: string) => {
  const { student, enrollment } = await getCurrentEnrollment(userId, tenantId);

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY DASHBOARD
// Overview stats: attendance %, total subjects, pending fees, upcoming exams
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getMyDashboardService = async (userId: string, tenantId: string) => {
  const { student, enrollment } = await getCurrentEnrollment(userId, tenantId);

  const studentId = student.id;
  const classId = enrollment.class.id;
  const sectionId = enrollment.section.id;
  const academicYearId = enrollment.academicYear.id;

  // 1. Attendance Summary
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      studentId,
      tenantId,
      academicYearId,
      isDeleted: false,
    },
    select: { status: true },
  });

  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(
    (a) => a.status === "PRESENT"
  ).length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // 2. Total Subjects
  const subjects = await prisma.subject.findMany({
    where: {
      classId,
      tenantId,
      isDeleted: false,
    },
    select: { id: true },
  });
  const totalSubjects = subjects.length;

  // 3. Fee Summary
  const fees = await prisma.studentFee.findMany({
    where: {
      enrollmentId: enrollment.id,
      tenantId,
      isDeleted: false,
    },
    select: {
      totalAmount: true,
      paidAmount: true,
      balanceAmount: true,
      status: true,
    },
  });

  const totalFees = fees.reduce((sum, f) => sum + f.totalAmount, 0);
  const paidFees = fees.reduce((sum, f) => sum + f.paidAmount, 0);
  const pendingFees = fees.reduce((sum, f) => sum + f.balanceAmount, 0);
  const pendingInstallments = fees.filter(
    (f) => f.status === "PENDING" || f.status === "OVERDUE" || f.status === "PARTIAL"
  ).length;

  // 4. Upcoming Exams
  const now = new Date();
  const upcomingExams = await prisma.exam.findMany({
    where: {
      classId,
      tenantId,
      isDeleted: false,
      startDate: { gte: now },
    },
    orderBy: { startDate: "asc" },
    take: 5,
    select: {
      id: true,
      name: true,
      type: true,
      startDate: true,
      endDate: true,
    },
  });

  // 5. Today's timetable count
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const todayDay = dayNames[now.getDay()];

  const todayClasses = await prisma.timetable.count({
    where: {
      classId,
      sectionId,
      tenantId,
      day: todayDay as any,
      isDeleted: false,
    },
  });

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
    overview: {
      totalSubjects,
      attendancePercentage,
      pendingInstallments,
      pendingFees,
      totalFees,
      paidFees,
      todayClasses,
    },
    upcomingExams,
  };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY TIMETABLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getMyTimetableService = async (
  userId: string,
  tenantId: string,
  day?: string
) => {
  const { enrollment } = await getCurrentEnrollment(userId, tenantId);

  const classId = enrollment.class.id;
  const sectionId = enrollment.section.id;

  // Resolve day
  let queryDay: string | undefined;
  if (day === "today") {
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    queryDay = dayNames[new Date().getDay()];
  } else if (day) {
    queryDay = day.toUpperCase();
  }

  const whereClause: any = {
    classId,
    sectionId,
    tenantId,
    isDeleted: false,
  };
  if (queryDay) {
    whereClause.day = queryDay;
  }

  const timetable = await prisma.timetable.findMany({
    where: whereClause,
    orderBy: [{ day: "asc" }, { period: "asc" }],
    include: {
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true, firstName: true, lastName: true } },
    },
  });

  // Group by day
  const grouped: Record<string, any[]> = {};
  for (const entry of timetable) {
    const d = entry.day;
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push({
      id: entry.id,
      period: entry.period,
      subject: entry.subject.name,
      teacher: entry.teacher.name || `${entry.teacher.firstName} ${entry.teacher.lastName}`,
      day: entry.day,
    });
  }

  return {
    className: enrollment.class.name,
    sectionName: enrollment.section.name,
    timetable: queryDay ? (grouped[queryDay] || []) : grouped,
  };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY ATTENDANCE SUMMARY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getMyAttendanceSummaryService = async (userId: string, tenantId: string) => {
  const { student, enrollment } = await getCurrentEnrollment(userId, tenantId);

  const academicYearId = enrollment.academicYear.id;

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      studentId: student.id,
      tenantId,
      academicYearId,
      isDeleted: false,
    },
    select: { status: true, date: true },
    orderBy: { date: "desc" },
  });

  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const absentDays = attendanceRecords.filter((a) => a.status === "ABSENT").length;
  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Monthly breakdown
  const monthlyMap: Record<string, { present: number; absent: number; total: number }> = {};
  for (const record of attendanceRecords) {
    const monthKey = `${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { present: 0, absent: 0, total: 0 };
    }
    monthlyMap[monthKey].total++;
    if (record.status === "PRESENT") monthlyMap[monthKey].present++;
    else monthlyMap[monthKey].absent++;
  }

  const monthlyBreakdown = Object.entries(monthlyMap).map(([month, data]) => ({
    month,
    ...data,
    percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
  }));

  return {
    totalDays,
    presentDays,
    absentDays,
    percentage,
    monthlyBreakdown,
  };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY ATTENDANCE DETAIL (day-by-day for a month)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getMyAttendanceDetailService = async (
  userId: string,
  tenantId: string,
  month?: number,
  year?: number
) => {
  const { student, enrollment } = await getCurrentEnrollment(userId, tenantId);

  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  const records = await prisma.attendance.findMany({
    where: {
      studentId: student.id,
      tenantId,
      date: { gte: startDate, lte: endDate },
      isDeleted: false,
    },
    select: { date: true, status: true },
    orderBy: { date: "asc" },
  });

  return {
    month: targetMonth,
    year: targetYear,
    records: records.map((r) => ({
      date: r.date,
      status: r.status,
      day: r.date.getDate(),
    })),
  };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY FEE SUMMARY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getMyFeeSummaryService = async (userId: string, tenantId: string) => {
  const { student, enrollment } = await getCurrentEnrollment(userId, tenantId);

  const fees = await prisma.studentFee.findMany({
    where: {
      enrollmentId: enrollment.id,
      tenantId,
      isDeleted: false,
    },
    select: {
      totalAmount: true,
      discountAmount: true,
      fineAmount: true,
      netAmount: true,
      paidAmount: true,
      balanceAmount: true,
      status: true,
      dueDate: true,
      installmentNo: true,
    },
    orderBy: { installmentNo: "asc" },
  });

  const totalAmount = fees.reduce((sum, f) => sum + f.netAmount, 0);
  const totalPaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);
  const totalBalance = fees.reduce((sum, f) => sum + f.balanceAmount, 0);
  const totalDiscount = fees.reduce((sum, f) => sum + f.discountAmount, 0);
  const totalFine = fees.reduce((sum, f) => sum + f.fineAmount, 0);

  const paidCount = fees.filter((f) => f.status === "PAID").length;
  const pendingCount = fees.filter((f) => f.status === "PENDING").length;
  const overdueCount = fees.filter((f) => f.status === "OVERDUE").length;
  const partialCount = fees.filter((f) => f.status === "PARTIAL").length;

  // Next due installment
  const nextDue = fees.find(
    (f) => f.status === "PENDING" || f.status === "OVERDUE" || f.status === "PARTIAL"
  );

  return {
    totalAmount,
    totalPaid,
    totalBalance,
    totalDiscount,
    totalFine,
    installmentStats: {
      total: fees.length,
      paid: paidCount,
      pending: pendingCount,
      overdue: overdueCount,
      partial: partialCount,
    },
    nextDue: nextDue
      ? {
          installmentNo: nextDue.installmentNo,
          amount: nextDue.balanceAmount,
          dueDate: nextDue.dueDate,
          status: nextDue.status,
        }
      : null,
  };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY FEE DETAILS (installment-wise with payments)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getMyFeeDetailsService = async (userId: string, tenantId: string) => {
  const { student, enrollment } = await getCurrentEnrollment(userId, tenantId);

  const fees = await prisma.studentFee.findMany({
    where: {
      enrollmentId: enrollment.id,
      tenantId,
      isDeleted: false,
    },
    orderBy: { installmentNo: "asc" },
    include: {
      feeStructure: { select: { name: true } },
      payments: {
        where: { isDeleted: false },
        orderBy: { paymentDate: "desc" },
        select: {
          id: true,
          amount: true,
          method: true,
          reference: true,
          receiptNo: true,
          paymentDate: true,
        },
      },
    },
  });

  return fees.map((f) => ({
    id: f.id,
    installmentNo: f.installmentNo,
    structureName: f.feeStructure.name,
    totalAmount: f.totalAmount,
    discountAmount: f.discountAmount,
    fineAmount: f.fineAmount,
    netAmount: f.netAmount,
    paidAmount: f.paidAmount,
    balanceAmount: f.balanceAmount,
    dueDate: f.dueDate,
    status: f.status,
    payments: f.payments,
  }));
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY EXAMS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getMyExamsService = async (userId: string, tenantId: string) => {
  const { student, enrollment } = await getCurrentEnrollment(userId, tenantId);

  const classId = enrollment.class.id;
  const academicYearId = enrollment.academicYear.id;

  const exams = await prisma.exam.findMany({
    where: {
      classId,
      academicYearId,
      tenantId,
      isDeleted: false,
    },
    orderBy: { startDate: "desc" },
    include: {
      examSchedules: {
        where: { isDeleted: false },
        include: {
          subject: { select: { name: true } },
          room: { select: { name: true } },
        },
        orderBy: { examDate: "asc" },
      },
    },
  });

  return exams.map((exam) => ({
    id: exam.id,
    name: exam.name,
    type: exam.type,
    startDate: exam.startDate,
    endDate: exam.endDate,
    isPublished: exam.isPublished,
    schedule: exam.examSchedules.map((s) => ({
      subject: s.subject.name,
      date: s.examDate,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room.name,
    })),
  }));
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY MARKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getMyMarksService = async (
  userId: string,
  tenantId: string,
  examId?: string
) => {
  const { student, enrollment } = await getCurrentEnrollment(userId, tenantId);

  const classId = enrollment.class.id;
  const academicYearId = enrollment.academicYear.id;

  // Get all exams for this student's class
  const whereExam: any = {
    classId,
    academicYearId,
    tenantId,
    isDeleted: false,
    isPublished: true,
  };
  if (examId) whereExam.id = examId;

  const exams = await prisma.exam.findMany({
    where: whereExam,
    orderBy: { startDate: "desc" },
    select: { id: true, name: true, type: true, startDate: true },
  });

  // Get marks for each exam
  const results = [];
  for (const exam of exams) {
    const marks = await prisma.marksEntry.findMany({
      where: {
        examId: exam.id,
        studentId: student.id,
        tenantId,
        isDeleted: false,
      },
    });

    // Get subjects for marks
    const subjectIds = marks.map((m) => m.subjectId);
    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true },
    });

    const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s.name]));

    // Get result summary
    const resultSummary = await prisma.resultSummary.findFirst({
      where: {
        examId: exam.id,
        studentId: student.id,
        tenantId,
        isDeleted: false,
      },
    });

    results.push({
      examId: exam.id,
      examName: exam.name,
      examType: exam.type,
      examDate: exam.startDate,
      marks: marks.map((m) => ({
        subject: subjectMap[m.subjectId] || "Unknown",
        marksObtained: m.marksObtained,
        isAbsent: m.isAbsent,
      })),
      summary: resultSummary
        ? {
            totalMarks: resultSummary.totalMarks,
            totalMaxMarks: resultSummary.totalMaxMarks,
            percentage: resultSummary.percentage,
            grade: resultSummary.grade,
            rank: resultSummary.rank,
            division: resultSummary.division,
            status: resultSummary.status,
          }
        : null,
    });
  }

  return results;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY SUBJECTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getMySubjectsService = async (userId: string, tenantId: string) => {
  const { student, enrollment } = await getCurrentEnrollment(userId, tenantId);

  const classId = enrollment.class.id;

  const subjects = await prisma.subject.findMany({
    where: {
      classId,
      tenantId,
      isDeleted: false,
    },
    include: {
      teachers: {
        include: {
          teacher: { select: { id: true, name: true, firstName: true, lastName: true, photoUrl: true } },
        },
      },
    },
  });

  return subjects.map((s) => ({
    id: s.id,
    name: s.name,
    periodsPerWeek: s.periodsPerWeek,
    teachers: s.teachers.map((t) => ({
      id: t.teacher.id,
      name: t.teacher.name || `${t.teacher.firstName} ${t.teacher.lastName}`,
      photoUrl: t.teacher.photoUrl,
    })),
  }));
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY LIBRARY (issued books)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getMyLibraryService = async (userId: string, tenantId: string) => {
  const { student } = await getCurrentEnrollment(userId, tenantId);

  // Find library member for this student — try userId first, then name match
  const member = await prisma.libraryMember.findFirst({
    where: {
      tenantId,
      memberType: "STUDENT",
      isDeleted: false,
      OR: [
        { userId: userId },
        { email: student.email || undefined },
        { name: `${student.firstName} ${student.lastName}` },
      ],
    },
    select: { id: true, membershipId: true },
  });

  if (!member) {
    return {
      isMember: false,
      membershipId: null,
      issuedBooks: [],
      stats: { totalIssued: 0, currentlyIssued: 0, returned: 0, overdue: 0 },
    };
  }

  const issues = await prisma.bookIssue.findMany({
    where: {
      memberId: member.id,
      tenantId,
      isDeleted: false,
    },
    orderBy: { issueDate: "desc" },
    include: {
      book: { select: { id: true, title: true, author: true, isbn: true } },
    },
  });

  const currentlyIssued = issues.filter((i) => i.status === "ISSUED");
  const returned = issues.filter((i) => i.status === "RETURNED");
  const overdue = currentlyIssued.filter((i) => new Date(i.dueDate) < new Date());

  return {
    isMember: true,
    membershipId: member.membershipId,
    issuedBooks: issues.map((i) => ({
      id: i.id,
      book: i.book,
      issueDate: i.issueDate,
      dueDate: i.dueDate,
      returnDate: i.returnDate,
      status: i.status,
      fineAmount: i.fineAmount,
    })),
    stats: {
      totalIssued: issues.length,
      currentlyIssued: currentlyIssued.length,
      returned: returned.length,
      overdue: overdue.length,
    },
  };
};
