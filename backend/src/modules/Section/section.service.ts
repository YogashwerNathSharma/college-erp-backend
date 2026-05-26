import prisma from "../../utils/prisma";

export const createSectionService = async (
  data: any,
  tenantId: string
) => {
  const { name, classId, academicYearId } = data;

  //////////////////////////////
  // 🔒 VALIDATE CLASS (tenant safe)
  //////////////////////////////
  const existingClass = await prisma.class.findFirst({
    where: {
      id: classId,
      tenantId,
    },
  });

  if (!existingClass) {
    throw new Error("Class not found");
  }

  //////////////////////////////
  // 🔒 PREVENT DUPLICATE SECTION
  //////////////////////////////
  const existingSection = await prisma.section.findFirst({
    where: {
      name,
      classId,
      tenantId,
      academicYearId,
    },
  });

  if (existingSection) {
    throw new Error("Section already exists for this class");
  }

  //////////////////////////////
  // ✅ CREATE
  //////////////////////////////
  return prisma.section.create({
    data: {
      name,
      classId,
      academicYearId,
      tenantId,
    },
  });
};