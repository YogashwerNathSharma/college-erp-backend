import prisma from "../../../../utils/prisma";

export const promoteStudents = async (
  body: any,
  tenantId: string,
  performedBy?: string // 🔥 optional userId for history
) => {
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
    // 🔒 CHECK CLASS (tenant-safe)
    ////////////////////////////
    const classExists = await tx.class.findFirst({
      where: {
        id: newClassId,
        tenantId,
      },
    });

    if (!classExists) {
      throw new Error("New class not found");
    }

    ////////////////////////////
    // 🔒 CHECK SECTION (tenant-safe)
    ////////////////////////////
    const sectionExists = await tx.section.findFirst({
      where: {
        id: newSectionId,
        tenantId,
      },
    });

    if (!sectionExists) {
      throw new Error("New section not found");
    }

    ////////////////////////////
    // 🔒 CHECK ACADEMIC YEAR (tenant-safe)
    ////////////////////////////
    const academicYearExists = await tx.academicYear.findFirst({
      where: {
        id: newAcademicYearId,
        tenantId,
      },
    });

    if (!academicYearExists) {
      throw new Error("Academic year not found");
    }

    ////////////////////////////
    // 🔁 PROMOTION LOOP
    ////////////////////////////
    const results = [];

    for (const studentId of studentIds) {

      // 🔒 check student (tenant-safe)
      const student = await tx.student.findFirst({
        where: {
          id: studentId,
          tenantId,
        },
      });

      if (!student) continue;

      ////////////////////////////
      // 🔒 prevent duplicate enrollment
      ////////////////////////////
      const existingEnrollment = await tx.enrollment.findFirst({
        where: {
          studentId,
          academicYearId: newAcademicYearId,
          tenantId,
        },
      });

      if (existingEnrollment) continue;

      ////////////////////////////
      // ✅ create enrollment
      ////////////////////////////
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
      // 🧾 HISTORY (optional)
      ////////////////////////////
      if (performedBy) {
        await tx.studentHistory.create({
          data: {
            studentId,
            tenantId,
            action: "PROMOTED",
            message: `Promoted to new class`,
            performedBy,
          },
        });
      }

      results.push(enrollment);
    }

    return {
      promotedCount: results.length,
      enrollments: results,
    };
  });
};