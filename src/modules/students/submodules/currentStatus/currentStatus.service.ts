import prisma from "../../../../utils/prisma";

export const getStudentCurrent = async (studentId: string, user: any) => {
  const tenantId = user.tenantId;

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
      tenantId,
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
    class: enrollment.class.name,
    section: enrollment.section.name,
    academicYear: enrollment.academicYear.name,
  };
};