
// ═══════════════════════════════════════════════════════
// grade.service.ts — Grade Settings CRUD
// ═══════════════════════════════════════════════════════

import prisma from "../../utils/prisma";

// ─────────────────────────────────────────
// CREATE GRADE (single)
// ─────────────────────────────────────────
export const createGradeService = async (
  data: {
    grade: string;
    minPercent: number;
    maxPercent: number;
    gradePoint?: number;
    remarks?: string;
  },
  tenantId: string
) => {
  return prisma.gradeSetting.create({
    data: {
      ...data,
      tenantId,
    },
  });
};

// ─────────────────────────────────────────
// BULK SET GRADES (replace all)
// ─────────────────────────────────────────
export const bulkSetGradesService = async (
  grades: {
    grade: string;
    minPercent: number;
    maxPercent: number;
    gradePoint?: number;
    remarks?: string;
  }[],
  tenantId: string
) => {
  // Soft delete all existing
  await prisma.gradeSetting.updateMany({
    where: { tenantId, isDeleted: false },
    data: { isDeleted: true },
  });

  // Create new
  const data = grades.map((g) => ({
    grade: g.grade,
    minPercent: g.minPercent,
    maxPercent: g.maxPercent,
    gradePoint: g.gradePoint || null,
    remarks: g.remarks || null,
    tenantId,
  }));

  await prisma.gradeSetting.createMany({ data });

  return { message: "Grade settings saved", count: grades.length };
};

// ─────────────────────────────────────────
// GET ALL GRADES
// ─────────────────────────────────────────
export const getGradesService = async (tenantId: string) => {
  return prisma.gradeSetting.findMany({
    where: { tenantId, isDeleted: false },
    orderBy: { minPercent: "desc" },
  });
};

// ─────────────────────────────────────────
// DELETE GRADE
// ─────────────────────────────────────────
export const deleteGradeService = async (
  gradeId: string,
  tenantId: string
) => {
  return prisma.gradeSetting.update({
    where: { id: gradeId },
    data: { isDeleted: true },
  });
};

