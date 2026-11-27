// report-card-template.service.ts
// One report card template per exam. Skills on it must belong to the same
// tenant, academic year and class as the exam.

import prisma from "../../utils/prisma";

export const getTemplateByExamService = async (examId: string, tenantId: string) => {
  const template = await prisma.reportCardTemplate.findFirst({
    where: { tenantId, examId },
    include: { skills: { orderBy: { sortOrder: "asc" } } },
  });
  return template;
};

export const upsertTemplateService = async (
  examId: string,
  data: { name?: string; layout?: string; isActive?: boolean },
  tenantId: string
) => {
  const exam = await prisma.exam.findFirst({ where: { id: examId, tenantId, isDeleted: false } });
  if (!exam) throw new Error("Exam not found");

  const layout = data.layout || "GRADE";
  if (!["GRADE", "NO_GRADE", "NEW"].includes(layout)) {
    throw new Error("layout must be GRADE, NO_GRADE or NEW");
  }

  return prisma.reportCardTemplate.upsert({
    where: { tenantId_examId: { tenantId, examId } },
    create: {
      tenantId,
      examId,
      classId: exam.classId,
      name: (data.name || exam.name || "Report Card").trim(),
      layout,
      isActive: data.isActive ?? true,
    },
    update: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.layout !== undefined && { layout }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
};

// Replace the template's skill list with the given ordered skill ids.
// Only skills of this exam's class and academic year are accepted.
export const setTemplateSkillsService = async (
  templateId: string,
  skillIds: string[],
  tenantId: string
) => {
  const template = await prisma.reportCardTemplate.findFirst({ where: { id: templateId, tenantId } });
  if (!template) throw new Error("Template not found");

  const exam = await prisma.exam.findFirst({
    where: { id: template.examId, tenantId, isDeleted: false },
  });
  if (!exam) throw new Error("Exam not found");

  const valid = await prisma.reportCardSkillMaster.findMany({
    where: {
      tenantId,
      academicYearId: exam.academicYearId,
      classId: exam.classId,
      isActive: true,
      id: { in: skillIds },
    },
    select: { id: true },
  });
  const validIds = new Set(valid.map((v) => v.id));
  const ordered = skillIds.filter((id) => validIds.has(id));

  await prisma.reportCardTemplateSkill.deleteMany({ where: { templateId, tenantId } });
  if (ordered.length) {
    await prisma.reportCardTemplateSkill.createMany({
      data: ordered.map((skillId, i) => ({ tenantId, templateId, skillId, sortOrder: i + 1 })),
    });
  }
  return { saved: ordered.length, rejected: skillIds.length - ordered.length };
};
