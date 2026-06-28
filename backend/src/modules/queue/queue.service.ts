import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════
// QUEUE SERVICE
// Simple in-memory queue with DB persistence
// Processes jobs in priority order with retry logic
// ══════════════════════════════════════════════════════════

// Priority weights (higher = processed first)
const PRIORITY_WEIGHTS: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
};

// Job handlers registry
type JobHandler = (payload: any, tenantId: string) => Promise<any>;
const handlers: Record<string, JobHandler> = {};

// ──────────────────────────────────────────────────────────
// Register a handler for a job type
// ──────────────────────────────────────────────────────────
export function registerHandler(type: string, handler: JobHandler): void {
  handlers[type] = handler;
}

// ──────────────────────────────────────────────────────────
// Add a job to the queue
// ──────────────────────────────────────────────────────────
export async function addToQueue(
  tenantId: string,
  type: string,
  payload: any,
  priority: string = "NORMAL",
  maxAttempts: number = 3
): Promise<any> {
  const job = await prisma.queueJob.create({
    data: {
      tenantId,
      type,
      payload,
      priority,
      maxAttempts,
      status: "QUEUED",
    },
  });

  // Trigger processing asynchronously
  setImmediate(() => processNextJob(tenantId, type));

  return job;
}

// ──────────────────────────────────────────────────────────
// Process the next available job for a given type
// ──────────────────────────────────────────────────────────
async function processNextJob(tenantId: string, type?: string): Promise<void> {
  try {
    // Check concurrency limits
    const config = type
      ? await prisma.queueConfig.findFirst({
          where: { tenantId, type, isActive: true },
        })
      : null;

    const maxConcurrent = config?.maxConcurrent || 5;

    // Count currently processing jobs
    const processingCount = await prisma.queueJob.count({
      where: {
        tenantId,
        status: "PROCESSING",
        ...(type ? { type } : {}),
      },
    });

    if (processingCount >= maxConcurrent) {
      return; // At capacity, wait
    }

    // Find next job (highest priority first, oldest first)
    const where: any = {
      tenantId,
      status: { in: ["QUEUED", "RETRYING"] },
    };
    if (type) where.type = type;

    const nextJob = await prisma.queueJob.findFirst({
      where,
      orderBy: [
        { priority: "desc" }, // CRITICAL > HIGH > NORMAL > LOW
        { createdAt: "asc" }, // FIFO within same priority
      ],
    });

    if (!nextJob) return; // No jobs to process

    // Mark as processing
    await prisma.queueJob.update({
      where: { id: nextJob.id },
      data: {
        status: "PROCESSING",
        processedAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    // Get handler
    const handler = handlers[nextJob.type];
    if (!handler) {
      await prisma.queueJob.update({
        where: { id: nextJob.id },
        data: {
          status: "FAILED",
          lastError: `No handler registered for type: ${nextJob.type}`,
          completedAt: new Date(),
        },
      });
      return;
    }

    // Execute handler
    try {
      const result = await handler(nextJob.payload, nextJob.tenantId);

      await prisma.queueJob.update({
        where: { id: nextJob.id },
        data: {
          status: "COMPLETED",
          result: result || null,
          completedAt: new Date(),
          lastError: null,
        },
      });
    } catch (error: any) {
      const currentAttempts = nextJob.attempts + 1;
      const shouldRetry = currentAttempts < nextJob.maxAttempts;

      await prisma.queueJob.update({
        where: { id: nextJob.id },
        data: {
          status: shouldRetry ? "RETRYING" : "FAILED",
          lastError: error.message || "Unknown error",
          completedAt: shouldRetry ? undefined : new Date(),
        },
      });

      // Schedule retry with delay
      if (shouldRetry) {
        const retryDelay = config?.retryDelay || 60000; // Default 1 minute
        setTimeout(() => processNextJob(tenantId, nextJob.type), retryDelay);
      }
    }

    // Process next job in queue
    setImmediate(() => processNextJob(tenantId, type));
  } catch (error: any) {
    console.error("Queue processing error:", error.message);
  }
}

// ──────────────────────────────────────────────────────────
// Process all queued jobs (startup / manual trigger)
// ──────────────────────────────────────────────────────────
export async function processQueue(tenantId: string): Promise<void> {
  const types = await prisma.queueJob.findMany({
    where: { tenantId, status: { in: ["QUEUED", "RETRYING"] } },
    distinct: ["type"],
    select: { type: true },
  });

  for (const { type } of types) {
    processNextJob(tenantId, type);
  }
}

// ──────────────────────────────────────────────────────────
// Retry all failed jobs
// ──────────────────────────────────────────────────────────
export async function retryFailed(tenantId: string): Promise<number> {
  const result = await prisma.queueJob.updateMany({
    where: {
      tenantId,
      status: "FAILED",
      attempts: { lt: prisma.queueJob.fields?.maxAttempts as any || 3 },
    },
    data: {
      status: "RETRYING",
    },
  });

  // Trigger processing
  setImmediate(() => processQueue(tenantId));

  return result.count;
}

// ──────────────────────────────────────────────────────────
// Get queue statistics
// ──────────────────────────────────────────────────────────
export async function getQueueStatus(tenantId: string): Promise<any> {
  const [queued, processing, completed, failed, retrying] = await Promise.all([
    prisma.queueJob.count({ where: { tenantId, status: "QUEUED" } }),
    prisma.queueJob.count({ where: { tenantId, status: "PROCESSING" } }),
    prisma.queueJob.count({ where: { tenantId, status: "COMPLETED" } }),
    prisma.queueJob.count({ where: { tenantId, status: "FAILED" } }),
    prisma.queueJob.count({ where: { tenantId, status: "RETRYING" } }),
  ]);

  // Stats by type
  const byType = await prisma.queueJob.groupBy({
    by: ["type", "status"],
    where: { tenantId },
    _count: true,
  });

  const typeStats: Record<string, Record<string, number>> = {};
  for (const item of byType) {
    if (!typeStats[item.type]) typeStats[item.type] = {};
    typeStats[item.type][item.status] = item._count;
  }

  return {
    total: queued + processing + completed + failed + retrying,
    queued,
    processing,
    completed,
    failed,
    retrying,
    byType: typeStats,
  };
}

// ──────────────────────────────────────────────────────────
// Clean up old completed jobs (retention)
// ──────────────────────────────────────────────────────────
export async function cleanupOldJobs(tenantId: string, olderThanDays: number = 30): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const result = await prisma.queueJob.deleteMany({
    where: {
      tenantId,
      status: "COMPLETED",
      completedAt: { lt: cutoff },
    },
  });

  return result.count;
}

// ──────────────────────────────────────────────────────────
// Register default handlers (examples)
// ──────────────────────────────────────────────────────────
registerHandler("SMS", async (payload) => {
  // In production: integrate with SMS provider (e.g., Twilio, MSG91)
  console.log(`[Queue] Sending SMS to ${payload.phone}: ${payload.message}`);
  await new Promise((r) => setTimeout(r, 500)); // Simulate API call
  return { delivered: true, messageId: `sms_${Date.now()}` };
});

registerHandler("EMAIL", async (payload) => {
  // In production: integrate with email service (e.g., SendGrid, AWS SES)
  console.log(`[Queue] Sending email to ${payload.to}: ${payload.subject}`);
  await new Promise((r) => setTimeout(r, 800));
  return { delivered: true, messageId: `email_${Date.now()}` };
});

registerHandler("PDF_GENERATION", async (payload) => {
  // In production: use puppeteer or pdfkit to generate PDF
  console.log(`[Queue] Generating PDF: ${payload.type} for ${payload.entityId}`);
  await new Promise((r) => setTimeout(r, 2000));
  return { fileUrl: `/uploads/generated/${Date.now()}.pdf` };
});

registerHandler("BACKUP", async (payload) => {
  // In production: mongodump or prisma-level backup
  console.log(`[Queue] Creating backup: ${payload.type}`);
  await new Promise((r) => setTimeout(r, 5000));
  return { fileUrl: `/backups/backup_${Date.now()}.gz`, size: "150MB" };
});

registerHandler("BULK_OPERATION", async (payload) => {
  console.log(`[Queue] Bulk operation: ${payload.operation} on ${payload.count} items`);
  await new Promise((r) => setTimeout(r, 3000));
  return { processed: payload.count, success: payload.count };
});

registerHandler("REPORT", async (payload) => {
  console.log(`[Queue] Generating report: ${payload.reportType}`);
  await new Promise((r) => setTimeout(r, 4000));
  return { fileUrl: `/reports/report_${Date.now()}.xlsx` };
});

export default {
  addToQueue,
  processQueue,
  retryFailed,
  getQueueStatus,
  cleanupOldJobs,
  registerHandler,
};
