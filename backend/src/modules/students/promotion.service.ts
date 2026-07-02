
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================
// GET ELIGIBLE STUDENTS FOR PROMOTION
// ============================================
export const getEligibleStudents = async (
  tenantId: string,
  classId: string,
  sectionId: string,
  academicYearId: string
) => {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      tenantId,
      classId,
      sectionId,
      academicYearId,
      status: "active",
      isDeleted: false,
    },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNo: true,
          srNo: true,
          fatherName: true,
          gender: true,
          dob: true,
          status: true,
          isDeleted: true,
        },
      },
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
    },
  });

  return enrollments.filter(
    (e) => e.student && e.student.status === "active" && !e.student.isDeleted
  );
};

// ============================================
// PROMOTE SINGLE STUDENT
// ============================================
export const promoteStudent = async (
  studentId: string,
  fromClassId: string,
  fromSectionId: string,
  fromYearId: string,
  toClassId: string,
  toSectionId: string,
  toYearId: string,
  tenantId: string,
  userId: string,
  rollNumber?: string,
  promotionType: string = "promotion"
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Mark old enrollment as "promoted"
    await tx.enrollment.updateMany({
      where: {
        studentId,
        classId: fromClassId,
        sectionId: fromSectionId,
        academicYearId: fromYearId,
        tenantId,
        status: "active",
      },
      data: {
        status: "promoted",
        updatedAt: new Date(),
      },
    });

    // 2. Create new enrollment in target class/section/year
    const newEnrollment = await tx.enrollment.create({
      data: {
        student: { connect: { id: studentId } },
        class: { connect: { id: toClassId } },
        section: { connect: { id: toSectionId } },
        academicYear: { connect: { id: toYearId } },
        tenant: { connect: { id: tenantId } },
        rollNumber: rollNumber || null,
        status: "active",
      },
    });

    // 3. Create Promotion record
    const promotion = await tx.promotion.create({
      data: {
        student: { connect: { id: studentId } },
        tenant: { connect: { id: tenantId } },
        fromClassId,
        fromSectionId,
        fromAcademicYearId: fromYearId,
        toClassId,
        toSectionId,
        toAcademicYearId: toYearId,
        type: promotionType,
        promotionType,
        promotedBy: userId,
        promotedAt: new Date(),
      },
    });

    // 4. Log to StudentHistory
    await tx.studentHistory.create({
      data: {
        studentId,
        tenantId,
        action: promotionType === "detention" ? "DETENTION" : "PROMOTION",
        details: JSON.stringify({
          promotionType,
          fromClassId,
          fromSectionId,
          fromYearId,
          toClassId,
          toSectionId,
          toYearId,
        }),
        fromClassId,
        fromSectionId,
        toClassId,
        toSectionId,
        academicYearId: toYearId,
        performedBy: userId,
      },
    });

    return { promotion, newEnrollment };
  });
};

// ============================================
// BULK PROMOTE ENTIRE CLASS
// ============================================
export const bulkPromoteClass = async (
  fromClassId: string,
  fromSectionId: string,
  fromYearId: string,
  toClassId: string,
  toSectionId: string,
  toYearId: string,
  tenantId: string,
  userId: string,
  studentIds?: string[],
  promotionType: string = "promotion"
) => {
  let enrollments;

  if (studentIds && studentIds.length > 0) {
    enrollments = await prisma.enrollment.findMany({
      where: {
        tenantId,
        classId: fromClassId,
        sectionId: fromSectionId,
        academicYearId: fromYearId,
        status: "active",
        isDeleted: false,
        studentId: { in: studentIds },
        student: { isDeleted: false, status: "active" },
      },
      select: { studentId: true },
    });
  } else {
    enrollments = await prisma.enrollment.findMany({
      where: {
        tenantId,
        classId: fromClassId,
        sectionId: fromSectionId,
        academicYearId: fromYearId,
        status: "active",
        isDeleted: false,
        student: { isDeleted: false, status: "active" },
      },
      select: { studentId: true },
    });
  }

  if (enrollments.length === 0) {
    return { promoted: 0, failed: 0, errors: [], message: "No eligible students found" };
  }

  const results = { promoted: 0, failed: 0, errors: [] as string[] };

  for (const enrollment of enrollments) {
    try {
      await promoteStudent(
        enrollment.studentId,
        fromClassId,
        fromSectionId,
        fromYearId,
        toClassId,
        toSectionId,
        toYearId,
        tenantId,
        userId,
        undefined,
        promotionType
      );
      results.promoted++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(`${enrollment.studentId}: ${err.message}`);
    }
  }

  return results;
};

// ============================================
// UNDO PROMOTION
// ============================================
export const undoPromotion = async (
  promotionId: string,
  tenantId: string,
  userId: string
) => {
  const promotion = await prisma.promotion.findFirst({
    where: { id: promotionId, tenantId },
  });

  if (!promotion) throw new Error("Promotion record not found");

  return prisma.$transaction(async (tx) => {
    // 1. Soft-delete new enrollment
    await tx.enrollment.updateMany({
      where: {
        studentId: promotion.studentId,
        classId: promotion.toClassId,
        sectionId: promotion.toSectionId,
        academicYearId: promotion.toAcademicYearId,
        tenantId,
        status: "active",
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: "cancelled",
      },
    });

    // 2. Restore old enrollment to "active"
    await tx.enrollment.updateMany({
      where: {
        studentId: promotion.studentId,
        classId: promotion.fromClassId,
        sectionId: promotion.fromSectionId,
        academicYearId: promotion.fromAcademicYearId,
        tenantId,
        status: "promoted",
      },
      data: {
        status: "active",
        updatedAt: new Date(),
      },
    });

    // 3. Delete promotion record
    await tx.promotion.delete({ where: { id: promotionId } });

    // 4. Log undo to history
    await tx.studentHistory.create({
      data: {
        studentId: promotion.studentId,
        tenantId,
        action: "PROMOTION_UNDONE",
        details: JSON.stringify({
          promotionId,
          undoneAt: new Date().toISOString(),
        }),
        fromClassId: promotion.toClassId,
        toClassId: promotion.fromClassId,
        fromSectionId: promotion.toSectionId,
        toSectionId: promotion.fromSectionId,
        academicYearId: promotion.fromAcademicYearId,
        performedBy: userId,
      },
    });

    return { success: true, studentId: promotion.studentId };
  });
};

// ============================================
// SECTION CHANGE
// ============================================
export const changeSectionService = async (
  studentId: string,
  fromSectionId: string,
  toSectionId: string,
  classId: string,
  academicYearId: string,
  tenantId: string,
  userId: string
) => {
  return prisma.$transaction(async (tx) => {
    await tx.enrollment.updateMany({
      where: {
        studentId,
        classId,
        sectionId: fromSectionId,
        academicYearId,
        tenantId,
        status: "active",
        isDeleted: false,
      },
      data: {
        sectionId: toSectionId,
        updatedAt: new Date(),
      },
    });

    await tx.studentHistory.create({
      data: {
        studentId,
        tenantId,
        action: "SECTION_CHANGE",
        details: JSON.stringify({
          fromSectionId,
          toSectionId,
          classId,
          academicYearId,
        }),
        fromClassId: classId,
        toClassId: classId,
        fromSectionId,
        toSectionId,
        academicYearId,
        performedBy: userId,
      },
    });

    return { success: true };
  });
};
