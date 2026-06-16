import prisma from "../../utils/prisma";
export const getEnrollments = async (user: any) => {
  return await prisma.enrollment.findMany({
    where: {
      tenantId: user.tenantId,
    },
    include: {
      student: true,
      class: true,
      section: true,
    },
  });
};
export const createEnrollment = async (body: any, user: any) => {
  const { studentId, classId, sectionId, academicYearId } = body;
  const tenantId = user?.tenantId;

  if (!studentId || !classId || !sectionId || !academicYearId || !tenantId) {
    throw new Error("All fields are required");
  }

  /////////////////////////
  // FETCH DATA
  /////////////////////////
  const [student, classData, section, year] = await Promise.all([
    prisma.student.findFirst({
      where: { id: studentId, tenantId, isDeleted: false },
    }),

    prisma.class.findFirst({
      where: { id: classId, tenantId },
    }),

    prisma.section.findFirst({
      where: {
        id: sectionId,
        classId,
        academicYearId,
        tenantId,
      },
    }),

    prisma.academicYear.findFirst({
      where: { id: academicYearId, tenantId },
    }),
  ]);

  /////////////////////////
  // DEBUG LOGS 🔥
  /////////////////////////
  console.log("===== DEBUG START =====");
  console.log("studentId:", studentId);
  console.log("classId:", classId);
  console.log("sectionId:", sectionId);
  console.log("academicYearId:", academicYearId);
  console.log("tenantId:", tenantId);

  console.log("student:", student);
  console.log("class:", classData);
  console.log("section:", section);
  console.log("year:", year);

  /////////////////////////
  // VALIDATION WITH CLEAR ERRORS
  /////////////////////////
  if (!student) throw new Error("❌ Student not found / deleted / tenant mismatch");

  if (!classData) throw new Error("❌ Class not found / tenant mismatch");

  if (!section)
    throw new Error(
      "❌ Section invalid → check classId + academicYearId + tenantId match"
    );

  if (!year) throw new Error("❌ Academic year not found");

  /////////////////////////
  // DUPLICATE CHECK
  /////////////////////////
  const existing = await prisma.enrollment.findFirst({
    where: {
      studentId,
      academicYearId,
      tenantId,
    },
  });

  if (existing) {
    console.log("existing enrollment:", existing);
    throw new Error("❌ Student already enrolled in this academic year");
  }

  /////////////////////////
  // FEE STRUCTURE CHECK
  /////////////////////////
  const feeStructure = await prisma.feeStructure.findFirst({
    where: {
      classId,
      academicYearId,
      tenantId,
      isDeleted: false,
    },
  });

  console.log("feeStructure:", feeStructure);

  if (!feeStructure) {
    throw new Error(
      "❌ Fee structure not found → check classId + academicYearId + tenantId"
    );
  }

  /////////////////////////
  // TRANSACTION
  /////////////////////////
  return await prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.create({
      data: {
        student: { connect: { id: studentId } },
        class: { connect: { id: classId } },
        section: { connect: { id: sectionId } },
        academicYear: { connect: { id: academicYearId } },
        tenant: { connect: { id: tenantId } },
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
      }
    });

    console.log("✅ Enrollment + StudentFee created");

    return { enrollment, studentFee };
  });
};