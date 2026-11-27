// report-card-extras.service.ts
// Life Skills + Health data for the report card. Everything is stored in the
// database (no hard-coded skill names). Tenant-scoped.

import prisma from "../../utils/prisma";

export interface LifeSkillInput {
  skillName: string;
  term1Value?: string | null;
  term2Value?: string | null;
}

export interface HealthInput {
  height?: string | null;
  weight?: string | null;
  bloodGroup?: string | null;
  dentalHygiene?: string | null;
  passedPromotedToClass?: string | null;
  schoolReopen?: string | null;
}

export const getReportCardExtrasService = async (
  studentId: string,
  academicYearId: string,
  tenantId: string
) => {
  const [lifeSkills, health] = await Promise.all([
    prisma.reportCardLifeSkill.findMany({
      where: { tenantId, studentId, academicYearId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.reportCardHealth.findFirst({
      where: { tenantId, studentId, academicYearId },
    }),
  ]);
  return { lifeSkills, health };
};

export const saveLifeSkillsService = async (
  studentId: string,
  academicYearId: string,
  skills: LifeSkillInput[],
  tenantId: string
) => {
  const clean = (skills || []).filter((s) => s && s.skillName && s.skillName.trim());
  for (const s of clean) {
    await prisma.reportCardLifeSkill.upsert({
      where: {
        tenantId_studentId_academicYearId_skillName: {
          tenantId,
          studentId,
          academicYearId,
          skillName: s.skillName.trim(),
        },
      },
      create: {
        tenantId,
        studentId,
        academicYearId,
        skillName: s.skillName.trim(),
        term1Value: s.term1Value ?? null,
        term2Value: s.term2Value ?? null,
      },
      update: {
        term1Value: s.term1Value ?? null,
        term2Value: s.term2Value ?? null,
      },
    });
  }
  return { saved: clean.length };
};

export const saveHealthService = async (
  studentId: string,
  academicYearId: string,
  data: HealthInput,
  tenantId: string
) => {
  const values = {
    height: data.height ?? null,
    weight: data.weight ?? null,
    bloodGroup: data.bloodGroup ?? null,
    dentalHygiene: data.dentalHygiene ?? null,
    passedPromotedToClass: data.passedPromotedToClass ?? null,
    schoolReopen: data.schoolReopen ?? null,
  };
  return prisma.reportCardHealth.upsert({
    where: {
      tenantId_studentId_academicYearId: { tenantId, studentId, academicYearId },
    },
    create: { tenantId, studentId, academicYearId, ...values },
    update: values,
  });
};
