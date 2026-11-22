// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// AUDIT CENTER SERVICE - Enterprise Audit Log Management
// ═══════════════════════════════════════════════════════════

import prisma from "../../utils/prisma";

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

  // ─── Tab -> filter mapping ───────────────────────────────
  // The Audit Center UI has tabs: audit | user | activity | admin | api | db.
  // Existing records do NOT populate the `type` field, so we map each tab
  // onto the fields that ARE populated (action, userRole, module). This way
  // every tab shows meaningful rows instead of being empty.
  switch (type) {
    case "user":
      // User-account & authentication related logs. Match on the fields that
      // real records actually carry: entity "User", user-ish actions
      // (LOGIN/LOGOUT/PASSWORD/USER...), or user/auth modules.
      where.OR = [
        { entity: { contains: "User", mode: "insensitive" } },
        { entityType: { contains: "User", mode: "insensitive" } },
        { module: { contains: "user", mode: "insensitive" } },
        { module: { contains: "auth", mode: "insensitive" } },
        { action: { contains: "USER", mode: "insensitive" } },
        { action: { contains: "LOGIN", mode: "insensitive" } },
        { action: { contains: "LOGOUT", mode: "insensitive" } },
        { action: { contains: "PASSWORD", mode: "insensitive" } },
      ];
      break;
    case "admin":
      // Actions performed by admin / super-admin roles
      where.userRole = { in: ["ADMIN", "SUPER_ADMIN", "TENANT_ADMIN"] };
      break;
    case "api":
      // API-key / integration driven calls (best-effort via module)
      where.module = { contains: "api", mode: "insensitive" };
      break;
    case "db":
      // Database-level / backup operations
      where.OR = [
        { module: { contains: "database", mode: "insensitive" } },
        { module: { contains: "backup", mode: "insensitive" } },
        { action: "DELETE" },
      ];
      break;
    case "activity":
      // All activity (same as full feed) — no extra filter
      break;
    case "audit":
    case "all":
    default:
      // All logs — no type filter
      break;
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

  const [rawLogs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  // Resolve tenant names in ONE query (so we can show WHOSE tenant it was).
  const tenantIds = Array.from(
    new Set(rawLogs.map((l: any) => l.tenantId).filter(Boolean))
  );
  const tenants = tenantIds.length
    ? await prisma.tenant.findMany({
        where: { id: { in: tenantIds as string[] } },
        select: { id: true, name: true },
      })
    : [];
  const tenantMap: Record<string, string> = {};
  tenants.forEach((t: any) => { tenantMap[t.id] = t.name; });

  // Enrich each log so the UI can clearly show WHAT was done, ON WHICH entity,
  // and for WHICH tenant.
  const logs = rawLogs.map((l: any) => {
    const tenantName = l.tenantId ? (tenantMap[l.tenantId] || null) : null;
    const entityLabel = l.entity || l.entityType || l.module || "record";
    // e.g. "CREATE Student" / "UPDATE tenants"
    const resource = [l.action, entityLabel].filter(Boolean).join(" ");
    return {
      ...l,
      resource,                 // shown under Action
      resourceId: l.entityId,   // which record
      tenantName,               // whose tenant (null for platform/super-admin)
      userEmail: (l.metadata && l.metadata.userEmail) || null,
    };
  });

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
// ─── Super Admin (God Mode) API/Action Logs ──────────────
// Shows WHICH api was called, WHERE the change happened, by WHOM, from where.
// Reads from the dedicated SuperAdminAuditLog table (P5.4).
export async function getSuperAdminLogs(filter: {
  page?: number;
  limit?: number;
  module?: string;
  action?: string;
  severity?: string;
  search?: string;
}) {
  const { page = 1, limit = 25, module, action, severity, search } = filter;
  const where: any = {};
  if (module) where.module = { contains: module, mode: "insensitive" };
  if (action) where.action = { contains: action, mode: "insensitive" };
  if (severity) where.severity = severity;
  if (search) {
    where.OR = [
      { path: { contains: search, mode: "insensitive" } },
      { module: { contains: search, mode: "insensitive" } },
      { actorEmail: { contains: search, mode: "insensitive" } },
      { action: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    prisma.superAdminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.superAdminAuditLog.count({ where }),
  ]);

  // Map to the shape the Audit Center table/detail expects.
  const logs = rows.map((r: any) => ({
    id: r.id,
    action: r.action,
    severity: r.severity,
    type: "api",
    createdAt: r.createdAt,
    userName: r.actorName || "Super Admin",
    userEmail: r.actorEmail || "—",
    userRole: "SUPER_ADMIN",
    ipAddress: r.ipAddress || "—",
    method: r.method,
    endpoint: r.path,            // WHICH api was called
    statusCode: r.statusCode,
    resource: r.module,          // WHERE (which module) the change happened
    resourceId: r.targetId,      // WHICH record was changed
    details: r.metadata,
  }));

  return { logs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

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
    bySeverity: (bySeverity as any[]).reduce((acc: Record<string, number>, item: any) => {
      acc[item.severity || "unknown"] = typeof item._count === "number" ? item._count : item._count?._all || 0;
      return acc;
    }, {} as Record<string, number>),
    byType: (byType as any[]).reduce((acc: Record<string, number>, item: any) => {
      acc[item.type || "unknown"] = typeof item._count === "number" ? item._count : item._count?._all || 0;
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
  const { logs } = await getAuditLogs({ ...filter, page: 1, limit: 2000 });

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
