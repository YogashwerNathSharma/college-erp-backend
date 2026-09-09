// ══════════════════════════════════════════════════════════════════════
// ⚡ P6: REQUEST TIMING MIDDLEWARE
// Logs slow requests (> 500ms) and adds X-Response-Time header
// Safe to add — zero impact on existing logic
// ══════════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from "express";

// Threshold for "slow" request warning (ms)
const SLOW_THRESHOLD_MS = 500;

export function timingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  // Hook into response finish event — only LOG here, don't set headers
  // (headers are already sent by the time 'finish' fires)
  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1_000_000;
    const rounded = Math.round(ms);

    // Log slow requests
    if (ms > SLOW_THRESHOLD_MS) {
      const tenantId = (req as any).tenantId || (req as any).user?.tenantId || "?";
      console.warn(
        `🐢 SLOW: ${req.method} ${req.originalUrl} — ${rounded}ms [tenant: ${tenantId}]`
      );
    }
  });

  // Set X-Response-Time BEFORE response is sent, using the 'close' workaround:
  // We override res.json / res.send to inject the header just-in-time.
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  const injectTiming = () => {
    if (!res.headersSent) {
      const end = process.hrtime.bigint();
      const ms = Math.round(Number(end - start) / 1_000_000);
      res.setHeader("X-Response-Time", `${ms}ms`);
    }
  };

  res.json = function (body: any) {
    injectTiming();
    return originalJson(body);
  } as any;

  res.send = function (body: any) {
    injectTiming();
    return originalSend(body);
  } as any;

  next();
}

export default timingMiddleware;
