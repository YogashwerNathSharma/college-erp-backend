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
// GET ALL SECTIONS
export const getSectionsService = async (tenantId: string, academicYearId?: string, classId?: string) => {
  const where: any = { tenantId };
  if (academicYearId) where.academicYearId = academicYearId;
  if (classId) where.classId = classId;

  return prisma.section.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      class: { select: { name: true } },
    },
  });
};

// UPDATE SECTION
export const updateSectionService = async (id: string, data: any, tenantId: string) => {
  return prisma.section.update({
    where: { id },
    data: { name: data.name },
  });
};

// TOGGLE SECTION ACTIVE/INACTIVE
export const toggleSectionService = async (id: string, tenantId: string) => {
  const section = await prisma.section.findFirst({ where: { id, tenantId } });
  if (!section) throw new Error("Section not found");
  return prisma.section.update({
    where: { id },
    data: { isActive: !section.isActive },
  });
};