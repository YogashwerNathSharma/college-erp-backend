import prisma from "../../../utils/prisma";

// ✅ CREATE
export const createFeeStructure = async (
  body: any,
  tenantId: string
) => {
  const { classId, name, amount, frequency, academicYearId } = body;

  return await prisma.feeStructure.create({
    data: {
      classId,
      name,
      amount,
      frequency,
      academicYearId,
      tenantId, // 🔥 FIX
    },
  });
};

// ✅ GET
export const getFeeStructures = async (
  query: any,
  tenantId: string
) => {
  const { classId } = query;

  return await prisma.feeStructure.findMany({
    where: {
      tenantId, // 🔥 FIX
      ...(classId && { classId }),
    },
  });
};