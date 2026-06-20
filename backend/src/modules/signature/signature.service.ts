
// Signature Service
// CRUD operations for managing authorized signatures

import prisma from "../../utils/prisma";

// ============================================================
// 📋 GET ALL SIGNATURES (for a tenant)
// ============================================================

export const getAllSignaturesService = async (tenantId: string) => {
  const signatures = await prisma.signature.findMany({
    where: { tenantId },
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
    where: { id, tenantId },
  });
  if (!existing) throw new Error("Signature not found");

  await prisma.signature.delete({
    where: { id },
  });

  return { message: "Signature deleted successfully" };
};
