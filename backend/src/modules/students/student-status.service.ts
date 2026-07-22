// ══════════════════════════════════════════════════════════════════
// ENTERPRISE STUDENT MODULE — Status & Operations Service
// ══════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { StudentStatus, StatusChangeInput, TransferInput, StudentLoginCredentials, AuditAction } from "./student.types";
import { VALID_STATUS_TRANSITIONS } from "./student.constants";

const prisma = new PrismaClient();

// ============================================
// CHANGE STUDENT STATUS
// ============================================
export const changeStatus = async (
  tenantId: string,
  studentId: string,
  input: StatusChangeInput,
  userId: string
): Promise<any> => {
  const { newStatus, reason, effectiveDate } = input;

  // Get current student
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, isDeleted: false },
    select: { id: true, status: true, firstName: true, lastName: true, admissionNo: true },
  });

  if (!student) throw new Error("Student not found");

  // Validate status transition
  const currentStatus = student.status;
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
      `Allowed transitions from "${currentStatus}": ${allowedTransitions.join(", ") || "none"}`
    );
  }

  // Update student status
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.student.update({
      where: { id: studentId },
      data: {
        status: newStatus,
        statusChangedAt: effectiveDate ? new Date(effectiveDate) : new Date(),
        statusChangedBy: userId,
        statusReason: reason,
        updatedBy: userId,
      },
    });

    // Update enrollment status to match
    if (newStatus === "active") {
      await tx.enrollment.updateMany({
        where: { studentId, tenantId, isDeleted: false },
        data: { status: "active" },
      });
    } else if (["inactive", "suspended", "dropped", "transferred"].includes(newStatus)) {
      await tx.enrollment.updateMany({
        where: { studentId, tenantId, status: "active", isDeleted: false },
        data: { status: newStatus },
      });
    }

    // Log to timeline
    await tx.studentTimelineEntry.create({
      data: {
        studentId,
        tenantId,
        type: "status_change",
        title: `Status Changed: ${currentStatus} → ${newStatus}`,
        description: reason,
        createdBy: userId,
      },
    });

    // Log to student history
    await tx.studentHistory.create({
      data: {
        studentId,
        tenantId,
        action: "STATUS_CHANGE",
        details: JSON.stringify({
          fromStatus: currentStatus,
          toStatus: newStatus,
          reason,
          effectiveDate: effectiveDate || new Date().toISOString(),
        }),
        performedBy: userId,
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        tenantId,
        module: "STUDENT",
        action: "STATUS_CHANGE",
        entity: "Student",
        entityId: studentId,
        entityType: "Student",
        previousData: { status: currentStatus },
        newData: { status: newStatus, reason },
        performedBy: userId,
      },
    });

    return updated;
  });

  return result;
};

// ============================================
// TRANSFER STUDENT
// ============================================
export const transferStudent = async (
  tenantId: string,
  studentId: string,
  input: TransferInput,
  userId: string
): Promise<any> => {
  const { reason, destinationSchool, effectiveDate, generateTC, remarks, tcNumber } = input;

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, isDeleted: false },
    include: {
      enrollments: {
        where: { status: "active", isDeleted: false },
        include: {
          class: { select: { name: true } },
          section: { select: { name: true } },
          academicYear: { select: { name: true } },
        },
        take: 1,
      },
    },
  });

  if (!student) throw new Error("Student not found");
  if (student.status === "transferred") throw new Error("Student is already transferred");

  return prisma.$transaction(async (tx) => {
    // 1. Update status to transferred
    const updated = await tx.student.update({
      where: { id: studentId },
      data: {
        status: "transferred",
        statusChangedAt: new Date(effectiveDate),
        statusChangedBy: userId,
        statusReason: reason,
        updatedBy: userId,
      },
    });

    // 2. Deactivate enrollments
    await tx.enrollment.updateMany({
      where: { studentId, tenantId, status: "active" },
      data: { status: "transferred" },
    });

    // 3. Generate TC if requested
    let tcRecord = null;
    if (generateTC) {
      const tcNo = tcNumber || `TC/${new Date().getFullYear()}/${Date.now().toString().slice(-6)}`;
      tcRecord = await tx.transferCertificate.create({
        data: {
          studentId,
          tenantId,
          tcNumber: tcNo,
          issueDate: new Date(effectiveDate),
          reason,
          destinationSchool,
          remarks: remarks || null,
          issuedBy: userId,
          lastClass: student.enrollments[0]?.class?.name || "N/A",
          lastSection: student.enrollments[0]?.section?.name || "",
        },
      });
    }

    // 4. Timeline entry
    await tx.studentTimelineEntry.create({
      data: {
        studentId,
        tenantId,
        type: "transfer",
        title: `Transferred to ${destinationSchool}`,
        description: `Reason: ${reason}. ${generateTC ? `TC No: ${tcRecord?.tcNumber}` : "No TC generated."}`,
        createdBy: userId,
      },
    });

    // 5. Student history
    await tx.studentHistory.create({
      data: {
        studentId,
        tenantId,
        action: "TRANSFER",
        details: JSON.stringify({
          destinationSchool,
          reason,
          effectiveDate,
          tcNumber: tcRecord?.tcNumber || null,
          lastClass: student.enrollments[0]?.class?.name,
        }),
        performedBy: userId,
      },
    });

    // 6. Audit log
    await tx.auditLog.create({
      data: {
        tenantId,
        module: "STUDENT",
        action: "TRANSFER",
        entityId: studentId,
        entityType: "Student",
        previousData: { status: student.status },
        newData: { status: "transferred", destinationSchool, reason },
        performedBy: userId,
      },
    });

    return {
      student: updated,
      transferCertificate: tcRecord,
    };
  });
};

// ============================================
// GENERATE STUDENT LOGIN
// ============================================
export const generateLogin = async (
  tenantId: string,
  studentId: string,
  userId: string
): Promise<StudentLoginCredentials> => {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, isDeleted: false },
    select: { id: true, admissionNo: true, firstName: true, lastName: true, email: true },
  });

  if (!student) throw new Error("Student not found");

  // Check if credentials already exist
  const existing = await prisma.studentCredential.findUnique({
    where: { studentId },
  });

  if (existing) {
    throw new Error("Login credentials already exist for this student. Use reset password instead.");
  }

  // Generate username and password
  const username = student.admissionNo.toLowerCase().replace(/[^a-z0-9]/g, "");
  const rawPassword = `${student.firstName.slice(0, 4)}@${student.admissionNo.slice(-4)}`;
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  // Create credential record
  await prisma.studentCredential.create({
    data: {
      studentId,
      tenantId,
      username,
      passwordHash,
      isActive: true,
    },
  });

  // Also create a User record for the student portal
  try {
    await prisma.user.create({
      data: {
        name: `${student.firstName} ${student.lastName}`,
        email: student.email || `${username}@student.local`,
        password: passwordHash,
        passwordHash,
        role: "STUDENT",
        tenantId,
        isActive: true,
      },
    });
  } catch {
    // User might already exist (e.g., email conflict) — that's okay
  }

  // Timeline entry
  await prisma.studentTimelineEntry.create({
    data: {
      studentId,
      tenantId,
      type: "login_generated",
      title: "Login Credentials Generated",
      description: `Username: ${username}`,
      createdBy: userId,
    },
  });

  return {
    username,
    password: rawPassword,
    studentId,
    isNew: true,
  };
};

// ============================================
// RESET STUDENT PASSWORD
// ============================================
export const resetPassword = async (
  tenantId: string,
  studentId: string,
  userId: string
): Promise<StudentLoginCredentials> => {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, isDeleted: false },
    select: { id: true, admissionNo: true, firstName: true },
  });

  if (!student) throw new Error("Student not found");

  const credential = await prisma.studentCredential.findUnique({
    where: { studentId },
  });

  if (!credential) {
    throw new Error("No login credentials found. Generate login first.");
  }

  // Generate new password
  const newPassword = `${student.firstName.slice(0, 3)}#${Date.now().toString().slice(-5)}`;
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.studentCredential.update({
    where: { studentId },
    data: { passwordHash, updatedAt: new Date() },
  });

  // Timeline entry
  await prisma.studentTimelineEntry.create({
    data: {
      studentId,
      tenantId,
      type: "password_reset",
      title: "Password Reset",
      description: "Student portal password was reset by admin",
      createdBy: userId,
    },
  });

  return {
    username: credential.username,
    password: newPassword,
    studentId,
    isNew: false,
  };
};

// ============================================
// BULK STATUS CHANGE
// ============================================
export const bulkStatusChange = async (
  tenantId: string,
  studentIds: string[],
  newStatus: string,
  reason: string,
  userId: string
): Promise<{ success: number; failed: number; errors: Array<{ id: string; error: string }> }> => {
  let success = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const studentId of studentIds) {
    try {
      await changeStatus(tenantId, studentId, { status: newStatus as StudentStatus, reason }, userId);
      success++;
    } catch (error: any) {
      failed++;
      errors.push({ id: studentId, error: error.message });
    }
  }

  return { success, failed, errors };
};

// ============================================
// GET STATUS HISTORY
// ============================================
export const getStatusHistory = async (
  tenantId: string,
  studentId: string
): Promise<any[]> => {
  const history = await prisma.studentHistory.findMany({
    where: {
      studentId,
      tenantId,
      action: { in: ["STATUS_CHANGE", "TRANSFER", "ADMISSION", "PROMOTION"] },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return history.map((h) => {
    let details: any = {};
    try {
      details = JSON.parse(h.details || "{}");
    } catch {}

    return {
      id: h.id,
      action: h.action,
      details,
      performedBy: h.performedBy,
      createdAt: h.createdAt,
    };
  });
};

// ============================================
// GET AUDIT LOG (full change trail)
// ============================================
export const getAuditLog = async (
  tenantId: string,
  studentId: string,
  page: number = 1,
  limit: number = 20
): Promise<any> => {
  const where = {
    tenantId,
    entityId: studentId,
    entityType: "Student",
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// Named export aliases for backward compatibility
export { changeStatus as changeStudentStatus };
export { generateLogin as generateStudentLogin };
export { resetPassword as resetStudentPassword };
