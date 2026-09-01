import { CorsOptions } from "cors";
import env from "./env";

/**
 * CORS configuration
 * Supports multiple origins from comma-separated CORS_ORIGIN env var
 * 
 * SECURITY: No-origin requests (Postman, mobile, curl) are only allowed
 * in development. In production, origin must be in the whitelist.
 */
const getAllowedOrigins = (): string[] => {
  const origins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
  return origins;
};

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // In production, reject requests with no origin (prevents CSRF via non-browser clients)
    if (!origin) {
      if (env.NODE_ENV === "production") {
        return callback(new Error("Origin required in production"));
      }
      // Allow no-origin in development (Postman, mobile apps, etc.)
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: env.CORS_CREDENTIALS === "true",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Tenant-ID",
    "X-Academic-Year-Id",
    "X-Device-Fingerprint",
  ],
  exposedHeaders: ["Content-Disposition", "X-Total-Count"],
  maxAge: 86400, // 24 hours preflight cache
};

export default corsOptions;
