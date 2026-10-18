import { Request, Response } from "express";
import prisma from "../../utils/prisma";

// ══════════════════════════════════════════════════════════════
// EVENT MANAGEMENT CONTROLLER
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/events/dashboard
 * Dashboard stats, upcoming events, calendar data
 */
export const getEventDashboard = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Upcoming events
    const upcomingEvents = await prisma.event.count({
      where: { tenantId, status: "UPCOMING", startDate: { gte: now } },
    });

    // Events this month
    const thisMonthEvents = await prisma.event.count({
      where: {
        tenantId,
        startDate: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    // Total participants (sum across all upcoming/ongoing events)
    const eventsWithParticipants = await prisma.event.findMany({
      where: { tenantId, status: { in: ["UPCOMING", "ONGOING"] } },
      select: { participants: true },
    });
    const totalParticipants = eventsWithParticipants.reduce(
      (sum, e) => sum + (e.participants?.length || 0),
      0
    );

    // Budget spent this month
    const budgetEvents = await prisma.event.findMany({
      where: {
        tenantId,
        startDate: { gte: startOfMonth, lte: endOfMonth },
        actualCost: { not: null },
      },
      select: { actualCost: true, budget: true },
    });
    const budgetSpent = budgetEvents.reduce((sum, e) => sum + (e.actualCost || 0), 0);
    const totalBudget = budgetEvents.reduce((sum, e) => sum + (e.budget || 0), 0);

    // Upcoming event list (next 10)
    const upcomingList = await prisma.event.findMany({
      where: { tenantId, startDate: { gte: now } },
      orderBy: { startDate: "asc" },
      take: 10,
      include: { category: true },
    });

    // Events for calendar view (this month)
    const calendarEvents = await prisma.event.findMany({
      where: {
        tenantId,
        startDate: { gte: startOfMonth, lte: endOfMonth },
      },
      orderBy: { startDate: "asc" },
      include: { category: true },
    });

    // Type distribution
    const allEventsThisMonth = await prisma.event.findMany({
      where: {
        tenantId,
        startDate: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { type: true },
    });

    const typeMap: Record<string, number> = {};
    allEventsThisMonth.forEach((e) => {
      typeMap[e.type] = (typeMap[e.type] || 0) + 1;
    });
    const typeDistribution = Object.entries(typeMap).map(([name, value]) => ({
      name,
      value,
    }));

    // Monthly event count (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const count = await prisma.event.count({
        where: { tenantId, startDate: { gte: monthStart, lte: monthEnd } },
      });

      monthlyTrend.push({
        month: monthStart.toLocaleDateString("en-IN", { month: "short" }),
        events: count,
      });
    }

    res.json({
      success: true,
      data: {
        stats: {
          upcomingEvents,
          thisMonthEvents,
          totalParticipants,
          budgetSpent,
          totalBudget,
        },
        upcomingList,
        calendarEvents,
        typeDistribution,
        monthlyTrend,
      },
    });
  } catch (error: any) {
    console.error("Event Dashboard Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/events
 * List all events with filters and pagination
 */
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;
    const { status, type, search, page = "1", limit = "20", from, to } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { tenantId };

    if (status && status !== "ALL") where.status = status;
    if (type && type !== "ALL") where.type = type;

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
        { venue: { contains: search as string, mode: "insensitive" } },
        { organizer: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (from || to) {
      where.startDate = {};
      if (from) where.startDate.gte = new Date(from as string);
      if (to) where.startDate.lte = new Date(to as string);
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { startDate: "desc" },
        skip,
        take,
        include: { category: true },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      success: true,
      data: events,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    console.error("Get Events Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/events/:id
 * Get single event details
 */
export const getEventById = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;
    const id = req.params.id as string;

    const event = await prisma.event.findFirst({
      where: { id, tenantId },
      include: { category: true },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    res.json({ success: true, data: event });
  } catch (error: any) {
    console.error("Get Event Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/events
 * Create a new event
 */
export const createEvent = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      startTime,
      endTime,
      venue,
      organizer,
      participants,
      isPublic,
      budget,
      notes,
      color,
      categoryId,
    } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "title, startDate, and endDate are required",
      });
    }

    // Auto-set status based on dates
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    let status = "UPCOMING";
    if (start <= now && end >= now) status = "ONGOING";
    if (end < now) status = "COMPLETED";

    const event = await prisma.event.create({
      data: {
        tenantId,
        title,
        description: description || null,
        type: type || "OTHER",
        startDate: start,
        endDate: end,
        startTime: startTime || null,
        endTime: endTime || null,
        venue: venue || null,
        organizer: organizer || null,
        participants: participants || [],
        isPublic: isPublic ?? true,
        status,
        budget: budget ? parseFloat(budget) : null,
        notes: notes || null,
        color: color || "#4f46e5",
        categoryId: categoryId || null,
      },
      include: { category: true },
    });

    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    console.error("Create Event Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/events/:id
 * Update an event
 */
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;
    const id = req.params.id as string;
    const updateData = req.body;

    // Ensure event belongs to this tenant
    const existing = await prisma.event.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.budget) updateData.budget = parseFloat(updateData.budget);
    if (updateData.actualCost) updateData.actualCost = parseFloat(updateData.actualCost);

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    res.json({ success: true, data: event });
  } catch (error: any) {
    console.error("Update Event Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/events/:id
 * Delete an event
 */
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;
    const id = req.params.id as string;

    const existing = await prisma.event.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    await prisma.event.delete({ where: { id } });

    res.json({ success: true, message: "Event deleted" });
  } catch (error: any) {
    console.error("Delete Event Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// EVENT CATEGORIES
// ──────────────────────────────────────────────────────────────

/**
 * GET /api/events/categories
 * List all event categories for tenant
 */
export const getEventCategories = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;

    const categories = await prisma.eventCategory.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });

    res.json({ success: true, data: categories });
  } catch (error: any) {
    console.error("Get Event Categories Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/events/categories
 * Create a new event category
 */
export const createEventCategory = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;
    const { name, color, icon } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "name is required" });
    }

    const category = await prisma.eventCategory.create({
      data: {
        tenantId,
        name,
        color: color || "#4f46e5",
        icon: icon || null,
      },
    });

    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    console.error("Create Event Category Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/events/categories/:id
 * Delete an event category
 */
export const deleteEventCategory = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;
    const id = req.params.id as string;

    await prisma.eventCategory.delete({ where: { id } });

    res.json({ success: true, message: "Category deleted" });
  } catch (error: any) {
    console.error("Delete Event Category Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
