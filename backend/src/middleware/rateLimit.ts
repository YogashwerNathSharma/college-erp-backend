import rateLimit from "express-rate-limit";

// General API limiter
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for auth routes (login, register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload limiter — prevent abuse of upload endpoints
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many file uploads, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  // Only count requests with Content-Type multipart/form-data
  skip: (req) => !req.headers["content-type"]?.includes("multipart/form-data"),
});
