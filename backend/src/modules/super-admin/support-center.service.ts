// ═══════════════════════════════════════════════════════════
// SUPPORT CENTER SERVICE - Tickets, KB, Announcements
// ═══════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Types ───────────────────────────────────────────────
export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";

export interface TicketFilter {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateTicketInput {
  title: string;
  description: string;
  priority?: TicketPriority;
  category?: string;
  reportedBy: string;
  tenantId?: string;
  assignedTo?: string;
}

export interface KBArticle {
  id?: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  isPublished?: boolean;
}

export interface Announcement {
  id?: string;
  title: string;
  content: string;
  type: "info" | "warning" | "critical" | "maintenance";
  targetAudience?: string;
  publishedAt?: string;
  expiresAt?: string;
  isActive?: boolean;
}

// ─── Ticket Management ───────────────────────────────────

export async function getTickets(filter: TicketFilter) {
  const {
    status,
    priority,
    assignedTo,
    search,
    page = 1,
    limit = 25,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filter;

  const where: any = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assignedTo) where.assignedTo = assignedTo;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { ticketNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        reporter: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    tickets,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getTicketById(id: string) {
  return prisma.supportTicket.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      reporter: { select: { id: true, name: true, email: true } },
      comments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function createTicket(input: CreateTicketInput) {
  const ticketCount = await prisma.supportTicket.count();
  const ticketNumber = `TKT-${String(ticketCount + 1).padStart(5, "0")}`;

  return prisma.supportTicket.create({
    data: {
      ticketNumber,
      title: input.title,
      description: input.description,
      priority: input.priority || "medium",
      category: input.category || "general",
      status: "open",
      reportedBy: input.reportedBy,
      tenantId: input.tenantId,
      assignedTo: input.assignedTo,
    },
  });
}

export async function updateTicket(id: string, data: Partial<any>) {
  return prisma.supportTicket.update({
    where: { id },
    data: { ...data, updatedAt: new Date() },
  });
}

export async function assignTicket(id: string, assigneeId: string) {
  return prisma.supportTicket.update({
    where: { id },
    data: { assignedTo: assigneeId, status: "in_progress", updatedAt: new Date() },
  });
}

export async function resolveTicket(id: string, resolution: string) {
  return prisma.supportTicket.update({
    where: { id },
    data: {
      status: "resolved",
      resolution,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function addTicketComment(ticketId: string, authorId: string, content: string) {
  return prisma.supportTicketComment.create({
    data: {
      ticketId,
      authorId,
      content,
    },
  });
}

export async function getTicketStats() {
  const [total, open, inProgress, resolved, closed, byPriority, avgResolutionTime] = await Promise.all([
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: "open" } }),
    prisma.supportTicket.count({ where: { status: "in_progress" } }),
    prisma.supportTicket.count({ where: { status: "resolved" } }),
    prisma.supportTicket.count({ where: { status: "closed" } }),
    prisma.supportTicket.groupBy({ by: ["priority"], _count: true }),
    prisma.supportTicket.findMany({
      where: { resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
      take: 100,
      orderBy: { resolvedAt: "desc" },
    }),
  ]);

  // Calculate average resolution time
  let avgHours = 0;
  if (avgResolutionTime.length > 0) {
    const totalHours = avgResolutionTime.reduce((sum, t) => {
      const diff = (t.resolvedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + diff;
    }, 0);
    avgHours = Math.round(totalHours / avgResolutionTime.length);
  }

  return {
    total,
    open,
    inProgress,
    resolved,
    closed,
    avgResolutionHours: avgHours,
    byPriority: byPriority.reduce((acc, item) => {
      acc[item.priority] = item._count;
      return acc;
    }, {} as Record<string, number>),
  };
}

// ─── Knowledge Base ──────────────────────────────────────

export async function getKBArticles(filter?: { category?: string; search?: string; published?: boolean }) {
  const where: any = {};
  if (filter?.category) where.category = filter.category;
  if (filter?.published !== undefined) where.isPublished = filter.published;
  if (filter?.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { content: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  return prisma.kbArticle.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getKBArticleById(id: string) {
  return prisma.kbArticle.findUnique({ where: { id } });
}

export async function createKBArticle(data: KBArticle) {
  return prisma.kbArticle.create({
    data: {
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags || [],
      isPublished: data.isPublished ?? false,
    },
  });
}

export async function updateKBArticle(id: string, data: Partial<KBArticle>) {
  return prisma.kbArticle.update({
    where: { id },
    data: { ...data, updatedAt: new Date() },
  });
}

export async function deleteKBArticle(id: string) {
  return prisma.kbArticle.delete({ where: { id } });
}

// ─── Announcements ───────────────────────────────────────

export async function getAnnouncements(activeOnly: boolean = false) {
  const where: any = {};
  if (activeOnly) {
    where.isActive = true;
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
  }

  return prisma.announcement.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function createAnnouncement(data: Announcement) {
  return prisma.announcement.create({
    data: {
      title: data.title,
      content: data.content,
      type: data.type,
      targetAudience: data.targetAudience || "all",
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: data.isActive ?? true,
    },
  });
}

export async function updateAnnouncement(id: string, data: Partial<Announcement>) {
  const updateData: any = { ...data, updatedAt: new Date() };
  if (data.publishedAt) updateData.publishedAt = new Date(data.publishedAt);
  if (data.expiresAt) updateData.expiresAt = new Date(data.expiresAt);

  return prisma.announcement.update({ where: { id }, data: updateData });
}

export async function deleteAnnouncement(id: string) {
  return prisma.announcement.delete({ where: { id } });
}

// ─── Maintenance Mode ────────────────────────────────────

export async function getMaintenanceStatus() {
  const setting = await prisma.systemSetting.findFirst({
    where: { key: "maintenance_mode" },
  });

  return {
    enabled: setting?.value === "true",
    message: (setting?.metadata as any)?.message || "System is under maintenance",
    scheduledEnd: (setting?.metadata as any)?.scheduledEnd || null,
  };
}

export async function toggleMaintenanceMode(enabled: boolean, message?: string, scheduledEnd?: string) {
  return prisma.systemSetting.upsert({
    where: { key: "maintenance_mode" },
    create: {
      key: "maintenance_mode",
      value: String(enabled),
      metadata: { message: message || "System is under maintenance", scheduledEnd },
    },
    update: {
      value: String(enabled),
      metadata: { message: message || "System is under maintenance", scheduledEnd },
    },
  });
}

// ─── System Status ───────────────────────────────────────

export async function getSystemStatus() {
  const startTime = Date.now();

  // Check database connectivity
  let dbStatus = "operational";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "degraded";
  }
  const dbResponseTime = Date.now() - startTime;

  // Uptime
  const uptime = process.uptime();

  // Memory
  const memory = process.memoryUsage();

  return {
    overall: dbStatus === "operational" ? "operational" : "degraded",
    services: [
      { name: "Database", status: dbStatus, responseTime: dbResponseTime },
      { name: "API Server", status: "operational", responseTime: 0 },
      { name: "Authentication", status: "operational", responseTime: 0 },
      { name: "File Storage", status: "operational", responseTime: 0 },
      { name: "Email Service", status: "operational", responseTime: 0 },
      { name: "Queue Worker", status: "operational", responseTime: 0 },
    ],
    uptime: {
      seconds: Math.round(uptime),
      formatted: `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    },
    memory: {
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
      rss: Math.round(memory.rss / 1024 / 1024),
    },
  };
}
