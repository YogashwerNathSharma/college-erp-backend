import prisma from "../../utils/prisma";

/**
 * P0-08: ensure every referenced admission/master record belongs to the
 * authenticated tenant before a Student or Enrollment is created.
 * Optional values are skipped so existing admission flows keep working.
 */
export const validateStudentTenantReferences = async (
  tenantId: string,
  refs: {
    academicYearId?: string;
    classId?: string;
    sectionId?: string;
    religionId?: string;
    casteId?: string;
    categoryId?: string;
    nationalityId?: string;
  }
) => {
  const checks = [
    ["academic year", refs.academicYearId, () => prisma.academicYear.findFirst({ where: { id: refs.academicYearId!, tenantId } })],
    ["class", refs.classId, () => prisma.class.findFirst({ where: { id: refs.classId!, tenantId } })],
    ["section", refs.sectionId, () => prisma.section.findFirst({ where: { id: refs.sectionId!, tenantId } })],
    ["religion", refs.religionId, () => prisma.religion.findFirst({ where: { id: refs.religionId!, tenantId } })],
    ["caste", refs.casteId, () => prisma.caste.findFirst({ where: { id: refs.casteId!, tenantId } })],
    ["category", refs.categoryId, () => prisma.category.findFirst({ where: { id: refs.categoryId!, tenantId } })],
    ["nationality", refs.nationalityId, () => prisma.nationality.findFirst({ where: { id: refs.nationalityId!, tenantId } })],
  ] as const;

  for (const [name, id, lookup] of checks) {
    if (!id) continue;
    const record = await lookup();
    if (!record) {
      throw new Error(`Invalid ${name} reference for current tenant`);
    }
  }
};
