import prisma  from "../../utils/prisma";
import { getPagination, buildPaginationMeta } from "../../utils/pagination";

export const getFees = async (query: any) => {
  const { page, limit, skip } = getPagination(query);

  const [fees, total] = await Promise.all([
    prisma.feeStructure.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" }, // ✅ sorting
    }),
    prisma.feeStructure.count(),
  ]);

  return {
    data: fees,
    meta: buildPaginationMeta(total, page, limit),
  };
};
export const getDefaulters = async (query: any, user: any) => {
  const { classId } = query;
  const today = new Date();

  return await prisma.studentFee.findMany({
    where: {
      tenantId: user.tenantId,
      pendingAmount: { gt: 0 },
      dueDate: { lt: today },

      ...(classId && {
        enrollment: {
          classId,
        },
      }),
    },
    include: {
      enrollment: true,
      feeStructure: true,
    },
  });
};