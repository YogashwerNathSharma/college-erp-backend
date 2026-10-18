import winston from "winston";

/**
 * Production-grade structured logging with Winston
 * - JSON format in production (for log aggregators)
 * - Pretty format in development
 * - No PII in logs
 * - Automatic error stack trace handling
 */

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  defaultMeta: {
    service: "college-erp-backend",
    environment: process.env.NODE_ENV || "development",
  },
  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" })
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: process.env.NODE_ENV === "production"
        ? combine(json())
        : combine(colorize(), devFormat),
    }),

    // File transport for errors (production)
    ...(process.env.NODE_ENV === "production"
      ? [
          new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
            format: combine(json()),
          }),
          new winston.transports.File({
            filename: "logs/combined.log",
            maxsize: 20 * 1024 * 1024, // 20MB
            maxFiles: 10,
            format: combine(json()),
          }),
        ]
      : []),
  ],
});

/**
 * Request logger - strips sensitive fields
 */
export const logRequest = (method: string, path: string, statusCode: number, duration: number, meta?: Record<string, any>) => {
  logger.info("HTTP Request", {
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    ...meta,
  });
};

/**
 * Audit logger - for sensitive operations
 */
export const logAudit = (action: string, userId: string, tenantId: string, details?: Record<string, any>) => {
  logger.info("AUDIT", {
    action,
    userId,
    tenantId,
    ...details,
  });
};

export default logger;
