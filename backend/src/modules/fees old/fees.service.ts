import prisma from "../../utils/prisma";
import { getPagination, buildPaginationMeta } from "../../utils/pagination";

//////////////////////////////
// GET FEES (TENANT SAFE 🔥)
//////////////////////////////
export const getFees = async (query: any, tenantId: string) => {
  const { page, limit, skip } = getPagination(query);

  const [fees, total] = await Promise.all([
    prisma.feeStructure.findMany({
      where: {
        tenantId, // 🔥 MUST
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.feeStructure.count({
      where: {
        tenantId, // 🔥 MUST
      },
    }),
  ]);

  return {
    data: fees,
    meta: buildPaginationMeta(total, page, limit),
  };
};

//////////////////////////////
// GET DEFAULTERS (FIXED 🔥)
//////////////////////////////
export const getDefaulters = async (
  query: any,
  tenantId: string
) => {
  const { classId } = query;
  const today = new Date();

  return await prisma.studentFee.findMany({
    where: {
      tenantId,
      pendingAmount: { gt: 0 },
      dueDate: { lt: today },

      ...(classId && {
        enrollment: {
          is: { classId }, // 🔥 FIX
        },
      }),
    },
    include: {
      enrollment: {
        include: {
          student: true,
          class: true,
        },
      },
      feeStructure: true,
    },
  });
};