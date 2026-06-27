import { CorsOptions } from "cors";
import env from "./env";

/**
 * CORS configuration
 * Supports multiple origins from comma-separated CORS_ORIGIN env var
 */
const getAllowedOrigins = (): string[] => {
  const origins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
  return origins;
};

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
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
    "X-Custom-Header",
  ],
  exposedHeaders: ["Content-Disposition", "X-Total-Count"],
  maxAge: 86400, // 24 hours preflight cache
};

export default corsOptions;
