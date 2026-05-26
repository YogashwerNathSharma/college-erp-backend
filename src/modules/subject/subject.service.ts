import prisma from "../../utils/prisma";

export const createSubjectService = async (data: any, tenantId: string) => {
  return prisma.subject.create({
    data: {
      name: data.name,
      classId: data.classId,
      academicYearId: data.academicYearId,
      tenantId,
    },
  });
};

export const getSubjectsService = async (tenantId: string) => {
  return prisma.subject.findMany({
    where: { tenantId },
    include: {
      class: true,
    },
    orderBy: { createdAt: "desc" },
  });
};