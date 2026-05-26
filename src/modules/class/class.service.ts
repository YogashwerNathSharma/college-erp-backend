import prisma from "../../utils/prisma";
import { getPagination, buildPaginationMeta } from "../../utils/pagination";
export const createClassService = async (data: any, tenantId: string) => {
  return prisma.class.create({
    data: {
      name: data.name,
      tenantId,
      academicYearId: data.academicYearId,
    },
  });
};



export const getClasses = async (query: any) => {
  const { page, limit, skip } = getPagination(query);

  const [classes, total] = await Promise.all([
    prisma.class.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" }, // ✅ default sorting
    }),
    prisma.class.count(),
  ]);

  return {
    data: classes,
    meta: buildPaginationMeta(total, page, limit),
  };
};