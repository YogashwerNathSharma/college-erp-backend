import helmet from "helmet";
import cors from "cors";

// Helmet for security headers
export const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP for now (frontend serves static)
});

// Production CORS config
export const corsConfig = cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5174",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Device-Fingerprint"],
});
