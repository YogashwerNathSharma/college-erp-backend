import { Request, Response, NextFunction } from "express";

// Basic XSS sanitization - strips HTML tags from string values
function sanitizeValue(value: any): any {
  if (typeof value === "string") {
    return value.replace(/<[^>]*>/g, "").trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === "object") {
    const sanitized: any = {};
    for (const key of Object.keys(value)) {
      sanitized[key] = sanitizeValue(value[key]);
    }
    return sanitized;
  }
  return value;
}

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  // Sanitize query params individually (req.query is read-only in Express 5)
  if (req.query && typeof req.query === "object") {
    for (const key of Object.keys(req.query)) {
      (req.query as any)[key] = sanitizeValue(req.query[key]);
    }
  }
  // Sanitize params individually (req.params is read-only in Express 5)
  if (req.params && typeof req.params === "object") {
    for (const key of Object.keys(req.params)) {
      (req.params as any)[key] = sanitizeValue(req.params[key]);
    }
  }
  next();
};
