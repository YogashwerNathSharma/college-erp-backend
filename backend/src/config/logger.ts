import winston from "winston";

/**
 * Production-grade structured logging with Winston
 * - JSON format in production (for log aggregators)
 * - Pretty format in development
 * - No PII in logs
 * - Automatic error stack trace handling
 */

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

// ═══ Sensitive data masking ═══
const SENSITIVE_KEYS = /^(password|token|secret|authorization|cookie|otp|resetOtp|aadhar|aadhaar|ssn|creditCard|cvv|pin|refreshToken|accessToken)$/i;
const SENSITIVE_PATTERNS = [
  { regex: /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/g, replacement: "Bearer [REDACTED]" },
  { regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: "[CARD_REDACTED]" },
  { regex: /\b\d{12}\b/g, replacement: "[AADHAR_REDACTED]" },
];

function maskSensitive(obj: any, depth = 0): any {
  if (depth > 5 || obj == null) return obj;
  if (typeof obj === "string") {
    let masked = obj;
    for (const { regex, replacement } of SENSITIVE_PATTERNS) {
      masked = masked.replace(regex, replacement);
    }
    return masked;
  }
  if (Array.isArray(obj)) return obj.map((v) => maskSensitive(v, depth + 1));
  if (typeof obj === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = SENSITIVE_KEYS.test(key) ? "[REDACTED]" : maskSensitive(value, depth + 1);
    }
    return result;
  }
  return obj;
}

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
    winston.format((info) => maskSensitive(info))(),
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
