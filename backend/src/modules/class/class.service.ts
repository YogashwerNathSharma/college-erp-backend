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

export const updateClassService = async (id: string, data: any, tenantId: string) => {
  return prisma.class.update({
    where: { id },
    data: { name: data.name },
  });
};

export const deleteClassService = async (id: string, tenantId: string) => {
  return prisma.class.delete({
    where: { id },
  });
};

// ✅ Fixed getClassesService
export const getClassesService = async (tenantId: string, academicYearId?: string) => {
  const where: any = { tenantId };
  
  if (academicYearId) {
    where.academicYearId = academicYearId;
  }

  const classes = await prisma.class.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return classes;
};
