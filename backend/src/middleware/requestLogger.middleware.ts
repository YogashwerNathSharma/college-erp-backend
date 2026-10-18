import { Request, Response, NextFunction } from "express";
import logger, { logRequest } from "../config/logger";

/**
 * HTTP Request Logger Middleware
 * Logs every request with method, path, status, duration
 * Replaces morgan with structured Winston logging
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log when response finishes
  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Skip health check from flooding logs
    if (req.path === "/api/health") return;

    const meta: Record<string, any> = {
      ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
      userAgent: req.headers["user-agent"]?.substring(0, 100),
    };

    // Add user context if authenticated
    if (req.user?.userId) {
      meta.userId = req.user.userId;
      meta.tenantId = req.user.tenantId;
    }

    // Log level based on status code
    if (statusCode >= 500) {
      logger.error("HTTP Request Failed", { method: req.method, path: req.originalUrl, statusCode, duration: `${duration}ms`, ...meta });
    } else if (statusCode >= 400) {
      logger.warn("HTTP Request Error", { method: req.method, path: req.originalUrl, statusCode, duration: `${duration}ms`, ...meta });
    } else {
      logRequest(req.method, req.originalUrl, statusCode, duration, meta);
    }
  });

  next();
};
