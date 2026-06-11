
import prisma from "../../utils/prisma";

/**
 * Get students in a class with their fee assignment status
 */
export const getStudentsWithAssignmentStatus = async (
  classId: string,
  academicYearId: string,
  tenantId: string
) => {
  // Get all active enrollments in the class
  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId,
      academicYearId,
      tenantId,
      status: "ACTIVE",
      isDeleted: false,
    },
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
          admissionNo: true,
          fatherName: true,
          phone: true,
        },
      },
      section: { select: { name: true } },
    },
    orderBy: { rollNumber: "asc" },
  });

  // Get all student fees for this class to determine assignment status
  const studentFees = await prisma.studentFee.findMany({
    where: {
      tenantId,
      enrollment: {
        classId,
        academicYearId,
      },
      isDeleted: false,
    },
    select: {
      enrollmentId: true,
      status: true,
    },
  });

  // Group fees by enrollment
  const feesByEnrollment: Record<string, string[]> = {};
  for (const fee of studentFees) {
    if (!feesByEnrollment[fee.enrollmentId]) {
      feesByEnrollment[fee.enrollmentId] = [];
    }
    feesByEnrollment[fee.enrollmentId].push(fee.status);
  }

  // Build response
  const students = enrollments.map((enrollment, index) => {
    const feeStatuses = feesByEnrollment[enrollment.id] || [];
    let assignmentStatus: "ASSIGNED" | "NOT_ASSIGNED" | "PARTIAL" = "NOT_ASSIGNED";

    if (feeStatuses.length > 0) {
      assignmentStatus = "ASSIGNED";
    }

    return {
      id: enrollment.id,
      rollNumber: enrollment.rollNumber || String(index + 1),
      studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
      admissionNo: enrollment.student.admissionNo,
      fatherName: enrollment.student.fatherName,
      phone: enrollment.student.phone,
      section: enrollment.section?.name || "-",
      assignmentStatus,
      totalFees: feeStatuses.length,
    };
  });

  const totalStudents = students.length;
  const assignedCount = students.filter((s) => s.assignmentStatus === "ASSIGNED").length;
  const unassignedCount = students.filter((s) => s.assignmentStatus === "NOT_ASSIGNED").length;

  return {
    students,
    summary: {
      totalStudents,
      assignedCount,
      unassignedCount,
    },
  };
};

/**
 * Assign fees to specific students (by enrollment IDs)
 */
export const assignFeesToSelectedStudents = async (
  enrollmentIds: string[],
  tenantId: string
) => {
  let successCount = 0;
  let skipCount = 0;
  const errors: string[] = [];

  for (const enrollmentId of enrollmentIds) {
    try {
      // Check if fees already assigned
      const existing = await prisma.studentFee.findFirst({
        where: { enrollmentId, tenantId, isDeleted: false },
      });

      if (existing) {
        skipCount++;
        continue;
      }

      // Get enrollment details
      const enrollment = await prisma.enrollment.findFirst({
        where: { id: enrollmentId, tenantId, isDeleted: false },
        include: { academicYear: true },
      });

      if (!enrollment) {
        errors.push(`Enrollment ${enrollmentId}: Not found`);
        continue;
      }

      // Get fee structures for the class
      const feeStructures = await prisma.feeStructure.findMany({
        where: {
          tenantId,
          classId: enrollment.classId,
          academicYearId: enrollment.academicYearId,
          isDeleted: false,
          isActive: true,
        },
      });

      if (feeStructures.length === 0) {
        errors.push(`Enrollment ${enrollmentId}: No fee structure found`);
        continue;
      }

      const academicYearStart = new Date(enrollment.academicYear.startDate);
      const studentFees: any[] = [];

      for (const structure of feeStructures) {
        const totalInstallments = structure.totalInstallments || 1;
        const amountPerInstallment = structure.totalAmount / totalInstallments;
        const dueDay = structure.dueDay || 10;

        for (let i = 1; i <= totalInstallments; i++) {
          const dueDate = new Date(academicYearStart);
          dueDate.setMonth(dueDate.getMonth() + (i - 1));
          dueDate.setDate(dueDay);

          studentFees.push({
            tenantId,
            enrollmentId,
            feeStructureId: structure.id,
            totalAmount: amountPerInstallment,
            discountAmount: 0,
            fineAmount: 0,
            netAmount: amountPerInstallment,
            paidAmount: 0,
            balanceAmount: amountPerInstallment,
            installmentNo: i,
            dueDate,
            status: "PENDING",
          });
        }
      }

      await prisma.studentFee.createMany({ data: studentFees });
      successCount++;
    } catch (error: any) {
      errors.push(`Enrollment ${enrollmentId}: ${error.message}`);
    }
  }

  return {
    message: `Fees assigned to ${successCount} students. Skipped: ${skipCount}. Errors: ${errors.length}`,
    successCount,
    skipCount,
    errors,
  };
};

