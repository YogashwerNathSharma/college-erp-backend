import { Request, Response, NextFunction } from "express";

/**
 * Robust input sanitization middleware
 * - Strips HTML tags (nested/encoded)
 * - Removes javascript: / data: URIs
 * - Removes event handler attributes
 * - Trims null bytes
 */
function sanitizeValue(value: any): any {
  if (typeof value === "string") {
    let clean = value;

    // Remove null bytes
    clean = clean.replace(/\0/g, "");

    // Decode common HTML entities to catch encoded payloads
    clean = clean
      .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&#(\d+);?/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));

    // Remove HTML tags (multi-pass for nested tags)
    let prev = "";
    while (prev !== clean) {
      prev = clean;
      clean = clean.replace(/<[^>]*>/g, "");
    }

    // Remove javascript: and data: URIs
    clean = clean.replace(/javascript\s*:/gi, "");
    clean = clean.replace(/data\s*:\s*text\/html/gi, "");
    clean = clean.replace(/vbscript\s*:/gi, "");

    // Remove event handlers (onclick, onerror, onload, etc.)
    clean = clean.replace(/on\w+\s*=\s*["']?[^"']*["']?/gi, "");

    // Remove expression() and url() with javascript
    clean = clean.replace(/expression\s*\(/gi, "");
    clean = clean.replace(/url\s*\(\s*javascript/gi, "");

    return clean.trim();
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
  // Sanitize query params
  if (req.query && typeof req.query === "object") {
    for (const key of Object.keys(req.query)) {
      (req.query as any)[key] = sanitizeValue(req.query[key]);
    }
  }
  // Sanitize params
  if (req.params && typeof req.params === "object") {
    for (const key of Object.keys(req.params)) {
      (req.params as any)[key] = sanitizeValue(req.params[key]);
    }
  }
  next();
};
