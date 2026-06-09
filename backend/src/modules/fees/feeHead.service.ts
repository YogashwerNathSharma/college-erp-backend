
import prisma from "../../utils/prisma";

// Get all active fee heads for a tenant
const getAll = async (tenantId: string) => {
  return await prisma.feeHead.findMany({
    where: {
      tenantId,
      isDeleted: false,
    },
    orderBy: {
      name: "asc",
    },
  });
};

// Get a single fee head by ID
const getById = async (id: string, tenantId: string) => {
  return await prisma.feeHead.findFirst({
    where: {
      id,
      tenantId,
      isDeleted: false,
    },
  });
};

// Create a new fee head
const create = async (data: {
  name: string;
  code?: string;
  description?: string;
  type?: "RECURRING" | "ONE_TIME";
  tenantId: string;
}) => {
  return await prisma.feeHead.create({
    data: {
      name: data.name,
      code: data.code || null,
      description: data.description || null,
      type: data.type || "RECURRING",
      tenantId: data.tenantId,
    },
  });
};

// Update an existing fee head
const update = async (
  id: string,
  data: {
    name?: string;
    code?: string;
    description?: string;
    type?: "RECURRING" | "ONE_TIME";
    isActive?: boolean;
  },
  tenantId: string
) => {
  // Verify the fee head belongs to the tenant
  const existing = await prisma.feeHead.findFirst({
    where: {
      id,
      tenantId,
      isDeleted: false,
    },
  });

  if (!existing) {
    return null;
  }

  return await prisma.feeHead.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.code !== undefined && { code: data.code || null }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
};

// Soft delete a fee head
const softDelete = async (id: string, tenantId: string) => {
  // Verify the fee head belongs to the tenant
  const existing = await prisma.feeHead.findFirst({
    where: {
      id,
      tenantId,
      isDeleted: false,
    },
  });

  if (!existing) {
    return null;
  }

  return await prisma.feeHead.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};

export const feeHeadService = {
  getAll,
  getById,
  create,
  update,
  softDelete,
};

