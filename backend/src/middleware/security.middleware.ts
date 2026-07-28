import helmet from "helmet";
import cors from "cors";

// Helmet for security headers
export const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP for now (frontend serves static)
});

// Production CORS config
export const corsConfig = cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
    : [
        "http://localhost:5174",
        "http://localhost:5173",
        "http://localhost:3000",
        "https://college-erp-frontend.onrender.com",
      ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Device-Fingerprint"],
});
