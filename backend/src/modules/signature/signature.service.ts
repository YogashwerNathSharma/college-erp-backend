
// Signature Service
// CRUD operations for managing authorized signatures

import prisma from "../../utils/prisma";

// ============================================================
// 📋 GET ALL SIGNATURES (for a tenant)
// ============================================================

export const getAllSignaturesService = async (tenantId: string) => {
  const signatures = await prisma.signature.findMany({
    where: { tenantId, isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
  return signatures;
};

// ============================================================
// ➕ CREATE SIGNATURE
// ============================================================

export const createSignatureService = async (
  tenantId: string,
  data: {
    title: string;
    personName: string;
    designation: string;
    imageUrl: string;
  }
) => {
  const signature = await prisma.signature.create({
    data: {
      tenantId,
      title: data.title,
      personName: data.personName,
      designation: data.designation,
      imageUrl: data.imageUrl,
      isActive: true,
    },
  });
  return signature;
};

// ============================================================
// ✏️ UPDATE SIGNATURE
// ============================================================

export const updateSignatureService = async (
  id: string,
  tenantId: string,
  data: {
    title?: string;
    personName?: string;
    designation?: string;
    imageUrl?: string;
    isActive?: boolean;
  }
) => {
  // Verify signature belongs to tenant
  const existing = await prisma.signature.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw new Error("Signature not found");

  const signature = await prisma.signature.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.personName !== undefined && { personName: data.personName }),
      ...(data.designation !== undefined && { designation: data.designation }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
  return signature;
};

// ============================================================
// 🗑️ DELETE SIGNATURE
// ============================================================

export const deleteSignatureService = async (id: string, tenantId: string) => {
  const existing = await prisma.signature.findFirst({
    where: { id, tenantId, isDeleted: false },
  });
  if (!existing) throw new Error("Signature not found");

  // Soft delete -> Recycle Bin (restore possible)
  await prisma.signature.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  return { message: "Signature moved to Recycle Bin" };
};

// ============================================================
// RECYCLE BIN: deleted signatures for a tenant
// ============================================================
export const getDeletedSignaturesService = async (tenantId: string) => {
  return prisma.signature.findMany({
    where: { tenantId, isDeleted: true },
    orderBy: { deletedAt: "desc" },
  });
};

// ============================================================
// RESTORE SIGNATURE from Recycle Bin
// ============================================================
export const restoreSignatureService = async (id: string, tenantId: string) => {
  const existing = await prisma.signature.findFirst({
    where: { id, tenantId, isDeleted: true },
  });
  if (!existing) throw new Error("Deleted signature not found");

  await prisma.signature.update({
    where: { id },
    data: { isDeleted: false, deletedAt: null },
  });

  return { message: "Signature restored" };
};
