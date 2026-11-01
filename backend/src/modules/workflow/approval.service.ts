import prisma from "../../utils/prisma";

// ═══════════════════════════════════════════════════════════════════
// APPROVAL SERVICE — Approval Queue for Marks, Leave, Fee, Admission
// ═══════════════════════════════════════════════════════════════════

/**
 * Get paginated approval queue with filters
 */
export async function getApprovalQueue(params: {
  tenantId: string;
  type?: string;
  status?: string;
  requesterId?: string;
  approverId?: string;
  page?: number;
  limit?: number;
}) {
  const {
    tenantId,
    type,
    status,
    requesterId,
    approverId,
    page = 1,
    limit = 20,
  } = params;

  const where: any = { tenantId, isDeleted: false };
  if (type) where.type = type;
  if (status) where.status = status;
  if (requesterId) where.requesterId = requesterId;
  if (approverId) where.approverId = approverId;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.approvalQueue.findMany({
      where,
      orderBy: { requestedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.approvalQueue.count({ where }),
  ]);

  // Enrich with requester and approver names
  const userIds = new Set<string>();
  items.forEach((item: any) => {
    if (item.requesterId) userIds.add(item.requesterId);
    if (item.approverId) userIds.add(item.approverId);
  });

  let userMap: Record<string, string> = {};
  if (userIds.size > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, name: true },
    });
    users.forEach((u: any) => {
      userMap[u.id] = u.name;
    });
  }

  const enrichedItems = items.map((item: any) => ({
    ...item,
    requesterName: userMap[item.requesterId] || "Unknown",
    approverName: item.approverId ? userMap[item.approverId] || "Unknown" : null,
  }));

  return {
    items: enrichedItems,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Submit a new item for approval
 */
export async function submitForApproval(params: {
  tenantId: string;
  requesterId: string;
  type: string;
  entityId: string;
  entityType: string;
  data?: any;
  remarks?: string;
}) {
  const { tenantId, requesterId, type, entityId, entityType, data, remarks } = params;

  // Check for duplicate pending approval
  const existing = await prisma.approvalQueue.findFirst({
    where: {
      tenantId,
      entityId,
      entityType,
      type,
      status: "PENDING",
      isDeleted: false,
    },
  });

  if (existing) {
    throw new Error("A pending approval already exists for this item");
  }

  const approval = await prisma.approvalQueue.create({
    data: {
      tenantId,
      requesterId,
      type,
      entityId,
      entityType,
      data: data || null,
      remarks: remarks || null,
      status: "PENDING",
    },
  });

  return approval;
}

/**
 * Approve an item in the queue
 */
export async function approveItem(params: {
  id: string;
  tenantId: string;
  approverId: string;
  remarks?: string;
}) {
  const { id, tenantId, approverId, remarks } = params;

  const item = await prisma.approvalQueue.findFirst({
    where: { id, tenantId, status: "PENDING", isDeleted: false },
  });

  if (!item) {
    throw new Error("Approval item not found or already resolved");
  }

  const updated = await prisma.approvalQueue.update({
    where: { id },
    data: {
      status: "APPROVED",
      approverId,
      remarks: remarks || item.remarks,
      resolvedAt: new Date(),
    },
  });

  return updated;
}

/**
 * Reject an item in the queue
 */
export async function rejectItem(params: {
  id: string;
  tenantId: string;
  approverId: string;
  remarks?: string;
}) {
  const { id, tenantId, approverId, remarks } = params;

  const item = await prisma.approvalQueue.findFirst({
    where: { id, tenantId, status: "PENDING", isDeleted: false },
  });

  if (!item) {
    throw new Error("Approval item not found or already resolved");
  }

  const updated = await prisma.approvalQueue.update({
    where: { id },
    data: {
      status: "REJECTED",
      approverId,
      remarks: remarks || item.remarks,
      resolvedAt: new Date(),
    },
  });

  return updated;
}

/**
 * Get approval stats for dashboard
 */
export async function getApprovalStats(tenantId: string) {
  const [pending, approved, rejected] = await Promise.all([
    prisma.approvalQueue.count({
      where: { tenantId, status: "PENDING", isDeleted: false },
    }),
    prisma.approvalQueue.count({
      where: { tenantId, status: "APPROVED", isDeleted: false },
    }),
    prisma.approvalQueue.count({
      where: { tenantId, status: "REJECTED", isDeleted: false },
    }),
  ]);

  // Breakdown by type
  const typeBreakdown = await prisma.approvalQueue.groupBy({
    by: ["type"],
    where: { tenantId, status: "PENDING", isDeleted: false },
    _count: { type: true },
  });

  return {
    pending,
    approved,
    rejected,
    total: pending + approved + rejected,
    byType: typeBreakdown.map((t: any) => ({
      type: t.type,
      count: t._count.type,
    })),
  };
}
