/**
 * 👨‍👩‍👧 Parent Portal — Service Layer
 *
 * All DB operations for the Parent Portal.
 * Every query is tenant-scoped and verifies parent-student links for security.
 */

import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";

// ─────────────────────────────────────────────────────
// Helper: Verify that a parent has a link to a student
// ─────────────────────────────────────────────────────
export async function verifyParentStudentLink(
  parentId: string,
  studentId: string,
  tenantId: string
): Promise<boolean> {
  const link = await prisma.parentStudent.findFirst({
    where: {
      parentId,
      studentId,
      tenantId,
      isDeleted: false,
    },
  });
  return !!link;
}

// ─────────────────────────────────────────────────────
// 1. Register Parent (create User + link to student)
// ─────────────────────────────────────────────────────
export async function registerParent(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  studentAdmissionNo: string;
  relation: string;
  tenantId: string;
}) {
  const { name, email, phone, password, studentAdmissionNo, relation, tenantId } = data;

  // 1. Check if student exists in this tenant
  const student = await prisma.student.findFirst({
    where: {
      admissionNo: studentAdmissionNo,
      tenantId,
      isDeleted: false,
    },
  });

  if (!student) {
    throw new Error("Student not found with this admission number in your school.");
  }

  // 2. Verify phone matches one of the guardian phones
  const phoneMatches =
    student.fatherPhone === phone ||
    student.motherPhone === phone ||
    student.guardianPhone === phone ||
    student.phone === phone;

  if (!phoneMatches) {
    throw new Error("Phone number does not match student records. Contact school admin.");
  }

  // 3. Check if email is already registered
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    // If user exists and is already PARENT, just link them
    if (existingUser.role === "PARENT" && existingUser.tenantId === tenantId) {
      const existingLink = await prisma.parentStudent.findFirst({
        where: { parentId: existingUser.id, studentId: student.id, tenantId },
      });
      if (existingLink) {
        throw new Error("You are already linked to this student.");
      }
      // Create new link
      await prisma.parentStudent.create({
        data: {
          parentId: existingUser.id,
          studentId: student.id,
          relation,
          tenantId,
          isPrimary: false,
        },
      });
      return { user: existingUser, student, isExisting: true };
    }
    throw new Error("An account with this email already exists.");
  }

  // 4. Hash password and create user
  const hashedPassword = await bcrypt.hash(password, 10);

  const parentUser = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
      role: "PARENT",
      tenantId,
      isFirstLogin: true,
    },
  });

  // 5. Create ParentStudent link
  await prisma.parentStudent.create({
    data: {
      parentId: parentUser.id,
      studentId: student.id,
      relation,
      tenantId,
      isPrimary: true,
    },
  });

  return { user: parentUser, student, isExisting: false };
}

// ─────────────────────────────────────────────────────
// 2. Get My Children (linked students)
// ─────────────────────────────────────────────────────
export async function getMyChildren(parentId: string, tenantId: string) {
  const links = await prisma.parentStudent.findMany({
    where: {
      parentId,
      tenantId,
      isDeleted: false,
    },
  });

  if (!links.length) return [];

  const studentIds = links.map((l: any) => l.studentId);

  const students = await prisma.student.findMany({
    where: {
      id: { in: studentIds },
      tenantId,
      isDeleted: false,
    },
  });

  // Get enrollments for class/section info
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: { in: studentIds },
      tenantId,
      status: "active",
      isDeleted: false,
    },
    include: {
      class: true,
      section: true,
      academicYear: true,
    },
  });

  // Merge enrollment info into students
  return students.map((student: any) => {
    const enrollment = enrollments.find((e: any) => e.studentId === student.id);
    const link = links.find((l: any) => l.studentId === student.id);
    return {
      ...student,
      className: enrollment?.class?.name || "N/A",
      sectionName: enrollment?.section?.name || "N/A",
      academicYear: enrollment?.academicYear?.name || "N/A",
      enrollmentId: enrollment?.id || null,
      classId: enrollment?.classId || null,
      sectionId: enrollment?.sectionId || null,
      relation: link?.relation || "GUARDIAN",
      isPrimary: link?.isPrimary || false,
    };
  });
}

// ─────────────────────────────────────────────────────
// 3. Get Child Attendance
// ─────────────────────────────────────────────────────
export async function getChildAttendance(
  parentId: string,
  studentId: string,
  tenantId: string,
  month?: number,
  year?: number
) {
  // Security: verify link
  const linked = await verifyParentStudentLink(parentId, studentId, tenantId);
  if (!linked) throw new Error("You are not authorized to view this student's data.");

  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month !== undefined ? month : now.getMonth(); // 0-indexed

  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  const attendance = await prisma.attendance.findMany({
    where: {
      studentId,
      tenantId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
  });

  // Calculate summary
  const total = attendance.length;
  const present = attendance.filter((a: any) => a.status === "PRESENT").length;
  const absent = attendance.filter((a: any) => a.status === "ABSENT").length;
  const late = attendance.filter((a: any) => a.status === "LATE").length;
  const halfDay = attendance.filter((a: any) => a.status === "HALF_DAY").length;

  return {
    records: attendance,
    summary: {
      total,
      present,
      absent,
      late,
      halfDay,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    },
    month: targetMonth,
    year: targetYear,
  };
}

// ─────────────────────────────────────────────────────
// 4. Get Child Exam Results
// ─────────────────────────────────────────────────────
export async function getChildResults(
  parentId: string,
  studentId: string,
  tenantId: string
) {
  const linked = await verifyParentStudentLink(parentId, studentId, tenantId);
  if (!linked) throw new Error("You are not authorized to view this student's data.");

  // Get result summaries
  const results = await prisma.resultSummary.findMany({
    where: {
      studentId,
      tenantId,
      isDeleted: false,
    },
    include: {
      exam: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Get individual marks entries
  const marks = await prisma.marksEntry.findMany({
    where: {
      studentId,
      tenantId,
    },
    include: {
      examSubject: {
        include: {
          subject: true,
          exam: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { results, marks };
}

// ─────────────────────────────────────────────────────
// 5. Get Child Fee Dues
// ─────────────────────────────────────────────────────
export async function getChildFees(
  parentId: string,
  studentId: string,
  tenantId: string
) {
  const linked = await verifyParentStudentLink(parentId, studentId, tenantId);
  if (!linked) throw new Error("You are not authorized to view this student's data.");

  // Get enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      tenantId,
      status: "active",
      isDeleted: false,
    },
  });

  if (!enrollment) {
    return { fees: [], summary: { totalDue: 0, totalPaid: 0, totalBalance: 0 } };
  }

  // Get student fees
  const fees = await prisma.studentFee.findMany({
    where: {
      enrollmentId: enrollment.id,
      tenantId,
      isDeleted: false,
    },
    include: {
      feeHead: true,
      feeStructure: true,
      payments: true,
    },
    orderBy: { dueDate: "asc" },
  });

  const totalDue = fees.reduce((sum: number, f: any) => sum + (f.netAmount || 0), 0);
  const totalPaid = fees.reduce((sum: number, f: any) => sum + (f.paidAmount || 0), 0);
  const totalBalance = fees.reduce((sum: number, f: any) => sum + (f.balanceAmount || 0), 0);

  return {
    fees,
    summary: {
      totalDue,
      totalPaid,
      totalBalance,
    },
  };
}

// ─────────────────────────────────────────────────────
// 6. Get Notices
// ─────────────────────────────────────────────────────
export async function getNotices(tenantId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [notices, total] = await Promise.all([
    prisma.notification.findMany({
      where: {
        tenantId,
        type: { in: ["GENERAL", "NOTICE", "CIRCULAR", "ANNOUNCEMENT"] },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({
      where: {
        tenantId,
        type: { in: ["GENERAL", "NOTICE", "CIRCULAR", "ANNOUNCEMENT"] },
      },
    }),
  ]);

  return { notices, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─────────────────────────────────────────────────────
// 7. Get Parent Profile
// ─────────────────────────────────────────────────────
export async function getParentProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      tenantId: true,
      isActive: true,
      createdAt: true,
    },
  });
  return user;
}

// ─────────────────────────────────────────────────────
// 8. Update Parent Profile
// ─────────────────────────────────────────────────────
export async function updateParentProfile(
  userId: string,
  data: { name?: string; phone?: string }
) {
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.phone) updateData.phone = data.phone;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      tenantId: true,
    },
  });
  return updated;
}
