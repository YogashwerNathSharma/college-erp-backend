import prisma from "../../config/prisma";

// ============================================
// ASSET MANAGEMENT
// ============================================

export const createAsset = async (data: any, tenantId: string) => {
  // Auto-generate asset code if not provided
  if (!data.assetCode) {
    const count = await prisma.asset.count({ where: { tenantId } });
    data.assetCode = `AST-${String(count + 1).padStart(5, "0")}`;
  }

  return prisma.asset.create({
    data: {
      ...data,
      tenantId,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
    },
  });
};

export const getAllAssets = async (tenantId: string, filters?: {
  category?: string;
  condition?: string;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = { tenantId, isDeleted: false };
  if (filters?.category) where.category = filters.category;
  if (filters?.condition) where.condition = filters.condition;
  if (filters?.location) where.location = filters.location;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { assetCode: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.asset.count({ where }),
  ]);

  return { assets, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getAssetById = async (id: string, tenantId: string) => {
  return prisma.asset.findFirst({
    where: { id, tenantId, isDeleted: false },
    include: { issues: { orderBy: { issueDate: "desc" }, take: 10 } },
  });
};

export const updateAsset = async (id: string, data: any, tenantId: string) => {
  return prisma.asset.update({
    where: { id, tenantId },
    data,
  });
};

export const deleteAsset = async (id: string, tenantId: string) => {
  return prisma.asset.update({
    where: { id, tenantId },
    data: { isDeleted: true },
  });
};

// ============================================
// STOCK MANAGEMENT
// ============================================

export const createStockItem = async (data: any, tenantId: string) => {
  if (!data.sku) {
    const count = await prisma.stockItem.count({ where: { tenantId } });
    data.sku = `STK-${String(count + 1).padStart(5, "0")}`;
  }

  return prisma.stockItem.create({
    data: { ...data, tenantId },
  });
};

export const getAllStockItems = async (tenantId: string, filters?: {
  category?: string;
  lowStock?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = { tenantId, isDeleted: false };
  if (filters?.category) where.category = filters.category;
  if (filters?.lowStock) {
    where.currentStock = { lte: prisma.raw("minimumStock") };
  }
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { sku: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.stockItem.findMany({ where, orderBy: { name: "asc" }, skip, take: limit }),
    prisma.stockItem.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const recordStockTransaction = async (data: any, tenantId: string, userId: string) => {
  const { stockItemId, type, quantity, reason, referenceNo } = data;

  const stockItem = await prisma.stockItem.findFirst({
    where: { id: stockItemId, tenantId, isDeleted: false },
  });
  if (!stockItem) throw new Error("Stock item not found");

  let newStock = stockItem.currentStock;
  if (type === "IN") {
    newStock += quantity;
  } else if (type === "OUT") {
    if (stockItem.currentStock < quantity) throw new Error("Insufficient stock");
    newStock -= quantity;
  } else {
    newStock = quantity; // ADJUSTMENT sets absolute value
  }

  // Transaction
  const [transaction] = await prisma.$transaction([
    prisma.stockTransaction.create({
      data: {
        stockItemId,
        tenantId,
        type,
        quantity,
        previousStock: stockItem.currentStock,
        newStock,
        reason,
        referenceNo,
        createdBy: userId,
        date: data.date ? new Date(data.date) : new Date(),
      },
    }),
    prisma.stockItem.update({
      where: { id: stockItemId },
      data: { currentStock: newStock },
    }),
  ]);

  return transaction;
};

// ============================================
// ISSUE / RETURN
// ============================================

export const issueAsset = async (data: any, tenantId: string, userId: string) => {
  const asset = await prisma.asset.findFirst({
    where: { id: data.assetId, tenantId, isDeleted: false },
  });
  if (!asset) throw new Error("Asset not found");

  return prisma.assetIssue.create({
    data: {
      assetId: data.assetId,
      tenantId,
      issuedTo: data.issuedTo,
      issuedToType: data.issuedToType,
      issueDate: new Date(data.issueDate),
      expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
      remarks: data.remarks,
      issuedBy: userId,
      status: "ISSUED",
    },
  });
};

export const returnAsset = async (data: any, tenantId: string, userId: string) => {
  const issue = await prisma.assetIssue.findFirst({
    where: { id: data.issueId, tenantId, status: "ISSUED" },
  });
  if (!issue) throw new Error("Issue record not found or already returned");

  return prisma.assetIssue.update({
    where: { id: data.issueId },
    data: {
      status: "RETURNED",
      returnDate: new Date(data.returnDate),
      returnCondition: data.condition,
      returnRemarks: data.remarks,
      returnedBy: userId,
    },
  });
};

export const getIssueHistory = async (tenantId: string, filters?: {
  assetId?: string;
  issuedTo?: string;
  status?: string;
}) => {
  const where: any = { tenantId };
  if (filters?.assetId) where.assetId = filters.assetId;
  if (filters?.issuedTo) where.issuedTo = filters.issuedTo;
  if (filters?.status) where.status = filters.status;

  return prisma.assetIssue.findMany({
    where,
    include: { asset: { select: { name: true, assetCode: true } } },
    orderBy: { issueDate: "desc" },
  });
};

// ============================================
// DASHBOARD / STATS
// ============================================

export const getInventoryStats = async (tenantId: string) => {
  const [totalAssets, assetsByCategory, lowStockItems, issuedAssets] = await Promise.all([
    prisma.asset.count({ where: { tenantId, isDeleted: false } }),
    prisma.asset.groupBy({
      by: ["category"],
      where: { tenantId, isDeleted: false },
      _count: true,
    }),
    prisma.stockItem.count({
      where: { tenantId, isDeleted: false, currentStock: { lte: 5 } },
    }),
    prisma.assetIssue.count({ where: { tenantId, status: "ISSUED" } }),
  ]);

  return { totalAssets, assetsByCategory, lowStockItems, issuedAssets };
};
