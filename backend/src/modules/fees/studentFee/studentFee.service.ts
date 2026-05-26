import prisma from "../../../utils/prisma";

//////////////////////////////
// ASSIGN STUDENT FEE
//////////////////////////////
export const assignStudentFee = async (
  body: any,
  tenantId: string
) => {
  const { studentId, feeStructureId } = body;

  //////////////////////////////
  // 🔒 GET ENROLLMENT (tenant-safe)
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
  // 🔒 GET FEE STRUCTURE (tenant-safe 🔥)
  //////////////////////////////
  const feeStructure = await prisma.feeStructure.findFirst({
    where: {
      id: feeStructureId,
      tenantId, // 🔥 IMPORTANT
    },
  });

  if (!feeStructure) {
    throw new Error("Fee structure not found");
  }

  //////////////////////////////
  // 🚫 PREVENT DUPLICATE (tenant-safe 🔥)
  //////////////////////////////
  const existing = await prisma.studentFee.findFirst({
    where: {
      enrollmentId: enrollment.id,
      feeStructureId,
      tenantId, // 🔥 IMPORTANT
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
      enrollmentId: enrollment.id,
      feeStructureId,

      totalAmount: feeStructure.amount,
      paidAmount: 0,
      pendingAmount: feeStructure.amount,

      status: "UNPAID",

      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),

      tenantId, // 🔥 MUST
    },
  });
};

//////////////////////////////////////////////////////
// GET STUDENT FEES
//////////////////////////////////////////////////////
export const getStudentFees = async (
  studentId: string,
  tenantId: string
) => {
  return await prisma.studentFee.findMany({
    where: {
      tenantId,
      enrollment: {
        is: {
          studentId, // 🔥 Prisma relation filter
        },
      },
    },
    include: {
      feeStructure: true,
      enrollment: true,
    },
  });
};