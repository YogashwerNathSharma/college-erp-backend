
import prisma from "../../utils/prisma";

// ─── Create Class ────────────────────────────────────────────────────────────

export const createClassService = async (data: any, tenantId: string) => {
  return prisma.class.create({
    data: {
      name: data.name,
      tenantId,
      academicYearId: data.academicYearId,
      isActive: true,
    },
  });
};

// ─── Get All Classes (non-deleted) ───────────────────────────────────────────

export const getClassesService = async (tenantId: string, academicYearId?: string) => {
  const where: any = { tenantId, isDeleted: false };

  if (academicYearId) {
    where.academicYearId = academicYearId;
  }

  return prisma.class.findMany({
    where,
    include: {
      sections: {
        where: { isDeleted: false },
        select: { id: true, name: true },
      },
    },
    orderBy: { name: "asc" },
  });
};

// ─── Get Deleted Classes (Recycle Bin) ───────────────────────────────────────

export const getDeletedClassesService = async (tenantId: string) => {
  return prisma.class.findMany({
    where: { tenantId, isDeleted: true },
    orderBy: { deletedAt: "desc" },
  });
};

// ─── Update Class ────────────────────────────────────────────────────────────

export const updateClassService = async (id: string, data: any, tenantId: string) => {
  const cls = await prisma.class.findFirst({
    where: { id, tenantId },
  });

  if (!cls) {
    throw new Error("Class not found");
  }

  return prisma.class.update({
    where: { id },
    data: { name: data.name },
  });
};

// ─── Toggle Active/Inactive ─────────────────────────────────────────────────

export const toggleClassStatusService = async (id: string, tenantId: string) => {
  const cls = await prisma.class.findFirst({
    where: { id, tenantId },
  });

  if (!cls) {
    throw new Error("Class not found");
  }

  return prisma.class.update({
    where: { id },
    data: { isActive: !cls.isActive },
  });
};

// ─── Soft Delete ─────────────────────────────────────────────────────────────

export const softDeleteClassService = async (id: string, tenantId: string) => {
  const cls = await prisma.class.findFirst({
    where: { id, tenantId },
  });

  if (!cls) {
    throw new Error("Class not found");
  }

  return prisma.class.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      isActive: false,
    },
  });
};

// ─── Restore from Soft Delete ────────────────────────────────────────────────

export const restoreClassService = async (id: string, tenantId: string) => {
  const cls = await prisma.class.findFirst({
    where: { id, tenantId, isDeleted: true },
  });

  if (!cls) {
    throw new Error("Deleted class not found");
  }

  return prisma.class.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
      isActive: true,
    },
  });
};