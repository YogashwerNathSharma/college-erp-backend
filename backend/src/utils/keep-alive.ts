// ═══════════════════════════════════════════════════════════════════════
// KEEP-ALIVE SERVICE — Prevents Render Free Tier from sleeping
// ═══════════════════════════════════════════════════════════════════════
// Render free tier puts services to sleep after 15 minutes of inactivity.
// This module self-pings the server every 12 minutes to keep it awake.
// Works regardless of user login status — server stays active 24/7.
// ═══════════════════════════════════════════════════════════════════════

import https from "https";
import http from "http";
import logger from "../config/logger";

// ⚡ Ping interval: 12 minutes (well within 15-min sleep threshold)
const PING_INTERVAL_MS = 12 * 60 * 1000; // 12 minutes

// Server URL — auto-detected from environment
const getServerUrl = (): string => {
  // Render automatically sets RENDER_EXTERNAL_URL for web services
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }

  // Fallback: use explicitly set BACKEND_URL
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }

  // Last resort: localhost (for local development)
  const port = process.env.PORT || 5000;
  return `http://localhost:${port}`;
};

let keepAliveInterval: NodeJS.Timeout | null = null;
let pingCount = 0;

/**
 * Self-ping the /api/ready endpoint to prevent sleep
 * Uses native http/https module — works on ALL Node.js versions
 */
const pingServer = () => {
  const url = `${getServerUrl()}/api/ready`;
  const client = url.startsWith("https") ? https : http;

  try {
    const req = client.get(url, { timeout: 10000 }, (res) => {
      pingCount++;
      const status = res.statusCode || 0;

      // Consume response data to free up memory
      res.resume();

      if (status === 200) {
        logger.debug(`🏓 Keep-Alive ping #${pingCount} → OK`);
      } else {
        logger.warn(`🏓 Keep-Alive ping #${pingCount} → HTTP ${status}`);
      }
    });

    req.on("error", (err: any) => {
      pingCount++;
      logger.warn(`🏓 Keep-Alive ping #${pingCount} failed: ${err.message}`);
    });

    req.on("timeout", () => {
      pingCount++;
      req.destroy();
      logger.warn(`🏓 Keep-Alive ping #${pingCount} → Timeout`);
    });
  } catch (error: any) {
    logger.warn(`🏓 Keep-Alive error: ${error.message}`);
  }
};

/**
 * Start the keep-alive system
 * Call once after server starts listening
 */
export const startKeepAlive = () => {
  const serverUrl = getServerUrl();

  // Skip in local development unless explicitly enabled
  if (serverUrl.includes("localhost") && process.env.KEEP_ALIVE !== "true") {
    logger.info("🏓 Keep-Alive: Skipped (local dev — set KEEP_ALIVE=true to enable)");
    return;
  }

  logger.info(`🏓 Keep-Alive: ACTIVE — pinging ${serverUrl}/api/ready every 12 min`);
  logger.info(`🏓 Server will NOT sleep on Render free tier`);

  // First ping after 30 seconds (let server fully initialize)
  setTimeout(() => {
    pingServer();

    // Then every 12 minutes
    keepAliveInterval = setInterval(pingServer, PING_INTERVAL_MS);
  }, 30000);
};

/**
 * Stop the keep-alive system (called during graceful shutdown)
 */
export const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    logger.info("🏓 Keep-Alive: Stopped");
  }
};
