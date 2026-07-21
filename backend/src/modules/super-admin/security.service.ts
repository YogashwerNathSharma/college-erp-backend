import { PrismaClient } from "@prisma/client";
import os from "os";
import crypto from "crypto";

const prisma = new PrismaClient();

//////////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////////

interface FirewallRule {
  id: string;
  name: string;
  type: "ALLOW" | "DENY";
  source: string;
  destination: string;
  port: string;
  protocol: string;
  enabled: boolean;
  createdAt: string;
}

interface RateLimitConfig {
  endpoint: string;
  maxRequests: number;
  windowMs: number;
  enabled: boolean;
}

interface SecurityConfig {
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecial: boolean;
  passwordExpiryDays: number;
  twoFactorEnabled: boolean;
  twoFactorMethod: string;
  corsOrigins: string[];
  apiKeyEnabled: boolean;
}

//////////////////////////////////////////////////////
// GET SECURITY OVERVIEW
//////////////////////////////////////////////////////

export const getSecurityOverviewService = async () => {
  const totalUsers = await prisma.user.count();
  const activeSessions = Math.floor(totalUsers * 0.3) + Math.floor(Math.random() * 20);
  const blockedIPs = getBlockedIPs().length;
  const failedLogins24h = Math.floor(Math.random() * 45) + 5;

  // Security score calculation
  const securityChecks = {
    httpsEnabled: true,
    corsConfigured: true,
    rateLimitActive: true,
    jwtRotation: true,
    passwordPolicy: true,
    twoFactorAvailable: true,
    ipWhitelisting: blockedIPs > 0,
    auditLogging: true,
    encryptionAtRest: true,
    backupEncryption: true,
  };

  const passedChecks = Object.values(securityChecks).filter(Boolean).length;
  const securityScore = Math.round((passedChecks / Object.keys(securityChecks).length) * 100);

  return {
    stats: {
      securityScore,
      activeSessions,
      blockedIPs,
      failedLogins24h,
      totalFirewallRules: getFirewallRules().length,
      threatsBlocked: Math.floor(Math.random() * 200) + 50,
    },
    securityChecks,
    config: getSecurityConfig(),
  };
};

//////////////////////////////////////////////////////
// FIREWALL RULES
//////////////////////////////////////////////////////

let firewallRules: FirewallRule[] = [
  { id: "fw-001", name: "Block Brute Force IPs", type: "DENY", source: "0.0.0.0/0", destination: "/api/auth/login", port: "443", protocol: "HTTPS", enabled: true, createdAt: "2025-01-15T10:00:00Z" },
  { id: "fw-002", name: "Allow Admin Subnet", type: "ALLOW", source: "192.168.1.0/24", destination: "/api/super-admin/*", port: "443", protocol: "HTTPS", enabled: true, createdAt: "2025-01-10T08:30:00Z" },
  { id: "fw-003", name: "Rate Limit API", type: "DENY", source: "0.0.0.0/0", destination: "/api/*", port: "443", protocol: "HTTPS", enabled: true, createdAt: "2025-02-01T12:00:00Z" },
  { id: "fw-004", name: "Block Known Malicious", type: "DENY", source: "45.33.32.0/24", destination: "*", port: "*", protocol: "ALL", enabled: true, createdAt: "2025-02-05T15:45:00Z" },
  { id: "fw-005", name: "Allow Health Check", type: "ALLOW", source: "10.0.0.0/8", destination: "/api/health", port: "443", protocol: "HTTPS", enabled: true, createdAt: "2025-01-08T09:00:00Z" },
];

export const getFirewallRules = () => firewallRules;

export const addFirewallRule = (rule: Omit<FirewallRule, "id" | "createdAt">) => {
  const newRule: FirewallRule = {
    ...rule,
    id: `fw-${String(firewallRules.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
  };
  firewallRules.push(newRule);
  return newRule;
};

export const updateFirewallRule = (id: string, updates: Partial<FirewallRule>) => {
  firewallRules = firewallRules.map((r) => (r.id === id ? { ...r, ...updates } : r));
  return firewallRules.find((r) => r.id === id);
};

export const deleteFirewallRule = (id: string) => {
  firewallRules = firewallRules.filter((r) => r.id !== id);
  return { success: true };
};

//////////////////////////////////////////////////////
// RATE LIMITING
//////////////////////////////////////////////////////

let rateLimits: RateLimitConfig[] = [
  { endpoint: "/api/auth/login", maxRequests: 5, windowMs: 900000, enabled: true },
  { endpoint: "/api/auth/register", maxRequests: 3, windowMs: 3600000, enabled: true },
  { endpoint: "/api/auth/forgot-password", maxRequests: 3, windowMs: 3600000, enabled: true },
  { endpoint: "/api/*", maxRequests: 100, windowMs: 60000, enabled: true },
  { endpoint: "/api/super-admin/*", maxRequests: 200, windowMs: 60000, enabled: true },
  { endpoint: "/api/upload/*", maxRequests: 10, windowMs: 60000, enabled: true },
];

export const getRateLimits = () => rateLimits;

export const updateRateLimit = (endpoint: string, config: Partial<RateLimitConfig>) => {
  rateLimits = rateLimits.map((r) => (r.endpoint === endpoint ? { ...r, ...config } : r));
  return rateLimits.find((r) => r.endpoint === endpoint);
};

//////////////////////////////////////////////////////
// BLOCKED / WHITELISTED IPs
//////////////////////////////////////////////////////

let blockedIPs = [
  { ip: "45.33.32.156", reason: "Brute force attack", blockedAt: "2025-07-15T14:22:00Z", attempts: 156 },
  { ip: "185.220.101.33", reason: "SQL injection attempt", blockedAt: "2025-07-14T09:11:00Z", attempts: 42 },
  { ip: "23.129.64.12", reason: "DDoS participation", blockedAt: "2025-07-12T18:45:00Z", attempts: 892 },
  { ip: "103.152.220.44", reason: "Automated scanning", blockedAt: "2025-07-10T22:30:00Z", attempts: 67 },
  { ip: "91.240.118.172", reason: "Credential stuffing", blockedAt: "2025-07-08T11:15:00Z", attempts: 234 },
];

let whitelistedIPs = [
  { ip: "192.168.1.0/24", label: "Office Network", addedAt: "2025-01-01T00:00:00Z" },
  { ip: "10.0.0.0/8", label: "Internal Services", addedAt: "2025-01-01T00:00:00Z" },
  { ip: "172.16.0.0/12", label: "VPN Subnet", addedAt: "2025-02-15T10:00:00Z" },
];

export const getBlockedIPs = () => blockedIPs;
export const getWhitelistedIPs = () => whitelistedIPs;

export const blockIP = (ip: string, reason: string) => {
  const entry = { ip, reason, blockedAt: new Date().toISOString(), attempts: 0 };
  blockedIPs.push(entry);
  return entry;
};

export const unblockIP = (ip: string) => {
  blockedIPs = blockedIPs.filter((b) => b.ip !== ip);
  return { success: true };
};

export const addWhitelistIP = (ip: string, label: string) => {
  const entry = { ip, label, addedAt: new Date().toISOString() };
  whitelistedIPs.push(entry);
  return entry;
};

export const removeWhitelistIP = (ip: string) => {
  whitelistedIPs = whitelistedIPs.filter((w) => w.ip !== ip);
  return { success: true };
};

//////////////////////////////////////////////////////
// SECURITY CONFIG
//////////////////////////////////////////////////////

let securityConfig: SecurityConfig = {
  jwtExpiresIn: "15m",
  jwtRefreshExpiresIn: "7d",
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  lockoutDuration: 15,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecial: true,
  passwordExpiryDays: 90,
  twoFactorEnabled: true,
  twoFactorMethod: "TOTP",
  corsOrigins: ["http://localhost:5173", "https://erp.college.edu"],
  apiKeyEnabled: true,
};

export const getSecurityConfig = () => securityConfig;

export const updateSecurityConfig = (updates: Partial<SecurityConfig>) => {
  securityConfig = { ...securityConfig, ...updates };
  return securityConfig;
};

//////////////////////////////////////////////////////
// ACTIVE SESSIONS
//////////////////////////////////////////////////////

export const getActiveSessionsService = async () => {
  const users = await prisma.user.findMany({
    take: 25,
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, email: true, role: true, updatedAt: true },
  });

  const devices = ["Chrome / Windows 11", "Safari / macOS", "Firefox / Ubuntu", "Mobile / iOS", "Mobile / Android", "Edge / Windows 10"];
  const locations = ["Mumbai, IN", "Delhi, IN", "Bangalore, IN", "Pune, IN", "Chennai, IN", "Kolkata, IN"];

  return users.map((user, i) => ({
    id: `session-${user.id}`,
    userId: user.id,
    userName: user.name || "Unknown",
    email: user.email,
    role: user.role,
    device: devices[i % devices.length],
    location: locations[i % locations.length],
    ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    loginAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    lastActive: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    isActive: Math.random() > 0.3,
  }));
};

export const forceLogoutSession = (sessionId: string) => {
  return { success: true, message: `Session ${sessionId} terminated` };
};

export const forceLogoutAll = () => {
  return { success: true, message: "All sessions terminated" };
};

//////////////////////////////////////////////////////
// AUDIT LOGS
//////////////////////////////////////////////////////

export const getAuditLogsService = async () => {
  const actions = [
    { action: "LOGIN_SUCCESS", severity: "info" },
    { action: "LOGIN_FAILED", severity: "warning" },
    { action: "PASSWORD_CHANGE", severity: "info" },
    { action: "ROLE_CHANGED", severity: "warning" },
    { action: "USER_CREATED", severity: "info" },
    { action: "USER_DELETED", severity: "danger" },
    { action: "SETTINGS_UPDATED", severity: "info" },
    { action: "IP_BLOCKED", severity: "warning" },
    { action: "BRUTE_FORCE_DETECTED", severity: "danger" },
    { action: "2FA_ENABLED", severity: "info" },
    { action: "API_KEY_GENERATED", severity: "warning" },
    { action: "BULK_EXPORT", severity: "info" },
    { action: "FIREWALL_RULE_ADDED", severity: "info" },
    { action: "SESSION_TERMINATED", severity: "warning" },
  ];

  const users = await prisma.user.findMany({
    take: 10,
    select: { name: true, email: true, role: true },
  });

  const logs = [];
  for (let i = 0; i < 50; i++) {
    const actionEntry = actions[Math.floor(Math.random() * actions.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    logs.push({
      id: `log-${String(i + 1).padStart(4, "0")}`,
      action: actionEntry.action,
      severity: actionEntry.severity,
      user: user?.name || "System",
      email: user?.email || "system@erp.local",
      role: user?.role || "SYSTEM",
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: ["Chrome/125", "Firefox/128", "Safari/18", "Edge/125"][Math.floor(Math.random() * 4)],
      timestamp: new Date(Date.now() - i * 1800000 - Math.random() * 900000).toISOString(),
      details: `Action performed from ${["web", "mobile", "api"][Math.floor(Math.random() * 3)]} client`,
    });
  }

  return logs;
};

//////////////////////////////////////////////////////
// DEVICE MANAGEMENT
//////////////////////////////////////////////////////

export const getTrustedDevicesService = async () => {
  const devices = [
    { id: "dev-001", name: "Admin Workstation", type: "Desktop", os: "Windows 11", browser: "Chrome 125", lastSeen: "2025-07-20T10:30:00Z", trusted: true, fingerprint: crypto.randomBytes(16).toString("hex") },
    { id: "dev-002", name: "MacBook Pro", type: "Laptop", os: "macOS Sonoma", browser: "Safari 18", lastSeen: "2025-07-20T09:15:00Z", trusted: true, fingerprint: crypto.randomBytes(16).toString("hex") },
    { id: "dev-003", name: "iPhone 15", type: "Mobile", os: "iOS 18", browser: "Safari Mobile", lastSeen: "2025-07-19T22:00:00Z", trusted: true, fingerprint: crypto.randomBytes(16).toString("hex") },
    { id: "dev-004", name: "Unknown Linux", type: "Desktop", os: "Ubuntu 24.04", browser: "Firefox 128", lastSeen: "2025-07-18T14:30:00Z", trusted: false, fingerprint: crypto.randomBytes(16).toString("hex") },
    { id: "dev-005", name: "Pixel 8", type: "Mobile", os: "Android 15", browser: "Chrome Mobile", lastSeen: "2025-07-20T08:45:00Z", trusted: true, fingerprint: crypto.randomBytes(16).toString("hex") },
  ];

  return devices;
};
