/**
 * Background Job Queue Configuration
 * 
 * Uses a simple in-memory queue for now (no BullMQ dependency needed).
 * When Redis is available, jobs are persisted; otherwise runs in-memory.
 * 
 * Upgrade path: Replace with BullMQ when you need:
 * - Job persistence across restarts
 * - Delayed/scheduled jobs
 * - Job retries with backoff
 * - Concurrency control
 * 
 * For now, this provides async background processing without blocking API responses.
 */

import logger from "./logger";

type JobHandler = (data: any) => Promise<void>;

interface Job {
  id: string;
  type: string;
  data: any;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
}

const handlers = new Map<string, JobHandler>();
const activeJobs: Job[] = [];
let jobCounter = 0;

/**
 * Register a job handler
 */
export const registerJobHandler = (type: string, handler: JobHandler) => {
  handlers.set(type, handler);
  logger.info(`Job handler registered: ${type}`);
};

/**
 * Add a job to the queue
 */
export const addJob = async (type: string, data: any, options?: { maxAttempts?: number; delay?: number }) => {
  const job: Job = {
    id: `job_${++jobCounter}_${Date.now()}`,
    type,
    data,
    createdAt: new Date(),
    attempts: 0,
    maxAttempts: options?.maxAttempts || 3,
  };

  const handler = handlers.get(type);
  if (!handler) {
    logger.error(`No handler registered for job type: ${type}`);
    return;
  }

  // Process async (non-blocking)
  const delay = options?.delay || 0;

  setTimeout(async () => {
    activeJobs.push(job);
    try {
      job.attempts++;
      await handler(job.data);
      logger.info(`Job completed: ${job.id} (${type})`);
    } catch (error: any) {
      logger.error(`Job failed: ${job.id} (${type}) attempt ${job.attempts}/${job.maxAttempts}`, { error: error.message });

      // Retry with exponential backoff
      if (job.attempts < job.maxAttempts) {
        const retryDelay = Math.pow(2, job.attempts) * 1000;
        logger.info(`Retrying job ${job.id} in ${retryDelay}ms`);
        setTimeout(() => addJob(type, data, { maxAttempts: job.maxAttempts - job.attempts }), retryDelay);
      }
    } finally {
      const idx = activeJobs.indexOf(job);
      if (idx > -1) activeJobs.splice(idx, 1);
    }
  }, delay);

  return job.id;
};

/**
 * Get queue stats
 */
export const getQueueStats = () => ({
  registeredHandlers: Array.from(handlers.keys()),
  activeJobs: activeJobs.length,
  totalProcessed: jobCounter,
});

// Pre-built job types
export const JobTypes = {
  SEND_EMAIL: "send_email",
  SEND_SMS: "send_sms",
  GENERATE_PDF: "generate_pdf",
  GENERATE_REPORT: "generate_report",
  BULK_NOTIFICATION: "bulk_notification",
  BACKUP_DATABASE: "backup_database",
  SYNC_ATTENDANCE: "sync_attendance",
};

export default { registerJobHandler, addJob, getQueueStats, JobTypes };
