// ═══════════════════════════════════════════════════════════
// AUDIT CENTER SERVICE - Enterprise Audit Log Management
// ═══════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Types ───────────────────────────────────────────────
export interface AuditLogFilter {
  type?: string; // audit | user | activity | admin | api | db
  startDate?: string;
  endDate?: string;
  userId?: string;
  action?: string;
  severity?: "info" | "warning" | "error" | "critical";
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface AuditLogEntry {
  id: string;
  type: string;
  action: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  severity: string;
  resource?: string;
  resourceId?: string;
  details?: any;
  metadata?: any;
  duration?: number;
  statusCode?: number;
  method?: string;
  endpoint?: string;
  requestBody?: any;
  responseSize?: number;
  tenantId?: string;
  createdAt: Date;
}

// ─── Get Audit Logs ──────────────────────────────────────
export async function getAuditLogs(filter: AuditLogFilter) {
  const {
    type = "audit",
    startDate,
    endDate,
    userId,
    action,
    severity,
    search,
    page = 1,
    limit = 25,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filter;

  const where: any = {};

  // Filter by log type
  if (type && type !== "all") {
    where.type = type;
  }

  // Date range
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // User filter
  if (userId) {
    where.userId = userId;
  }

  // Action filter
  if (action) {
    where.action = { contains: action, mode: "insensitive" };
  }

  // Severity filter
  if (severity) {
    where.severity = severity;
  }

  // Search
  if (search) {
    where.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { userName: { contains: search, mode: "insensitive" } },
      { resource: { contains: search, mode: "insensitive" } },
      { endpoint: { contains: search, mode: "insensitive" } },
      { ipAddress: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── Get Audit Log by ID ─────────────────────────────────
export async function getAuditLogById(id: string) {
  return prisma.auditLog.findUnique({ where: { id } });
}

// ─── Get Audit Stats ─────────────────────────────────────
export async function getAuditStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalLogs, todayLogs, weekLogs, monthLogs, bySeverity, byType, recentCritical] =
    await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { createdAt: { gte: today } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: thisWeek } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.auditLog.groupBy({
        by: ["severity"],
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ["type"],
        _count: true,
      }),
      prisma.auditLog.count({
        where: { severity: "critical", createdAt: { gte: thisWeek } },
      }),
    ]);

  return {
    totalLogs,
    todayLogs,
    weekLogs,
    monthLogs,
    bySeverity: bySeverity.reduce((acc, item) => {
      acc[item.severity] = item._count;
      return acc;
    }, {} as Record<string, number>),
    byType: byType.reduce((acc, item) => {
      acc[item.type] = item._count;
      return acc;
    }, {} as Record<string, number>),
    recentCritical,
  };
}

// ─── Get Activity Timeline ───────────────────────────────
export async function getActivityTimeline(filter: { days?: number; userId?: string }) {
  const { days = 7, userId } = filter;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const where: any = { createdAt: { gte: since } };
  if (userId) where.userId = userId;

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      action: true,
      userName: true,
      severity: true,
      resource: true,
      createdAt: true,
      type: true,
      ipAddress: true,
    },
  });

  return logs;
}

// ─── Bulk Delete Logs ────────────────────────────────────
export async function bulkDeleteLogs(filter: { ids?: string[]; olderThan?: string; type?: string }) {
  const { ids, olderThan, type } = filter;

  if (ids && ids.length > 0) {
    const result = await prisma.auditLog.deleteMany({
      where: { id: { in: ids } },
    });
    return { deleted: result.count };
  }

  if (olderThan) {
    const where: any = { createdAt: { lt: new Date(olderThan) } };
    if (type) where.type = type;

    const result = await prisma.auditLog.deleteMany({ where });
    return { deleted: result.count };
  }

  return { deleted: 0 };
}

// ─── Export Audit Logs ───────────────────────────────────
export async function exportAuditLogs(filter: AuditLogFilter, format: "csv" | "excel" | "pdf") {
  // Get all matching logs without pagination for export
  const { logs } = await getAuditLogs({ ...filter, page: 1, limit: 10000 });

  if (format === "csv") {
    const headers = [
      "ID",
      "Type",
      "Action",
      "User",
      "Email",
      "IP Address",
      "Severity",
      "Resource",
      "Endpoint",
      "Method",
      "Status",
      "Duration (ms)",
      "Timestamp",
    ];
    const rows = logs.map((log: any) => [
      log.id,
      log.type,
      log.action,
      log.userName || "",
      log.userEmail || "",
      log.ipAddress || "",
      log.severity,
      log.resource || "",
      log.endpoint || "",
      log.method || "",
      log.statusCode || "",
      log.duration || "",
      new Date(log.createdAt).toISOString(),
    ]);

    const csv = [headers.join(","), ...rows.map((r: any) => r.map((v: any) => `"${v}"`).join(","))].join(
      "\n"
    );
    return { data: csv, contentType: "text/csv", filename: `audit-logs-${Date.now()}.csv` };
  }

  // For Excel/PDF, return JSON data that frontend can process
  return { data: logs, contentType: "application/json", filename: `audit-logs-${Date.now()}.json` };
}

// ─── Get Unique Users for Filter ─────────────────────────
export async function getAuditUsers() {
  const users = await prisma.auditLog.findMany({
    distinct: ["userId"],
    where: { userId: { not: null } },
    select: { userId: true, userName: true, userEmail: true },
    take: 100,
  });
  return users.filter((u) => u.userId);
}

// ─── Get Unique Actions for Filter ───────────────────────
export async function getAuditActions() {
  const actions = await prisma.auditLog.findMany({
    distinct: ["action"],
    select: { action: true },
    take: 200,
  });
  return actions.map((a) => a.action).filter(Boolean);
}
