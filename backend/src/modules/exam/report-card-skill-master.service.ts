// report-card-skill-master.service.ts
// Admin-managed life skills, scoped by tenant + academic year + class.
// A skill from one session or class never shows in another.

import prisma from "../../utils/prisma";

const scopeOf = (tenantId: string, academicYearId?: string, classId?: string) => {
  if (!academicYearId || !classId) {
    throw new Error("academicYearId and classId are required");
  }
  return { tenantId, academicYearId, classId };
};

export const listSkillMastersService = async (
  tenantId: string,
  academicYearId?: string,
  classId?: string,
  includeInactive = false
) => {
  return prisma.reportCardSkillMaster.findMany({
    where: {
      ...scopeOf(tenantId, academicYearId, classId),
      ...(includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
};

export const createSkillMasterService = async (
  data: { name: string; sortOrder?: number; academicYearId?: string; classId?: string },
  tenantId: string
) => {
  const name = (data.name || "").trim();
  if (!name) throw new Error("Skill name is required");
  const scope = scopeOf(tenantId, data.academicYearId, data.classId);
  return prisma.reportCardSkillMaster.upsert({
    where: {
      tenantId_academicYearId_classId_name: { ...scope, name },
    },
    create: { ...scope, name, sortOrder: data.sortOrder ?? 0, isActive: true },
    update: {
      isActive: true,
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  });
};

export const updateSkillMasterService = async (
  id: string,
  data: { name?: string; sortOrder?: number; isActive?: boolean },
  tenantId: string
) => {
  const existing = await prisma.reportCardSkillMaster.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error("Skill not found");
  return prisma.reportCardSkillMaster.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
};
