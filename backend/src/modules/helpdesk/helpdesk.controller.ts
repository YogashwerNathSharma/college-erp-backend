import { Request, Response } from "express";
import prisma from "../../utils/prisma";

// ══════════════════════════════════════════════════════════════
// HELP DESK CONTROLLER
// ══════════════════════════════════════════════════════════════

/**
 * Generate unique ticket number: TKT-YYYYMMDD-XXXX
 */
function generateTicketNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TKT-${dateStr}-${random}`;
}

/**
 * GET /api/helpdesk/dashboard
 * Dashboard stats, recent tickets, charts data
 */
export const getHelpdeskDashboard = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Stats
    const openTickets = await prisma.ticket.count({
      where: { tenantId, status: "OPEN" },
    });

    const inProgress = await prisma.ticket.count({
      where: { tenantId, status: "IN_PROGRESS" },
    });

    const resolvedToday = await prisma.ticket.count({
      where: { tenantId, status: "RESOLVED", resolvedAt: { gte: today, lt: tomorrow } },
    });

    const totalTickets = await prisma.ticket.count({
      where: { tenantId },
    });

    // Average resolution time (in hours) for tickets resolved this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const resolvedThisMonth = await prisma.ticket.findMany({
      where: {
        tenantId,
        status: { in: ["RESOLVED", "CLOSED"] },
        resolvedAt: { gte: startOfMonth },
      },
      select: { createdAt: true, resolvedAt: true },
    });

    let avgResolutionHours = 0;
    if (resolvedThisMonth.length > 0) {
      const totalHours = resolvedThisMonth.reduce((sum, t) => {
        if (t.resolvedAt) {
          const diff = t.resolvedAt.getTime() - t.createdAt.getTime();
          return sum + diff / (1000 * 60 * 60);
        }
        return sum;
      }, 0);
      avgResolutionHours = Math.round(totalHours / resolvedThisMonth.length);
    }

    // Recent tickets
    const recentTickets = await prisma.ticket.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Ticket trend (last 7 days)
    const ticketTrend = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const opened = await prisma.ticket.count({
        where: { tenantId, createdAt: { gte: dayStart, lt: dayEnd } },
      });
      const resolved = await prisma.ticket.count({
        where: { tenantId, resolvedAt: { gte: dayStart, lt: dayEnd } },
      });

      ticketTrend.push({
        date: dayStart.toISOString().split("T")[0],
        day: dayStart.toLocaleDateString("en-IN", { weekday: "short" }),
        opened,
        resolved,
      });
    }

    // Priority distribution
    const priorities = await prisma.ticket.groupBy({
      by: ["priority"],
      where: { tenantId, status: { in: ["OPEN", "IN_PROGRESS"] } },
      _count: { priority: true },
    });

    const priorityDistribution = priorities.map((p) => ({
      name: p.priority,
      value: p._count.priority,
    }));

    // Category breakdown
    const categories = await prisma.ticket.groupBy({
      by: ["category"],
      where: { tenantId, createdAt: { gte: startOfMonth } },
      _count: { category: true },
    });

    const categoryBreakdown = categories.map((c) => ({
      name: c.category,
      count: c._count.category,
    }));

    // Status distribution
    const statuses = await prisma.ticket.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { status: true },
    });

    const statusDistribution = statuses.map((s) => ({
      name: s.status,
      value: s._count.status,
    }));

    res.json({
      success: true,
      data: {
        stats: {
          openTickets,
          inProgress,
          resolvedToday,
          totalTickets,
          avgResolutionHours,
        },
        recentTickets,
        ticketTrend,
        priorityDistribution,
        categoryBreakdown,
        statusDistribution,
      },
    });
  } catch (error: any) {
    console.error("Helpdesk Dashboard Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/helpdesk/tickets
 * List all tickets with filters and pagination
 */
export const getAllTickets = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;
    const { status, priority, category, search, page = "1", limit = "20" } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { tenantId };

    if (status && status !== "ALL") where.status = status;
    if (priority && priority !== "ALL") where.priority = priority;
    if (category && category !== "ALL") where.category = category;

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { ticketNumber: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
        { raisedBy: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { comments: { orderBy: { createdAt: "desc" }, take: 1 } },
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    console.error("Get Tickets Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/helpdesk/tickets/:id
 * Get single ticket with comments
 */
export const getTicketById = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;
    const id = req.params.id as string;

    const ticket = await prisma.ticket.findFirst({
      where: { id, tenantId },
      include: { comments: { orderBy: { createdAt: "asc" } } },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    res.json({ success: true, data: ticket });
  } catch (error: any) {
    console.error("Get Ticket Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/helpdesk/tickets
 * Create a new ticket
 */
export const createTicket = async (req: Request, res: Response) => {
  try {
    const { tenantId, userId, role } = req.user as any;
    const { title, description, category, priority, raisedBy, attachments } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "title, description, and category are required",
      });
    }

    const ticketNumber = generateTicketNumber();

    const ticket = await prisma.ticket.create({
      data: {
        tenantId,
        ticketNumber,
        title,
        description,
        category,
        priority: priority || "MEDIUM",
        status: "OPEN",
        raisedBy: raisedBy || userId,
        raisedByRole: role,
        attachments: attachments || [],
      },
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (error: any) {
    console.error("Create Ticket Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/helpdesk/tickets/:id
 * Update ticket (assign, change priority, status, etc.)
 */
export const updateTicket = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;
    const id = req.params.id as string;
    const { status, priority, assignedTo, resolution } = req.body;

    const existing = await prisma.ticket.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (resolution) updateData.resolution = resolution;

    if (status === "RESOLVED" || status === "CLOSED") {
      updateData.resolvedAt = new Date();
    }
    if (status === "CLOSED") {
      updateData.closedAt = new Date();
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: { comments: { orderBy: { createdAt: "desc" }, take: 3 } },
    });

    res.json({ success: true, data: ticket });
  } catch (error: any) {
    console.error("Update Ticket Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/helpdesk/tickets/:id/comments
 * Add a comment to a ticket
 */
export const addTicketComment = async (req: Request, res: Response) => {
  try {
    const { userId, role, tenantId } = req.user as any;
    const id = req.params.id as string;
    const { message, isInternal } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "message is required" });
    }

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: id,
        tenantId,
        message,
        author: userId,
        authorRole: role,
        isInternal: isInternal || false,
      },
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error: any) {
    console.error("Add Comment Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/helpdesk/tickets/:id
 * Delete a ticket
 */
export const deleteTicket = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;
    const id = req.params.id as string;

    const existing = await prisma.ticket.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // Delete comments first
    await prisma.ticketComment.deleteMany({ where: { ticketId: id } });
    await prisma.ticket.delete({ where: { id } });

    res.json({ success: true, message: "Ticket deleted" });
  } catch (error: any) {
    console.error("Delete Ticket Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// TICKET CATEGORIES
// ──────────────────────────────────────────────────────────────

/**
 * GET /api/helpdesk/categories
 */
export const getTicketCategories = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;

    const categories = await prisma.ticketCategory.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
    });

    res.json({ success: true, data: categories });
  } catch (error: any) {
    console.error("Get Ticket Categories Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/helpdesk/categories
 */
export const createTicketCategory = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "name is required" });
    }

    const category = await prisma.ticketCategory.create({
      data: { tenantId, name, description: description || null },
    });

    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    console.error("Create Ticket Category Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/helpdesk/categories/:id
 */
export const deleteTicketCategory = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;
    const id = req.params.id as string;

    await prisma.ticketCategory.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true, message: "Category deactivated" });
  } catch (error: any) {
    console.error("Delete Ticket Category Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
