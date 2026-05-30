import prisma from "../../utils/prisma";

/////////////////////////
// CREATE SUBJECT
/////////////////////////
export const createSubjectService = async (data: any, tenantId: string) => {

  //////////////////////////
  // 🔒 VALIDATE CLASS
  //////////////////////////
  const classExists = await prisma.class.findFirst({
    where: {
      id: data.classId,
      tenantId,
    },
  });

  if (!classExists) {
    throw new Error("Invalid class");
  }

  //////////////////////////
  // 🔒 VALIDATE ACADEMIC YEAR
  //////////////////////////
  const yearExists = await prisma.academicYear.findFirst({
    where: {
      id: data.academicYearId,
      tenantId,
    },
  });

  if (!yearExists) {
    throw new Error("Invalid academic year");
  }

  //////////////////////////
  // 🔒 PREVENT DUPLICATE
  //////////////////////////
  const duplicate = await prisma.subject.findFirst({
    where: {
      tenantId,
      name: data.name,
      classId: data.classId,
      academicYearId: data.academicYearId,
    },
  });

  if (duplicate) {
    throw new Error("Subject already exists for this class");
  }

  //////////////////////////
  // ✅ CREATE
  //////////////////////////
  return prisma.subject.create({
    data: {
      name: data.name,
      classId: data.classId,
      academicYearId: data.academicYearId,
      tenantId,
    },
  });
};

/////////////////////////
// GET SUBJECTS
/////////////////////////
export const getSubjectsService = async (tenantId: string) => {
  return prisma.subject.findMany({
    where: { tenantId },
    include: {
      class: true,
    },
    orderBy: { createdAt: "desc" },
  });
};
// UPDATE SUBJECT
export const updateSubjectService = async (id: string, data: any, tenantId: string) => {
  return prisma.subject.update({
    where: { id },
    data: { name: data.name },
  });
};

// TOGGLE SUBJECT ACTIVE/INACTIVE
export const toggleSubjectService = async (id: string, tenantId: string) => {
  const subject = await prisma.subject.findFirst({ where: { id, tenantId } });
  if (!subject) throw new Error("Subject not found");

  return prisma.subject.update({
    where: { id },
    data: { isActive: !subject.isActive },
  });
};