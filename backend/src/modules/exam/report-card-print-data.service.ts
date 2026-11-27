// report-card-print-data.service.ts
// Data for the printed report card's Life Skills and Health blocks.
// Skill names and order come from the exam's template (admin set), values from
// the saved per-student entries. Scoped by tenant + academic year.

import prisma from "../../utils/prisma";

export const getReportCardPrintExtrasService = async (
  studentId: string,
  examId: string,
  academicYearId: string,
  tenantId: string
) => {
  // Template skills for this exam (admin-set order). Fall back to all active
  // skills of the exam's class+session if no template exists.
  const exam = await prisma.exam.findFirst({ where: { id: examId, tenantId, isDeleted: false } });
  const template = await prisma.reportCardTemplate.findFirst({
    where: { tenantId, examId },
    include: { skills: { orderBy: { sortOrder: "asc" } } },
  });

  let skillNames: string[] = [];
  if (template?.skills?.length) {
    const masters = await prisma.reportCardSkillMaster.findMany({
      where: { tenantId, id: { in: template.skills.map((s) => s.skillId) } },
    });
    const byId = new Map(masters.map((m) => [m.id, m.name]));
    skillNames = template.skills.map((s) => byId.get(s.skillId)).filter(Boolean) as string[];
  } else if (exam) {
    const masters = await prisma.reportCardSkillMaster.findMany({
      where: {
        tenantId,
        academicYearId: exam.academicYearId,
        classId: exam.classId,
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    skillNames = masters.map((m) => m.name);
  }

  const saved = await prisma.reportCardLifeSkill.findMany({
    where: { tenantId, studentId, academicYearId },
  });
  const valueBySkill = new Map<string, (typeof saved)[number]>(saved.map((v) => [v.skillName, v] as [string, (typeof saved)[number]]));

  const lifeSkills = skillNames.map((name) => ({
    skillName: name,
    term1Value: valueBySkill.get(name)?.term1Value || "",
    term2Value: valueBySkill.get(name)?.term2Value || "",
  }));

  const health = await prisma.reportCardHealth.findFirst({
    where: { tenantId, studentId, academicYearId },
  });

  return {
    lifeSkills,
    health: {
      height: health?.height || "",
      weight: health?.weight || "",
      bloodGroup: health?.bloodGroup || "",
      dentalHygiene: health?.dentalHygiene || "",
      passedPromotedToClass: health?.passedPromotedToClass || "",
      schoolReopen: health?.schoolReopen || "",
    },
  };
};
