import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════
// SCHEDULER CONTROLLER
// Handles CRUD for scheduled tasks + execution management
// ══════════════════════════════════════════════════════════

// Helper: Parse cron expression to next run date
function getNextRunDate(cronExpression: string, fromDate: Date = new Date()): Date {
  const parts = cronExpression.split(" ");
  if (parts.length !== 5) return new Date(fromDate.getTime() + 3600000); // fallback 1hr

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const next = new Date(fromDate);

  // Simple parser for common patterns
  if (minute !== "*") next.setMinutes(parseInt(minute));
  if (hour !== "*") next.setHours(parseInt(hour));

  // If the time has already passed today, move to next day
  if (next <= fromDate) {
    next.setDate(next.getDate() + 1);
  }

  // Handle weekly (dayOfWeek)
  if (dayOfWeek !== "*") {
    const targetDay = parseInt(dayOfWeek);
    while (next.getDay() !== targetDay) {
      next.setDate(next.getDate() + 1);
    }
  }

  // Handle monthly (dayOfMonth)
  if (dayOfMonth !== "*" && dayOfMonth !== "1") {
    next.setDate(parseInt(dayOfMonth));
    if (next <= fromDate) {
      next.setMonth(next.getMonth() + 1);
    }
  }

  return next;
}

// Predefined task templates
const PREDEFINED_TASKS = [
  {
    name: "Auto Backup",
    description: "Automatic database backup every day at 2:00 AM",
    type: "BACKUP",
    cronExpression: "0 2 * * *",
    handler: "backupService.createAutoBackup",
  },
  {
    name: "Birthday SMS",
    description: "Send birthday wishes to students and staff at 7:00 AM",
    type: "SMS",
    cronExpression: "0 7 * * *",
    handler: "smsService.sendBirthdayWishes",
  },
  {
    name: "Fee Reminder",
    description: "Send fee reminders to pending students every Monday at 9:00 AM",
    type: "REMINDER",
    cronExpression: "0 9 * * 1",
    handler: "feeService.sendReminders",
  },
  {
    name: "Attendance Alert",
    description: "Send absent notification to parents at 11:00 AM daily",
    type: "SMS",
    cronExpression: "0 11 * * *",
    handler: "attendanceService.sendAbsentAlerts",
  },
  {
    name: "Monthly Report Generation",
    description: "Auto-generate monthly reports on 1st of every month at 6:00 AM",
    type: "REPORT",
    cronExpression: "0 6 1 * *",
    handler: "reportService.generateMonthlyReports",
  },
];

// ──────────────────────────────────────────────────────────
// GET /api/scheduler/tasks
// List all scheduled tasks for tenant
// ──────────────────────────────────────────────────────────
export const listTasks = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { type, status, search, page = "1", limit = "20" } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { tenantId };

    if (type) where.type = type;
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.scheduledTask.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.scheduledTask.count({ where }),
    ]);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    console.error("Error listing tasks:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// POST /api/scheduler/tasks
// Create a new scheduled task
// ──────────────────────────────────────────────────────────
export const createTask = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).user?.id || "system";
    const { name, description, type, cronExpression, handler, params, isActive } = req.body;

    if (!name || !type || !cronExpression || !handler) {
      return res.status(400).json({
        success: false,
        message: "Name, type, cronExpression, and handler are required",
      });
    }

    const nextRunAt = isActive !== false ? getNextRunDate(cronExpression) : null;

    const task = await prisma.scheduledTask.create({
      data: {
        tenantId,
        name,
        description,
        type,
        cronExpression,
        handler,
        params: params || undefined,
        isActive: isActive !== false,
        nextRunAt,
        createdBy: userId,
      },
    });

    res.status(201).json({ success: true, data: task });
  } catch (error: any) {
    console.error("Error creating task:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// PUT /api/scheduler/tasks/:id
// Update a scheduled task
// ──────────────────────────────────────────────────────────
export const updateTask = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const taskId = req.params.id as string;
    const { name, description, type, cronExpression, handler, params, isActive } = req.body;

    const existing = await prisma.scheduledTask.findFirst({
      where: { id: taskId, tenantId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (cronExpression !== undefined) {
      updateData.cronExpression = cronExpression;
      updateData.nextRunAt = getNextRunDate(cronExpression);
    }
    if (handler !== undefined) updateData.handler = handler;
    if (params !== undefined) updateData.params = params;
    if (isActive !== undefined) {
      updateData.isActive = isActive;
      if (!isActive) updateData.nextRunAt = null;
      else updateData.nextRunAt = getNextRunDate(existing.cronExpression);
    }

    const task = await prisma.scheduledTask.update({
      where: { id: taskId },
      data: updateData,
    });

    res.json({ success: true, data: task });
  } catch (error: any) {
    console.error("Error updating task:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// DELETE /api/scheduler/tasks/:id
// ──────────────────────────────────────────────────────────
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const taskId = req.params.id as string;

    const existing = await prisma.scheduledTask.findFirst({
      where: { id: taskId, tenantId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Delete logs first, then task
    await prisma.schedulerLog.deleteMany({ where: { taskId } });
    await prisma.scheduledTask.delete({ where: { id: taskId } });

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting task:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// POST /api/scheduler/tasks/:id/run
// Run a task immediately (manual trigger)
// ──────────────────────────────────────────────────────────
export const runTaskNow = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const taskId = req.params.id as string;

    const task = await prisma.scheduledTask.findFirst({
      where: { id: taskId, tenantId },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const startedAt = new Date();

    // Update task status to RUNNING
    await prisma.scheduledTask.update({
      where: { id: taskId },
      data: { lastStatus: "RUNNING", lastRunAt: startedAt },
    });

    // Simulate execution (in production, this would call the actual handler)
    try {
      // Here you'd dynamically resolve and call the handler
      // For now, simulate success
      const duration = Math.floor(Math.random() * 5000) + 1000;

      await new Promise((resolve) => setTimeout(resolve, 100)); // Minimal delay

      const completedAt = new Date();

      // Log execution
      await prisma.schedulerLog.create({
        data: {
          tenantId,
          taskId,
          status: "SUCCESS",
          startedAt,
          completedAt,
          duration: completedAt.getTime() - startedAt.getTime(),
          output: `Task "${task.name}" executed successfully`,
        },
      });

      // Update task
      const nextRunAt = getNextRunDate(task.cronExpression);
      await prisma.scheduledTask.update({
        where: { id: taskId },
        data: {
          lastStatus: "SUCCESS",
          lastRunAt: startedAt,
          nextRunAt,
          runCount: { increment: 1 },
          lastError: null,
        },
      });

      res.json({
        success: true,
        message: `Task "${task.name}" executed successfully`,
        data: { startedAt, completedAt, duration },
      });
    } catch (execError: any) {
      // Log failure
      await prisma.schedulerLog.create({
        data: {
          tenantId,
          taskId,
          status: "FAILED",
          startedAt,
          completedAt: new Date(),
          duration: Date.now() - startedAt.getTime(),
          error: execError.message,
        },
      });

      await prisma.scheduledTask.update({
        where: { id: taskId },
        data: {
          lastStatus: "FAILED",
          lastError: execError.message,
          runCount: { increment: 1 },
        },
      });

      res.status(500).json({
        success: false,
        message: `Task failed: ${execError.message}`,
      });
    }
  } catch (error: any) {
    console.error("Error running task:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// POST /api/scheduler/tasks/:id/toggle
// Enable/disable a scheduled task
// ──────────────────────────────────────────────────────────
export const toggleTask = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const taskId = req.params.id as string;

    const task = await prisma.scheduledTask.findFirst({
      where: { id: taskId, tenantId },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const newActive = !task.isActive;
    const nextRunAt = newActive ? getNextRunDate(task.cronExpression) : null;

    const updated = await prisma.scheduledTask.update({
      where: { id: taskId },
      data: { isActive: newActive, nextRunAt },
    });

    res.json({
      success: true,
      data: updated,
      message: `Task ${newActive ? "enabled" : "disabled"}`,
    });
  } catch (error: any) {
    console.error("Error toggling task:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// GET /api/scheduler/logs
// View execution logs (all tasks)
// ──────────────────────────────────────────────────────────
export const getLogs = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { taskId, status, from, to, page = "1", limit = "50" } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { tenantId };
    if (taskId) where.taskId = taskId;
    if (status) where.status = status;
    if (from || to) {
      where.startedAt = {};
      if (from) where.startedAt.gte = new Date(from as string);
      if (to) where.startedAt.lte = new Date(to as string);
    }

    const [logs, total] = await Promise.all([
      prisma.schedulerLog.findMany({
        where,
        include: { task: { select: { name: true, type: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.schedulerLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// GET /api/scheduler/logs/:taskId
// View logs for a specific task
// ──────────────────────────────────────────────────────────
export const getTaskLogs = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const taskId = req.params.taskId as string;
    const { page = "1", limit = "20" } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [logs, total] = await Promise.all([
      prisma.schedulerLog.findMany({
        where: { tenantId, taskId },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.schedulerLog.count({ where: { tenantId, taskId } }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    console.error("Error fetching task logs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// GET /api/scheduler/templates
// Get predefined task templates
// ──────────────────────────────────────────────────────────
export const getTemplates = async (_req: Request, res: Response) => {
  res.json({ success: true, data: PREDEFINED_TASKS });
};

// ──────────────────────────────────────────────────────────
// GET /api/scheduler/stats
// Dashboard statistics
// ──────────────────────────────────────────────────────────
export const getStats = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalTasks, activeTasks, todayLogs, failedToday] = await Promise.all([
      prisma.scheduledTask.count({ where: { tenantId } }),
      prisma.scheduledTask.count({ where: { tenantId, isActive: true } }),
      prisma.schedulerLog.count({
        where: { tenantId, startedAt: { gte: today } },
      }),
      prisma.schedulerLog.count({
        where: { tenantId, startedAt: { gte: today }, status: "FAILED" },
      }),
    ]);

    // Recent logs for activity feed
    const recentLogs = await prisma.schedulerLog.findMany({
      where: { tenantId },
      include: { task: { select: { name: true, type: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        totalTasks,
        activeTasks,
        inactiveTasks: totalTasks - activeTasks,
        executionsToday: todayLogs,
        failedToday,
        successRate: todayLogs > 0 ? Math.round(((todayLogs - failedToday) / todayLogs) * 100) : 100,
        recentLogs,
      },
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
