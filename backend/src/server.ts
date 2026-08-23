import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import prisma from "./utils/prisma";
import logger from "./config/logger";
import { initializeBackupSchedules } from "./modules/backup/backup.service";
import { startKeepAlive, stopKeepAlive } from "./utils/keep-alive";

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  logger.info(`🚀 Server running on port ${PORT}`, { port: PORT, env: process.env.NODE_ENV });
  
  // Warm up Prisma/MongoDB connection pool
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    logger.info("✅ MongoDB connection warmed up");
  } catch (err) {
    logger.warn("⚠️ MongoDB warmup failed", { error: (err as any)?.message });
  }

  // Initialize backup cron jobs (non-blocking)
  try {
    await initializeBackupSchedules();
  } catch (error) {
    logger.warn("[Backup] Scheduler init skipped", { error: (error as any)?.message });
  }

  // ⚡ Keep-Alive: Self-ping every 12 minutes to prevent Render free tier sleep
  startKeepAlive();
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  
  stopKeepAlive();
  try {
    await prisma.$disconnect();
    logger.info("Database disconnected");
  } catch (err) {
    logger.error("Error during shutdown", { error: (err as any)?.message });
  }

  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Catch unhandled errors
process.on("unhandledRejection", (reason: any) => {
  logger.error("Unhandled Promise Rejection", { reason: reason?.message || reason });
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception", { error: error.message, stack: error.stack });
  process.exit(1);
});
