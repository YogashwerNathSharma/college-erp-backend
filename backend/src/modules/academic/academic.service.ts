
import prisma from "../../utils/prisma";
import { invalidateAcademicYearCache } from "../../middleware/academicYear.middleware";
import { invalidateAcademicYearCache } from "../../middleware/academicYear.middleware";

// ─── Create Academic Year ────────────────────────────────────────────

export const createAcademicYear = async (data: any, tenantId: string) => {
  if (!tenantId) {
    throw new Error("TenantId missing");
  }

  // Deactivate all other years when creating new one as current
  await prisma.academicYear.updateMany({
    where: { tenantId },
    data: { isActive: false, isCurrent: false },
  });

  const year = await prisma.academicYear.create({
    data: {
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: true,
      isCurrent: true,
      tenantId,
    },
  });

  // Invalidate the middleware's current-year cache for this tenant
  invalidateAcademicYearCache(tenantId);

  return year;
};

// ─── Get All Academic Years (only non-deleted) ───────────────────────

export const getAcademicYears = async (tenantId: string) => {
  return prisma.academicYear.findMany({
    where: { tenantId, isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
};

// ─── Get All Including Deleted (for recycle bin / admin view) ────────

export const getDeletedAcademicYears = async (tenantId: string) => {
  return prisma.academicYear.findMany({
    where: { tenantId, isDeleted: true },
    orderBy: { deletedAt: "desc" },
  });
};

// ─── Set Active Year (only one can be active at a time) ──────────────

export const setActiveYear = async (id: string, tenantId: string) => {
  // Deactivate all first
  await prisma.academicYear.updateMany({
    where: { tenantId },
    data: { isActive: false, isCurrent: false },
  });

  // Activate selected
  const year = await prisma.academicYear.update({
    where: { id },
    data: { isActive: true, isCurrent: true },
  });

  // Invalidate the middleware's current-year cache for this tenant
  invalidateAcademicYearCache(tenantId);

  return year;
};

// ─── Toggle Active/Inactive Status ──────────────────────────────────

export const toggleAcademicYearStatus = async (id: string, tenantId: string) => {
  const year = await prisma.academicYear.findFirst({
    where: { id, tenantId },
  });

  if (!year) {
    throw new Error("Academic year not found");
  }

  let result;

  // If currently active → deactivate
  // If currently inactive → activate (and deactivate others)
  if (year.isActive) {
    result = await prisma.academicYear.update({
      where: { id },
      data: { isActive: false, isCurrent: false },
    });
  } else {
    // Deactivate all others first
    await prisma.academicYear.updateMany({
      where: { tenantId },
      data: { isActive: false, isCurrent: false },
    });

    result = await prisma.academicYear.update({
      where: { id },
      data: { isActive: true, isCurrent: true },
    });
  }

  // Invalidate the middleware's current-year cache for this tenant
  invalidateAcademicYearCache(tenantId);

  return result;
};

// ─── Soft Delete ─────────────────────────────────────────────────────

export const softDeleteAcademicYear = async (id: string, tenantId: string) => {
  const year = await prisma.academicYear.findFirst({
    where: { id, tenantId },
  });

  if (!year) {
    throw new Error("Academic year not found");
  }

  if (year.isActive) {
    throw new Error("Cannot delete the currently active academic year. Please set another year as active first.");
  }

  const result = await prisma.academicYear.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      isActive: false,
      isCurrent: false,
    },
  });

  // Invalidate cache in case the deleted year was cached
  invalidateAcademicYearCache(tenantId);

  return result;
};

// ─── Restore from Soft Delete ────────────────────────────────────────

export const restoreAcademicYear = async (id: string, tenantId: string) => {
  const year = await prisma.academicYear.findFirst({
    where: { id, tenantId, isDeleted: true },
  });

  if (!year) {
    throw new Error("Deleted academic year not found");
  }

  return prisma.academicYear.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });
};

// ─── Update Academic Year ────────────────────────────────────────────

export const updateAcademicYear = async (id: string, tenantId: string, data: any) => {
  const year = await prisma.academicYear.findFirst({
    where: { id, tenantId },
  });

  if (!year) {
    throw new Error("Academic year not found");
  }

  return prisma.academicYear.update({
    where: { id },
    data: {
      name: data.name || year.name,
      startDate: data.startDate ? new Date(data.startDate) : year.startDate,
      endDate: data.endDate ? new Date(data.endDate) : year.endDate,
    },
  });
};
