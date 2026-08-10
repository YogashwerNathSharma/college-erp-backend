import helmet from "helmet";
import cors from "cors";
import { Request, Response, NextFunction } from "express";

// Helmet for security headers
const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP for now (frontend serves static)
});

/**
 * Production file exposure guard.
 *
 * /uploads used to be mounted as a public express.static directory. That made
 * tenant documents/photos directly addressable without authentication.
 * Production file access must go through the authenticated /api/files/:id/download
 * endpoint, which verifies tenant ownership before reading from disk.
 *
 * Development keeps the legacy static route temporarily so local workflows do
 * not break while consumers migrate to the private download endpoint.
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === "production" && req.path.startsWith("/uploads")) {
    return res.status(410).json({
      success: false,
      message: "Direct file URLs are disabled. Use the authenticated file download endpoint.",
    });
  }

  return helmetMiddleware(req, res, next);
};

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
