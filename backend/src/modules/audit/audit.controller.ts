import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════
// AUDIT & ACTIVITY TRACKING CONTROLLER
// ══════════════════════════════════════════════════════════

/**
 * GET /api/audit/logs
 * List audit logs with filters
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const {
      page = "1",
      limit = "20",
      userId,
      module,
      action,
      entityType,
      startDate,
      endDate,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { tenantId };

    if (userId) where.userId = userId as string;
    if (module) where.module = module as string;
    if (action) where.action = action as string;
    if (entityType) where.entityType = entityType as string;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    if (search) {
      where.OR = [
        { userName: { contains: search as string, mode: "insensitive" } },
        { module: { contains: search as string, mode: "insensitive" } },
        { entityType: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch audit logs", error: error.message });
  }
};

/**
 * GET /api/audit/logs/:id
 * Get single audit log with full details (diff view)
 */
export const getAuditLogDetail = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const logId = req.params.id as string;

    const log = await prisma.auditLog.findFirst({
      where: { id: logId, tenantId },
    });

    if (!log) {
      return res.status(404).json({ success: false, message: "Audit log not found" });
    }

    res.json({ success: true, data: log });
  } catch (error: any) {
    console.error("Error fetching audit log detail:", error);
    res.status(500).json({ success: false, message: "Failed to fetch audit log", error: error.message });
  }
};

/**
 * GET /api/audit/user/:userId
 * Get user activity timeline
 */
export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const userId = req.params.userId as string;
    const { page = "1", limit = "50" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [activities, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { tenantId, userId },
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where: { tenantId, userId } }),
    ]);

    res.json({
      success: true,
      data: activities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user activity", error: error.message });
  }
};

/**
 * GET /api/audit/login-history
 * Get login/logout history
 */
export const getLoginHistory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const { page = "1", limit = "20", userId, startDate, endDate } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { tenantId };
    if (userId) where.userId = userId as string;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [history, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.loginHistory.count({ where }),
    ]);

    res.json({
      success: true,
      data: history,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Error fetching login history:", error);
    res.status(500).json({ success: false, message: "Failed to fetch login history", error: error.message });
  }
};

/**
 * POST /api/audit/rollback/:id
 * Rollback a change using stored previousData
 */
export const rollbackChange = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const logId = req.params.id as string;
    const userId = (req as any).user?.id;

    const log = await prisma.auditLog.findFirst({
      where: { id: logId, tenantId, isRollbackable: true, rolledBack: false },
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found or cannot be rolled back",
      });
    }

    if (!log.previousData || !log.entityId || !log.entityType) {
      return res.status(400).json({
        success: false,
        message: "No previous data available for rollback",
      });
    }

    // Dynamically get the Prisma model and update with previous data
    const modelName = log.entityType.charAt(0).toLowerCase() + log.entityType.slice(1);
    const model = (prisma as any)[modelName];

    if (!model) {
      return res.status(400).json({
        success: false,
        message: `Model ${log.entityType} not found for rollback`,
      });
    }

    // Perform rollback
    if (log.action === "DELETE") {
      // Re-create the entity
      await model.create({ data: log.previousData });
    } else if (log.action === "UPDATE") {
      // Restore previous data
      const { id, _id, createdAt, updatedAt, ...restoreData } = log.previousData as any;
      await model.update({
        where: { id: log.entityId },
        data: restoreData,
      });
    } else if (log.action === "CREATE") {
      // Delete the created entity
      await model.delete({ where: { id: log.entityId } });
    }

    // Mark as rolled back
    await prisma.auditLog.update({
      where: { id: logId },
      data: {
        rolledBack: true,
        rolledBackBy: userId,
        rolledBackAt: new Date(),
      },
    });

    // Create audit log for the rollback itself
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        userName: (req as any).user?.name || "System",
        userRole: (req as any).user?.role || "ADMIN",
        entity: log.entity || "UNKNOWN",
        action: "ROLLBACK",
        module: log.module,
        entityId: log.entityId,
        entityType: log.entityType,
        previousData: log.newData,
        newData: log.previousData,
        ipAddress: req.ip,
        data: { userAgent: req.headers["user-agent"] },
        isRollbackable: false,
      },
    });

    res.json({ success: true, message: "Change rolled back successfully" });
  } catch (error: any) {
    console.error("Error rolling back change:", error);
    res.status(500).json({ success: false, message: "Failed to rollback change", error: error.message });
  }
};

/**
 * GET /api/audit/stats
 * Dashboard stats for audit module
 */
export const getAuditStats = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    // Parallel queries for stats
    const [
      actionsToday,
      activeUsersToday,
      loginsToday,
      exportsToday,
      totalLogs,
      topUsers,
      topModules,
      actionBreakdown,
      recentLogs,
      weeklyTrend,
    ] = await Promise.all([
      // Actions today
      prisma.auditLog.count({
        where: { tenantId, createdAt: { gte: today, lt: tomorrow } },
      }),
      // Unique active users today
      prisma.auditLog.findMany({
        where: { tenantId, createdAt: { gte: today, lt: tomorrow } },
        distinct: ["userId"],
        select: { userId: true },
      }),
      // Logins today
      prisma.loginHistory.count({
        where: { tenantId, action: "LOGIN", createdAt: { gte: today, lt: tomorrow } },
      }),
      // Exports today
      prisma.auditLog.count({
        where: { tenantId, action: "EXPORT", createdAt: { gte: today, lt: tomorrow } },
      }),
      // Total logs
      prisma.auditLog.count({ where: { tenantId } }),
      // Top 5 users by activity (this week)
      prisma.auditLog.groupBy({
        by: ["userId", "userName"],
        where: { tenantId, createdAt: { gte: thisWeekStart } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      // Top modules
      prisma.auditLog.groupBy({
        by: ["module"],
        where: { tenantId, createdAt: { gte: thisWeekStart } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 8,
      }),
      // Action breakdown today
      prisma.auditLog.groupBy({
        by: ["action"],
        where: { tenantId, createdAt: { gte: today, lt: tomorrow } },
        _count: { id: true },
      }),
      // Recent 10 logs
      prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      // Weekly trend (last 7 days)
      Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const day = new Date(today);
          day.setDate(today.getDate() - (6 - i));
          const nextDay = new Date(day);
          nextDay.setDate(day.getDate() + 1);
          return prisma.auditLog.count({
            where: { tenantId, createdAt: { gte: day, lt: nextDay } },
          }).then((count) => ({
            date: day.toISOString().split("T")[0],
            day: day.toLocaleDateString("en-IN", { weekday: "short" }),
            count,
          }));
        })
      ),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          actionsToday,
          activeUsersToday: activeUsersToday.length,
          loginsToday,
          exportsToday,
          totalLogs,
        },
        topUsers: topUsers.map((u: any) => ({
          userId: u.userId,
          userName: u.userName,
          count: u._count.id,
        })),
        topModules: topModules.map((m: any) => ({
          module: m.module,
          count: m._count.id,
        })),
        actionBreakdown: actionBreakdown.map((a: any) => ({
          action: a.action,
          count: a._count.id,
        })),
        recentLogs,
        weeklyTrend,
      },
    });
  } catch (error: any) {
    console.error("Error fetching audit stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch audit stats", error: error.message });
  }
};

/**
 * Helper: Create audit log entry (used by middleware and other modules)
 */
export const createAuditEntry = async (data: {
  tenantId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  entityId?: string;
  entityType?: string;
  previousData?: any;
  newData?: any;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  device?: string;
  os?: string;
  isRollbackable?: boolean;
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        ...data,
        entity: data.entityType || data.module || "UNKNOWN",
        entityId: data.entityId || "",
      },
    });
  } catch (error) {
    console.error("Failed to create audit entry:", error);
    // Don't throw - audit failures should not block main operations
  }
};

/**
 * Helper: Log login/logout events
 */
export const logLoginEvent = async (data: {
  tenantId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  device?: string;
  os?: string;
  isSuccessful?: boolean;
  failReason?: string;
}) => {
  try {
    await prisma.loginHistory.create({ data });
  } catch (error) {
    console.error("Failed to log login event:", error);
  }
};
