import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  getSecurityOverview,
  getFirewall,
  createFirewallRule,
  patchFirewallRule,
  removeFirewallRule,
  getRateLimitConfig,
  patchRateLimit,
  getBlockedIPList,
  blockIPAddress,
  unblockIPAddress,
  addWhitelist,
  removeWhitelist,
  getConfig,
  patchConfig,
  getActiveSessions,
  terminateSession,
  terminateAllSessions,
  getAuditLogs,
  getTrustedDevices,
} from "./security.controller";

const router = Router();

// All routes require SUPER_ADMIN
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

// Overview
router.get("/overview", getSecurityOverview);

// Firewall
router.get("/firewall", getFirewall);
router.post("/firewall", createFirewallRule);
router.patch("/firewall/:id", patchFirewallRule);
router.delete("/firewall/:id", removeFirewallRule);

// Rate Limiting
router.get("/rate-limits", getRateLimitConfig);
router.patch("/rate-limits", patchRateLimit);

// IP Management
router.get("/ip", getBlockedIPList);
router.post("/ip/block", blockIPAddress);
router.delete("/ip/block/:ip", unblockIPAddress);
router.post("/ip/whitelist", addWhitelist);
router.delete("/ip/whitelist/:ip", removeWhitelist);

// Security Config (JWT, passwords, 2FA)
router.get("/config", getConfig);
router.patch("/config", patchConfig);

// Sessions
router.get("/sessions", getActiveSessions);
router.delete("/sessions/:id", terminateSession);
router.delete("/sessions", terminateAllSessions);

// Audit Logs
router.get("/audit-logs", getAuditLogs);

// Devices
router.get("/devices", getTrustedDevices);

export default router;
