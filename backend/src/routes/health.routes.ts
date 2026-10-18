import { Router, Request, Response } from "express";
import prisma from "../utils/prisma";
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
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    services: {
      database: "unknown",
      redis: "unknown",
    },
  };

  // Check MongoDB connection
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    healthCheck.services.database = "healthy";
  } catch (error: any) {
    healthCheck.services.database = "unhealthy";
    healthCheck.status = "degraded";
    logger.error("Health check: Database unhealthy", { error: error.message });
  }

  // Check Redis connection (optional)
  try {
    const redis = await getRedisClient();
    if (redis) {
      await redis.ping();
      healthCheck.services.redis = "healthy";
    } else {
      healthCheck.services.redis = "not_configured";
    }
  } catch (error: any) {
    healthCheck.services.redis = "unhealthy";
    // Redis is optional — don't degrade status
    logger.warn("Health check: Redis unhealthy", { error: error.message });
  }

  const statusCode = healthCheck.status === "ok" ? 200 : 503;
  return res.status(statusCode).json(healthCheck);
});

/**
 * Readiness check — lighter weight, just confirms app can serve
 */
router.get("/ready", (req: Request, res: Response) => {
  return res.status(200).json({ ready: true });
});

export default router;
