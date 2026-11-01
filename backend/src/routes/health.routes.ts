import { Router, Request, Response } from "express";
import prisma from "../utils/prisma";
import fs from "fs";
import { getRedisClient } from "../config/redis";
import logger from "../config/logger";

const router = Router();

/**
 * Health Check Endpoint
 * Used by Render/load balancers to verify service is healthy
 * 
 * GET /api/health
 * Returns: { status, uptime, timestamp, services: { database, redis } }
 */
router.get("/health", async (req: Request, res: Response) => {
  const healthCheck: any = {
    status: "ok",
    version: "1.0.0",
    uptime: process.uptime(),
    uptimeFormatted: formatUptime(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    services: {
      database: "unknown",
      redis: "unknown",
    },
  };

  // Check MongoDB connection + latency
  try {
    const dbStart = Date.now();
    await prisma.$runCommandRaw({ ping: 1 });
    const dbLatency = Date.now() - dbStart;
    healthCheck.services.database = {
      status: "healthy",
      latency: `${dbLatency}ms`,
    };
  } catch (error: any) {
    healthCheck.services.database = { status: "unhealthy", error: error.message };
    healthCheck.status = "degraded";
    logger.error("Health check: Database unhealthy", { error: error.message });
  }

  // Check Redis connection (optional)
  try {
    const redis = await getRedisClient();
    if (redis) {
      const redisStart = Date.now();
      await redis.ping();
      const redisLatency = Date.now() - redisStart;
      healthCheck.services.redis = { status: "healthy", latency: `${redisLatency}ms` };
    } else {
      healthCheck.services.redis = { status: "not_configured" };
    }
  } catch (error: any) {
    healthCheck.services.redis = { status: "unhealthy", error: error.message };
    // Redis is optional — don't degrade status
    logger.warn("Health check: Redis unhealthy", { error: error.message });
  }

  // Check storage (uploads directory)
  try {
    const uploadDir = process.env.UPLOAD_DIR || "./uploads";
    const exists = fs.existsSync(uploadDir);
    healthCheck.services.storage = {
      status: exists ? "ok" : "missing",
      uploadDir,
    };
  } catch {
    healthCheck.services.storage = { status: "error" };
  }

  // Memory usage
  const memUsage = process.memoryUsage();
  healthCheck.memory = {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
  };

  const statusCode = healthCheck.status === "ok" ? 200 : 503;
  return res.status(statusCode).json(healthCheck);
});

/**
 * Readiness check — lighter weight, just confirms app can serve
 */
router.get("/ready", (req: Request, res: Response) => {
  return res.status(200).json({ ready: true });
});

/**
 * Format uptime seconds into human-readable string
 */
function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}

export default router;
