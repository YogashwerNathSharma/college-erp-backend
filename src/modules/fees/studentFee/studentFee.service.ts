import prisma from "../../../utils/prisma";

export const assignStudentFee = async (body: any, user: any) => {
  const tenantId = user.tenantId;

  const { studentId, feeStructureId } = body;

  //////////////////////////////
  // 🔒 GET ENROLLMENT
  //////////////////////////////
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      tenantId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!enrollment) {
    throw new Error("Student not enrolled");
  }

  //////////////////////////////
  // 🔒 GET FEE STRUCTURE
  //////////////////////////////
  const feeStructure = await prisma.feeStructure.findUnique({
    where: { id: feeStructureId },
  });

  if (!feeStructure) {
    throw new Error("Fee structure not found");
  }

  //////////////////////////////
  // 🚫 PREVENT DUPLICATE
  //////////////////////////////
  const existing = await prisma.studentFee.findFirst({
    where: {
      enrollmentId: enrollment.id,
      feeStructureId,
    },
  });

  if (existing) {
    throw new Error("Fee already assigned");
  }

  //////////////////////////////
  // ✅ CREATE
  //////////////////////////////
  return await prisma.studentFee.create({
    data: {

      enrollmentId: enrollment.id, // ✅ FIX
      feeStructureId,

      totalAmount: feeStructure.amount,
      paidAmount: 0,
      pendingAmount: feeStructure.amount,

      status: "UNPAID",

      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // ✅ FIX

      tenantId,
    },
  });
};

//////////////////////////////////////////////////////
// GET STUDENT FEES
//////////////////////////////////////////////////////
export const getStudentFees = async (studentId: string, user: any) => {
  return await prisma.studentFee.findMany({
    where: {
      tenantId: user.tenantId,
      enrollment: {
        studentId: studentId, // ✅ FIX
      },
    },
    include: {
      feeStructure: true,
      enrollment: true,
    },
  });
};