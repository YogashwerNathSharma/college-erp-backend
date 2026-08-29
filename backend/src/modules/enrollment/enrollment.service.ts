import prisma from "../../utils/prisma";

export const getEnrollments = async (user: any) => {
  return await prisma.enrollment.findMany({
    where: { tenantId: user.tenantId, isDeleted: false },
    include: { student: true, class: true, section: true },
  });
};

export const createEnrollment = async (body: any, user: any) => {
  const { studentId, classId, sectionId, academicYearId } = body;
  const tenantId = user?.tenantId;

  if (!studentId || !classId || !sectionId || !academicYearId || !tenantId) {
    throw new Error("All fields are required");
  }

  // Every referenced record must belong to the same tenant. The student must
  // also belong to the selected academic year; otherwise a valid student ID
  // from the same tenant could be enrolled into the wrong session.
  const [student, classData, section, year] = await Promise.all([
    prisma.student.findFirst({
      where: { id: studentId, tenantId, academicYearId, isDeleted: false },
      select: { id: true, tenantId: true, academicYearId: true },
    }),
    prisma.class.findFirst({
      where: { id: classId, tenantId },
      select: { id: true, tenantId: true },
    }),
    prisma.section.findFirst({
      where: { id: sectionId, classId, academicYearId, tenantId, isDeleted: false },
      select: { id: true, tenantId: true, classId: true, academicYearId: true },
    }),
    prisma.academicYear.findFirst({
      where: { id: academicYearId, tenantId },
      select: { id: true, tenantId: true },
    }),
  ]);

  if (!student) throw new Error("Student not found or academic-year/tenant mismatch");
  if (!classData) throw new Error("Class not found or tenant mismatch");
  if (!section) throw new Error("Section does not belong to the selected class, academic year, or tenant");
  if (!year) throw new Error("Academic year not found or tenant mismatch");

  const existing = await prisma.enrollment.findFirst({
    where: { studentId, academicYearId, tenantId, isDeleted: false },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Student already enrolled in this academic year");
  }

  const feeStructure = await prisma.feeStructure.findFirst({
    where: { classId, academicYearId, tenantId, isDeleted: false },
    select: { id: true, totalAmount: true },
  });

  if (!feeStructure) {
    throw new Error("Fee structure not found for the selected class and academic year");
  }

  return await prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.create({
      data: {
        student: { connect: { id: studentId } },
        class: { connect: { id: classId } },
        section: { connect: { id: sectionId } },
        academicYear: { connect: { id: academicYearId } },
        tenant: { connect: { id: tenantId } },
        status: "active",
      },
    });

    const totalAmount = Number(feeStructure.totalAmount);
    const studentFee = await tx.studentFee.create({
      data: {
        tenantId,
        enrollmentId: enrollment.id,
        feeStructureId: feeStructure.id,
        totalAmount,
        netAmount: totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        installmentNo: 1,
        status: "PENDING",
        dueDate: new Date(),
      },
    });

    return { enrollment, studentFee };
  });
};

export const getEnrollmentCountByClass = async (
  classId: string,
  tenantId: string,
  academicYearId?: string
) => {
  return prisma.enrollment.count({
    where: {
      classId,
      tenantId,
      status: "active",
      isDeleted: false,
      ...(academicYearId && { academicYearId }),
    },
  });
};
