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
  const subjects = await prisma.subject.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  // Resolve class names separately to avoid relation errors
  const classIds = [...new Set(subjects.map((s) => s.classId))];
  const classes = classIds.length > 0
    ? await prisma.class.findMany({ where: { id: { in: classIds } } })
    : [];

  return subjects.map((s) => ({
    ...s,
    class: classes.find((c) => c.id === s.classId) || { id: s.classId, name: "Unknown" },
  }));
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

/////////////////////////
// BULK CREATE SUBJECTS (All classes at once)
/////////////////////////
export const bulkCreateSubjectsService = async (
  data: { names: string[]; classIds: string[]; academicYearId: string },
  tenantId: string
) => {
  console.log("BULK CREATE SUBJECTS:", { names: data.names, classIds: data.classIds, academicYearId: data.academicYearId, tenantId });
  const { names, classIds, academicYearId } = data;

  if (!names || names.length === 0) throw new Error("At least one subject name is required");
  if (!classIds || classIds.length === 0) throw new Error("At least one class is required");
  if (!academicYearId) throw new Error("Academic year is required");

  let created = 0;
  let skipped = 0;

  for (const classId of classIds) {
    for (const name of names) {
      const trimmed = name.trim();
      if (!trimmed) continue;

      // Check duplicate
      const existing = await prisma.subject.findFirst({
        where: { tenantId, name: trimmed, classId, academicYearId },
      });
      if (existing) {
        skipped++;
        continue;
      }

      await prisma.subject.create({
        data: { name: trimmed, classId, academicYearId, tenantId },
      });
      created++;
    }
  }

  return { created, skipped, total: names.length * classIds.length };
};
