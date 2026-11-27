// report-card-bulk.service.ts
// Bulk life-skill entry for a whole exam/class at once (Marks Entry style).
// Scope: tenant + exam (which fixes class and academic year).

import prisma from "../../utils/prisma";

// Students of this exam's class (and section, if the exam is section-wise),
// same rule as Marks Entry.
const examStudentIds = async (examId: string, tenantId: string) => {
  const exam = await prisma.exam.findFirst({ where: { id: examId, tenantId, isDeleted: false } });
  if (!exam) throw new Error("Exam not found");
  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId: exam.classId,
      ...(exam.sectionId && { sectionId: exam.sectionId }),
      academicYearId: exam.academicYearId,
      tenantId,
      status: "active",
      isDeleted: false,
    },
    select: { studentId: true },
  });
  return { exam, studentIds: enrollments.map((e) => e.studentId) };
};

// Returns the skills for this exam (template skills if set, else all active
// skills of the same class and academic year) plus every student's saved values.
export const getBulkLifeSkillsService = async (examId: string, tenantId: string) => {
  const { exam, studentIds } = await examStudentIds(examId, tenantId);

  const template = await prisma.reportCardTemplate.findFirst({
    where: { tenantId, examId },
    include: { skills: { orderBy: { sortOrder: "asc" } } },
  });

  const masters = await prisma.reportCardSkillMaster.findMany({
    where: {
      tenantId,
      academicYearId: exam.academicYearId,
      classId: exam.classId,
      isActive: true,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const masterById = new Map(masters.map((m) => [m.id, m]));

  const skills = template?.skills?.length
    ? template.skills
        .map((ts) => masterById.get(ts.skillId))
        .filter(Boolean)
        .map((m: any) => ({ id: m.id, name: m.name }))
    : masters.map((m) => ({ id: m.id, name: m.name }));

  const saved = await prisma.reportCardLifeSkill.findMany({
    where: {
      tenantId,
      academicYearId: exam.academicYearId,
      studentId: { in: studentIds },
    },
  });

  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, tenantId, isDeleted: false },
    select: { id: true, firstName: true, lastName: true, admissionNo: true },
  });

  return {
    skills,
    students: students.map((s) => ({
      studentId: s.id,
      studentName: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
      admissionNo: s.admissionNo || "",
    })),
    values: saved.map((v) => ({
      studentId: v.studentId,
      skillName: v.skillName,
      term1Value: v.term1Value,
      term2Value: v.term2Value,
    })),
  };
};

// Save many students x many skills in one request.
// rows: [{ studentId, skillName, term1Value, term2Value }]
export const saveBulkLifeSkillsService = async (
  examId: string,
  rows: { studentId: string; skillName: string; term1Value?: string | null; term2Value?: string | null }[],
  tenantId: string
) => {
  const { exam, studentIds } = await examStudentIds(examId, tenantId);
  const allowed = new Set(studentIds);
  const valid = (rows || []).filter(
    (r) => r && r.studentId && r.skillName && allowed.has(r.studentId)
  );

  let saved = 0;
  for (const r of valid) {
    await prisma.reportCardLifeSkill.upsert({
      where: {
        tenantId_studentId_academicYearId_skillName: {
          tenantId,
          studentId: r.studentId,
          academicYearId: exam.academicYearId,
          skillName: r.skillName.trim(),
        },
      },
      create: {
        tenantId,
        studentId: r.studentId,
        academicYearId: exam.academicYearId,
        skillName: r.skillName.trim(),
        term1Value: r.term1Value ?? null,
        term2Value: r.term2Value ?? null,
      },
      update: {
        term1Value: r.term1Value ?? null,
        term2Value: r.term2Value ?? null,
      },
    });
    saved++;
  }
  return { saved, skipped: (rows || []).length - valid.length };
};
