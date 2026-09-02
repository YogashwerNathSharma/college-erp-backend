import helmet from "helmet";
import cors from "cors";

// Helmet for security headers (with CSP enabled)
export const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", process.env.CORS_ORIGIN || "http://localhost:3000"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

// Production CORS config.
// Render may assign a different *.onrender.com hostname to the frontend,
// so keep explicit CORS_ORIGIN support while safely allowing Render origins.
const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
  : [
      "http://localhost:5174",
      "http://localhost:5173",
      "http://localhost:3000",
    ];

export const corsConfig = cors({
  origin: (origin, callback) => {
    // Non-browser/server-to-server requests have no Origin header.
    if (!origin) return callback(null, true);

    const isConfigured = configuredOrigins.includes(origin);
    const isRenderOrigin = /^https:\/\/([a-z0-9-]+)\.onrender\.com$/i.test(origin);

    if (isConfigured || isRenderOrigin) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Device-Fingerprint", "X-Tenant-ID", "X-Academic-Year-Id"],
});
