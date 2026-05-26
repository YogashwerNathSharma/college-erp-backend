import prisma from "../../../../utils/prisma";

export const getStudentCurrent = async (
  studentId: string,
  tenantId: string
) => {

  ////////////////////////////
  // 🔒 FIND ACTIVE YEAR
  ////////////////////////////
  const activeYear = await prisma.academicYear.findFirst({
    where: {
      tenantId,
      isActive: true,
    },
  });

  if (!activeYear) {
    throw new Error("No active academic year found");
  }

  ////////////////////////////
  // 🔍 FIND CURRENT ENROLLMENT
  ////////////////////////////
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      academicYearId: activeYear.id,
      tenantId, // 🔥 MUST
    },
    include: {
      class: true,
      section: true,
      academicYear: true,
    },
  });

  if (!enrollment) {
    throw new Error("Student not enrolled in current year");
  }

  return {
    studentId,
    class: enrollment.class?.name || "N/A",
    section: enrollment.section?.name || "N/A",
    academicYear: enrollment.academicYear?.name || "N/A",
  };
};