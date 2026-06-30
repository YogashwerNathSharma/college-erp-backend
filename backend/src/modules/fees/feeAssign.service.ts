
import prisma from "../../utils/prisma";
import { assignFeesToStudent } from "./feeCollection.service";

interface SelectedFeeItem {
  feeHeadId: string;
  amount: number;
  feeHeadName?: string;
  frequency?: string;
}

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
      status: "active",
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
 * Assign fees to specific students (by enrollment IDs) with optional per-student fee head selection.
 *
 * If selectedItems is provided, only those fee heads are assigned.
 * If not provided, ALL items from the FeeStructure are assigned (backward compatible).
 */
export const assignFeesToSelectedStudents = async (
  enrollmentIds: string[],
  tenantId: string,
  selectedItems?: SelectedFeeItem[]
) => {
  let successCount = 0;
  let skipCount = 0;
  const errors: string[] = [];

  for (const enrollmentId of enrollmentIds) {
    try {
      // Use the enhanced assignFeesToStudent from feeCollection.service
      // which now accepts selectedItems and creates StudentFeeItem records
      await assignFeesToStudent(enrollmentId, tenantId, selectedItems);
      successCount++;
    } catch (error: any) {
      if (error.message === "Fees already assigned for this enrollment") {
        skipCount++;
      } else {
        errors.push(`Enrollment ${enrollmentId}: ${error.message}`);
      }
    }
  }

  return {
    message: `Fees assigned to ${successCount} students. Skipped: ${skipCount}. Errors: ${errors.length}`,
    successCount,
    skipCount,
    errors,
  };
};
