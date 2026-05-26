import prisma from "../../../../utils/prisma";

export const promoteStudents = async (body: any, user: any) => {
  const tenantId = user.tenantId;
  const userId = user.userId; // 🔥 ADD

  const {
    studentIds,
    newClassId,
    newSectionId,
    newAcademicYearId,
  } = body;

  return await prisma.$transaction(async (tx) => {
    ////////////////////////////
    // 🔒 VALIDATION
    ////////////////////////////
    if (!studentIds || studentIds.length === 0) {
      throw new Error("No students selected");
    }

    ////////////////////////////
    // 🔒 CHECK CLASS
    ////////////////////////////
    const classExists = await tx.class.findUnique({
      where: { id: newClassId },
    });

    if (!classExists || classExists.tenantId !== tenantId) {
      throw new Error("New class not found");
    }

    ////////////////////////////
    // 🔒 CHECK SECTION
    ////////////////////////////
    const sectionExists = await tx.section.findUnique({
      where: { id: newSectionId },
    });

    if (!sectionExists || sectionExists.tenantId !== tenantId) {
      throw new Error("New section not found");
    }

    ////////////////////////////
    // 🔒 CHECK ACADEMIC YEAR
    ////////////////////////////
    const academicYearExists = await tx.academicYear.findUnique({
      where: { id: newAcademicYearId },
    });

    if (!academicYearExists || academicYearExists.tenantId !== tenantId) {
      throw new Error("Academic year not found");
    }

    ////////////////////////////
    // 🔁 PROMOTION LOOP
    ////////////////////////////
    const results = [];

    for (const studentId of studentIds) {
      // 🔒 check student
      const student = await tx.student.findUnique({
        where: { id: studentId },
      });

      if (!student || student.tenantId !== tenantId) {
        continue;
      }

      // 🔒 prevent duplicate
      const existingEnrollment = await tx.enrollment.findFirst({
        where: {
          studentId,
          academicYearId: newAcademicYearId,
        },
      });

      if (existingEnrollment) {
        continue;
      }

      // ✅ create enrollment
      const enrollment = await tx.enrollment.create({
        data: {
          studentId,
          classId: newClassId,
          sectionId: newSectionId,
          academicYearId: newAcademicYearId,
          tenantId,
        },
      });

      ////////////////////////////
      // 🧾 ADD HISTORY 🔥🔥🔥
      ////////////////////////////
      await tx.studentHistory.create({
        data: {
          studentId,
          tenantId,
          action: "PROMOTED",
          message: `Promoted to new class`,
          performedBy: userId,
        },
      });

      results.push(enrollment);
    }

    return {
      promotedCount: results.length,
      enrollments: results,
    };
  });
};