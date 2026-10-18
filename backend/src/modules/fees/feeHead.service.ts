
import prisma from "../../utils/prisma";

// ═══════════════════════════════════════════════════════════════════════════
// FEE HEAD SERVICE — Enhanced with Category, Frequency, Taxable, Refundable, Source
// ═══════════════════════════════════════════════════════════════════════════

interface CreateFeeHeadInput {
  name: string;
  code?: string;
  description?: string;
  type?: "RECURRING" | "ONE_TIME";
  category?: string;
  frequency?: string;
  isTaxable?: boolean;
  isRefundable?: boolean;
  sourceModule?: string;
  tenantId: string;
}

interface UpdateFeeHeadInput {
  name?: string;
  code?: string;
  description?: string;
  type?: "RECURRING" | "ONE_TIME";
  category?: string;
  frequency?: string;
  isTaxable?: boolean;
  isRefundable?: boolean;
  sourceModule?: string;
  isActive?: boolean;
}

// Get all active fee heads for a tenant (with optional filters)
const getAll = async (tenantId: string, filters?: { category?: string; sourceModule?: string; type?: string }) => {
  const where: any = {
    tenantId,
    isDeleted: false,
  };

  if (filters?.category) where.category = filters.category;
  if (filters?.sourceModule) where.sourceModule = filters.sourceModule;
  if (filters?.type) where.type = filters.type;

  return await prisma.feeHead.findMany({
    where,
    orderBy: { name: "asc" },
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
const create = async (data: CreateFeeHeadInput) => {
  return await prisma.feeHead.create({
    data: {
      name: data.name,
      code: data.code || null,
      description: data.description || null,
      type: data.type || "RECURRING",
      category: data.category || null,
      frequency: data.frequency || null,
      isTaxable: data.isTaxable || false,
      isRefundable: data.isRefundable || false,
      sourceModule: data.sourceModule || "Manual",
      tenantId: data.tenantId,
    },
  });
};

// Update an existing fee head
const update = async (id: string, data: UpdateFeeHeadInput, tenantId: string) => {
  const existing = await prisma.feeHead.findFirst({
    where: { id, tenantId, isDeleted: false },
  });

  if (!existing) return null;

  return await prisma.feeHead.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.code !== undefined && { code: data.code || null }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.category !== undefined && { category: data.category || null }),
      ...(data.frequency !== undefined && { frequency: data.frequency || null }),
      ...(data.isTaxable !== undefined && { isTaxable: data.isTaxable }),
      ...(data.isRefundable !== undefined && { isRefundable: data.isRefundable }),
      ...(data.sourceModule !== undefined && { sourceModule: data.sourceModule || null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
};

// Soft delete a fee head
const softDelete = async (id: string, tenantId: string) => {
  const existing = await prisma.feeHead.findFirst({
    where: { id, tenantId, isDeleted: false },
  });

  if (!existing) return null;

  return await prisma.feeHead.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};

// Get fee heads grouped by category
const getByCategory = async (tenantId: string) => {
  const heads = await prisma.feeHead.findMany({
    where: { tenantId, isDeleted: false, isActive: true },
    orderBy: { name: "asc" },
  });

  const grouped: Record<string, typeof heads> = {};
  for (const head of heads) {
    const cat = head.category || "Uncategorized";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(head);
  }

  return grouped;
};

// Get fee heads by source module (for module integration)
const getBySource = async (tenantId: string, sourceModule: string) => {
  return await prisma.feeHead.findMany({
    where: {
      tenantId,
      isDeleted: false,
      isActive: true,
      sourceModule,
    },
    orderBy: { name: "asc" },
  });
};

export const feeHeadService = {
  getAll,
  getById,
  create,
  update,
  softDelete,
  getByCategory,
  getBySource,
};
