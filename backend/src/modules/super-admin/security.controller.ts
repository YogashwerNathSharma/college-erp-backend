import { Request, Response } from "express";
import {
  getSecurityOverviewService,
  getFirewallRules,
  addFirewallRule,
  updateFirewallRule,
  deleteFirewallRule,
  getRateLimits,
  updateRateLimit,
  getBlockedIPs,
  getWhitelistedIPs,
  blockIP,
  unblockIP,
  addWhitelistIP,
  removeWhitelistIP,
  getSecurityConfig,
  updateSecurityConfig,
  getActiveSessionsService,
  forceLogoutSession,
  forceLogoutAll,
  getAuditLogsService,
  getTrustedDevicesService,
} from "./security.service";

//////////////////////////////////////////////////////
// SECURITY OVERVIEW
//////////////////////////////////////////////////////

export const getSecurityOverview = async (req: Request, res: Response) => {
  try {
    const data = await getSecurityOverviewService();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("SECURITY OVERVIEW ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// FIREWALL RULES
//////////////////////////////////////////////////////

export const getFirewall = async (req: Request, res: Response) => {
  try {
    const rules = getFirewallRules();
    return res.status(200).json({ success: true, data: rules });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createFirewallRule = async (req: Request, res: Response) => {
  try {
    const rule = addFirewallRule(req.body);
    return res.status(201).json({ success: true, data: rule });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const patchFirewallRule = async (req: Request, res: Response) => {
  try {
    const rule = updateFirewallRule(req.params.id, req.body);
    return res.status(200).json({ success: true, data: rule });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFirewallRule = async (req: Request, res: Response) => {
  try {
    deleteFirewallRule(req.params.id);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// RATE LIMITING
//////////////////////////////////////////////////////

export const getRateLimitConfig = async (req: Request, res: Response) => {
  try {
    const limits = getRateLimits();
    return res.status(200).json({ success: true, data: limits });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const patchRateLimit = async (req: Request, res: Response) => {
  try {
    const { endpoint, ...config } = req.body;
    const updated = updateRateLimit(endpoint, config);
    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// IP MANAGEMENT
//////////////////////////////////////////////////////

export const getBlockedIPList = async (req: Request, res: Response) => {
  try {
    return res.status(200).json({ success: true, data: { blocked: getBlockedIPs(), whitelisted: getWhitelistedIPs() } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const blockIPAddress = async (req: Request, res: Response) => {
  try {
    const { ip, reason } = req.body;
    const entry = blockIP(ip, reason);
    return res.status(201).json({ success: true, data: entry });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const unblockIPAddress = async (req: Request, res: Response) => {
  try {
    unblockIP(req.params.ip);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addWhitelist = async (req: Request, res: Response) => {
  try {
    const { ip, label } = req.body;
    const entry = addWhitelistIP(ip, label);
    return res.status(201).json({ success: true, data: entry });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeWhitelist = async (req: Request, res: Response) => {
  try {
    removeWhitelistIP(req.params.ip);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// SECURITY CONFIG
//////////////////////////////////////////////////////

export const getConfig = async (req: Request, res: Response) => {
  try {
    return res.status(200).json({ success: true, data: getSecurityConfig() });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const patchConfig = async (req: Request, res: Response) => {
  try {
    const config = updateSecurityConfig(req.body);
    return res.status(200).json({ success: true, data: config });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// SESSIONS
//////////////////////////////////////////////////////

export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await getActiveSessionsService();
    return res.status(200).json({ success: true, data: sessions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const terminateSession = async (req: Request, res: Response) => {
  try {
    const result = forceLogoutSession(req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const terminateAllSessions = async (req: Request, res: Response) => {
  try {
    const result = forceLogoutAll();
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// AUDIT LOGS
//////////////////////////////////////////////////////

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await getAuditLogsService();
    return res.status(200).json({ success: true, data: logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// DEVICES
//////////////////////////////////////////////////////

export const getTrustedDevices = async (req: Request, res: Response) => {
  try {
    const devices = await getTrustedDevicesService();
    return res.status(200).json({ success: true, data: devices });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
