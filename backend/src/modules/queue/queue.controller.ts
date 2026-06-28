import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import queueService from "./queue.service";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════
// QUEUE CONTROLLER
// REST API for queue management and monitoring
// ══════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────
// GET /api/queue/status
// Queue stats dashboard
// ──────────────────────────────────────────────────────────
export const getStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const stats = await queueService.getQueueStatus(tenantId);

    // Get recent activity
    const recentCompleted = await prisma.queueJob.findMany({
      where: { tenantId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 5,
      select: { id: true, type: true, completedAt: true, priority: true },
    });

    const recentFailed = await prisma.queueJob.findMany({
      where: { tenantId, status: "FAILED" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, type: true, lastError: true, attempts: true, updatedAt: true },
    });

    res.json({
      success: true,
      data: {
        ...stats,
        recentCompleted,
        recentFailed,
      },
    });
  } catch (error: any) {
    console.error("Error getting queue status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// GET /api/queue/jobs
// List jobs with filters
// ──────────────────────────────────────────────────────────
export const listJobs = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { type, status, priority, page = "1", limit = "30" } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { tenantId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [jobs, total] = await Promise.all([
      prisma.queueJob.findMany({
        where,
        orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
        skip,
        take,
      }),
      prisma.queueJob.count({ where }),
    ]);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    console.error("Error listing jobs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// POST /api/queue/add
// Add a job to the queue (admin manual)
// ──────────────────────────────────────────────────────────
export const addJob = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { type, payload, priority = "NORMAL", maxAttempts = 3 } = req.body;

    if (!type || !payload) {
      return res.status(400).json({
        success: false,
        message: "type and payload are required",
      });
    }

    const validTypes = ["SMS", "EMAIL", "PDF_GENERATION", "BACKUP", "BULK_OPERATION", "REPORT"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Supported: ${validTypes.join(", ")}`,
      });
    }

    const job = await queueService.addToQueue(tenantId, type, payload, priority, maxAttempts);

    res.status(201).json({
      success: true,
      data: job,
      message: "Job added to queue",
    });
  } catch (error: any) {
    console.error("Error adding job:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// POST /api/queue/retry/:id
// Retry a failed job
// ──────────────────────────────────────────────────────────
export const retryJob = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const jobId = req.params.id as string;

    const job = await prisma.queueJob.findFirst({
      where: { id: jobId, tenantId, status: "FAILED" },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or not in FAILED state",
      });
    }

    await prisma.queueJob.update({
      where: { id: jobId },
      data: {
        status: "RETRYING",
        lastError: null,
      },
    });

    // Trigger processing
    setImmediate(() => queueService.processQueue(tenantId));

    res.json({ success: true, message: "Job queued for retry" });
  } catch (error: any) {
    console.error("Error retrying job:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// POST /api/queue/retry-all
// Retry all failed jobs
// ──────────────────────────────────────────────────────────
export const retryAllFailed = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;

    const result = await prisma.queueJob.updateMany({
      where: { tenantId, status: "FAILED" },
      data: { status: "RETRYING", lastError: null },
    });

    // Trigger processing
    setImmediate(() => queueService.processQueue(tenantId));

    res.json({
      success: true,
      message: `${result.count} jobs queued for retry`,
      data: { count: result.count },
    });
  } catch (error: any) {
    console.error("Error retrying all:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// DELETE /api/queue/jobs/:id
// Cancel a queued job
// ──────────────────────────────────────────────────────────
export const cancelJob = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const jobId = req.params.id as string;

    const job = await prisma.queueJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (job.status === "PROCESSING") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a job that is currently processing",
      });
    }

    if (job.status === "COMPLETED") {
      // Delete completed jobs
      await prisma.queueJob.delete({ where: { id: jobId } });
      return res.json({ success: true, message: "Job deleted" });
    }

    // Cancel queued/retrying/failed jobs
    await prisma.queueJob.delete({ where: { id: jobId } });
    res.json({ success: true, message: "Job cancelled and removed" });
  } catch (error: any) {
    console.error("Error cancelling job:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// PUT /api/queue/config
// Update queue configuration
// ──────────────────────────────────────────────────────────
export const updateConfig = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { type, maxConcurrent, retryDelay, maxRetries, isActive } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, message: "type is required" });
    }

    const config = await prisma.queueConfig.upsert({
      where: { tenantId_type: { tenantId, type } },
      create: {
        tenantId,
        type,
        maxConcurrent: maxConcurrent || 5,
        retryDelay: retryDelay || 60000,
        maxRetries: maxRetries || 3,
        isActive: isActive !== false,
      },
      update: {
        ...(maxConcurrent !== undefined && { maxConcurrent }),
        ...(retryDelay !== undefined && { retryDelay }),
        ...(maxRetries !== undefined && { maxRetries }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ success: true, data: config });
  } catch (error: any) {
    console.error("Error updating config:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// GET /api/queue/config
// Get queue configurations
// ──────────────────────────────────────────────────────────
export const getConfig = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;

    const configs = await prisma.queueConfig.findMany({
      where: { tenantId },
    });

    // Default configs for types without custom config
    const allTypes = ["SMS", "EMAIL", "PDF_GENERATION", "BACKUP", "BULK_OPERATION", "REPORT"];
    const configMap = configs.reduce((map, c) => ({ ...map, [c.type]: c }), {} as Record<string, any>);

    const fullConfigs = allTypes.map((type) => ({
      type,
      maxConcurrent: configMap[type]?.maxConcurrent || 5,
      retryDelay: configMap[type]?.retryDelay || 60000,
      maxRetries: configMap[type]?.maxRetries || 3,
      isActive: configMap[type]?.isActive ?? true,
      id: configMap[type]?.id || null,
    }));

    res.json({ success: true, data: fullConfigs });
  } catch (error: any) {
    console.error("Error getting config:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// POST /api/queue/process
// Manually trigger queue processing
// ──────────────────────────────────────────────────────────
export const triggerProcessing = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    queueService.processQueue(tenantId);
    res.json({ success: true, message: "Queue processing triggered" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// POST /api/queue/cleanup
// Clean old completed jobs
// ──────────────────────────────────────────────────────────
export const cleanup = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { olderThanDays = 30 } = req.body;

    const count = await queueService.cleanupOldJobs(tenantId, olderThanDays);
    res.json({
      success: true,
      message: `Cleaned up ${count} old completed jobs`,
      data: { deletedCount: count },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
