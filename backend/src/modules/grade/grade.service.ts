
// ═══════════════════════════════════════════════════════════════════
// grade.service.ts — Grade Settings CRUD (supports per-exam scales)
// ═══════════════════════════════════════════════════════════════════
//
// A GradeSetting row may be scoped to a specific exam (examId set) or
// act as the tenant-wide DEFAULT scale (examId = null).
//
//   • When an exam has its own grade rows  → those are used.
//   • When an exam has NONE                 → the default scale is used.
//
// This lets admins configure a different grading scale for each exam
// while keeping a single fallback scale for everything else.
// ───────────────────────────────────────────────────────────────────

import prisma from "../../utils/prisma";

// Normalize incoming examId: "" / "default" / undefined → null (default scale)
const normalizeExamId = (examId?: string | null): string | null => {
  if (!examId || examId === "default" || examId === "all") return null;
  return examId;
};

// ─────────────────────────────────────────────────────
// CREATE GRADE (single)
// ─────────────────────────────────────────────────────
export const createGradeService = async (
  data: {
    grade: string;
    minPercent: number;
    maxPercent: number;
    gradePoint?: number;
    remarks?: string;
    examId?: string | null;
  },
  tenantId: string
) => {
  const { examId, ...rest } = data;
  return prisma.gradeSetting.create({
    data: {
      ...rest,
      examId: normalizeExamId(examId),
      tenantId,
    },
  });
};

// ─────────────────────────────────────────────────────
// BULK SET GRADES (replace all for the given scope)
//   examId null  → replaces the tenant-wide default scale
//   examId set   → replaces only that exam's scale
// ─────────────────────────────────────────────────────
export const bulkSetGradesService = async (
  grades: {
    grade: string;
    minPercent: number;
    maxPercent: number;
    gradePoint?: number;
    remarks?: string;
  }[],
  tenantId: string,
  examId?: string | null
) => {
  const scopedExamId = normalizeExamId(examId);

  // Soft delete existing rows for THIS scope only
  await prisma.gradeSetting.updateMany({
    where: { tenantId, examId: scopedExamId, isDeleted: false },
    data: { isDeleted: true },
  });

  // Create new rows for this scope
  const data = grades.map((g) => ({
    grade: g.grade,
    minPercent: g.minPercent,
    maxPercent: g.maxPercent,
    gradePoint: g.gradePoint ?? null,
    remarks: g.remarks ?? null,
    tenantId,
    // On MongoDB, passing examId: null for an @db.ObjectId field inside
    // createMany can error — so include examId ONLY for a real exam scope
    // and omit it entirely for the tenant-wide default scale.
    ...(scopedExamId ? { examId: scopedExamId } : {}),
  }));

  await prisma.gradeSetting.createMany({ data });

  return {
    message: "Grade settings saved",
    count: grades.length,
    examId: scopedExamId,
  };
};

// ─────────────────────────────────────────────────────
// GET GRADES
//   No examId        → returns the tenant-wide default scale.
//   examId provided  → returns that exam's scale if it has one,
//                      otherwise falls back to the default scale.
//   The response rows carry an `isInherited` flag so the UI can tell
//   whether the exam is using its own scale or the inherited default.
// ─────────────────────────────────────────────────────
export const getGradesService = async (
  tenantId: string,
  examId?: string | null
) => {
  const scopedExamId = normalizeExamId(examId);

  // Default scale request
  if (!scopedExamId) {
    const defaults = await prisma.gradeSetting.findMany({
      where: { tenantId, examId: null, isDeleted: false },
      orderBy: { minPercent: "desc" },
    });
    return defaults.map((g) => ({ ...g, isInherited: false }));
  }

  // Exam-specific request
  const examRows = await prisma.gradeSetting.findMany({
    where: { tenantId, examId: scopedExamId, isDeleted: false },
    orderBy: { minPercent: "desc" },
  });

  if (examRows.length > 0) {
    return examRows.map((g) => ({ ...g, isInherited: false }));
  }

  // No per-exam scale yet → inherit the default scale (read-only preview)
  const defaults = await prisma.gradeSetting.findMany({
    where: { tenantId, examId: null, isDeleted: false },
    orderBy: { minPercent: "desc" },
  });
  return defaults.map((g) => ({ ...g, isInherited: true }));
};

// ─────────────────────────────────────────────────────
// RESOLVE SCALE (internal helper for report generation)
//   Returns the effective grade rows for an exam:
//   per-exam scale if present, else the tenant default.
// ─────────────────────────────────────────────────────
export const resolveGradeScaleService = async (
  tenantId: string,
  examId?: string | null
) => {
  const scopedExamId = normalizeExamId(examId);

  if (scopedExamId) {
    const examRows = await prisma.gradeSetting.findMany({
      where: { tenantId, examId: scopedExamId, isDeleted: false },
      orderBy: { minPercent: "desc" },
    });
    if (examRows.length > 0) return examRows;
  }

  return prisma.gradeSetting.findMany({
    where: { tenantId, examId: null, isDeleted: false },
    orderBy: { minPercent: "desc" },
  });
};

// ─────────────────────────────────────────────────────
// DELETE GRADE
// ─────────────────────────────────────────────────────
export const deleteGradeService = async (
  gradeId: string,
  tenantId: string
) => {
  return prisma.gradeSetting.update({
    where: { id: gradeId },
    data: { isDeleted: true },
  });
};
