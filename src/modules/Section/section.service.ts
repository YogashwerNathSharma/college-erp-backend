import prisma from "../../utils/prisma";

export const createSectionService = async (
  data: any,
  tenantId: string
) => {
  return prisma.section.create({
    data: {
      name: data.name,
      classId: data.classId,
      tenantId,
      academicYearId: data.academicYearId,
    },
  });
};