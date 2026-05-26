// feeStructure.service.ts

import prisma from "../../../utils/prisma";

export const createFeeStructure = async (body: any, user: any) => {
  const { classId, name, amount, frequency, academicYearId } = body;

  return await prisma.feeStructure.create({
    data: {
      classId,
      name,
      amount,
      frequency,
      academicYearId,
      tenantId: user.tenantId,
    },
  });
};

export const getFeeStructures = async (query: any, user: any) => {
  const { classId } = query;

  return await prisma.feeStructure.findMany({
    where: {
      tenantId: user.tenantId,
      ...(classId && { classId }),
    },
  });
};