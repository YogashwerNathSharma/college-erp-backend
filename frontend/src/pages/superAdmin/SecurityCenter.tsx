import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Shield, ShieldAlert, ShieldCheck, Lock, Unlock, Globe, Wifi, WifiOff,
  Eye, EyeOff, Key, Fingerprint, Smartphone, Monitor, Clock, AlertTriangle,
  Ban, CheckCircle2, XCircle, Plus, Trash2, RefreshCw, Settings, Users,
  Activity, FileWarning, Zap, Search, ToggleLeft, ToggleRight, LogOut,
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  PageHeader, StatsCard, DataTable, StatusBadge, ActivityTimeline,
  ChartCard, ConfirmDialog,
} from "../../components/enterprise";
import type { Column } from "../../components/enterprise";

// ══════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════

interface SecurityStats {
  securityScore: number;
  activeSessions: number;
  blockedIPs: number;
  failedLogins24h: number;
  totalFirewallRules: number;
  threatsBlocked: number;
}

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

interface BlockedIP {
  ip: string;
  reason: string;
  blockedAt: string;
  attempts: number;
}

interface WhitelistedIP {
  ip: string;
  label: string;
  addedAt: string;
}

interface Session {
  id: string;
  userId: string;
  userName: string;
  email: string;
  role: string;
  device: string;
  location: string;
  ipAddress: string;
  loginAt: string;
  lastActive: string;
  isActive: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  severity: string;
  user: string;
  email: string;
  role: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  details: string;
}

interface Device {
  id: string;
  name: string;
  type: string;
  os: string;
  browser: string;
  lastSeen: string;
  trusted: boolean;
  fingerprint: string;
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

type TabId = "overview" | "firewall" | "ips" | "sessions" | "config" | "audit" | "devices";

// ══════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════

export default function SecurityCenter() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [securityChecks, setSecurityChecks] = useState<Record<string, boolean>>({});
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimitConfig[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [whitelistedIPs, setWhitelistedIPs] = useState<WhitelistedIP[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [showBlockIPModal, setShowBlockIPModal] = useState(false);
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);
  const [showFirewallModal, setShowFirewallModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: "", message: "", onConfirm: () => {} });

  // Form states
  const [newIP, setNewIP] = useState("");
  const [newIPReason, setNewIPReason] = useState("");
  const [newWhitelistIP, setNewWhitelistIP] = useState("");
  const [newWhitelistLabel, setNewWhitelistLabel] = useState("");
  const [newRule, setNewRule] = useState({ name: "", type: "DENY" as "ALLOW" | "DENY", source: "", destination: "", port: "443", protocol: "HTTPS", enabled: true });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ── FETCH DATA ──────────────────────────────────────

  const fetchOverview = useCallback(async () => {
    try {
      const res = await axios.get("/api/security/overview", { headers });
      setStats(res.data.data.stats);
      setSecurityChecks(res.data.data.securityChecks);
      setConfig(res.data.data.config);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchFirewall = useCallback(async () => {
    try {
      const res = await axios.get("/api/security/firewall", { headers });
      setFirewallRules(res.data.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchRateLimits = useCallback(async () => {
    try {
      const res = await axios.get("/api/security/rate-limits", { headers });
      setRateLimits(res.data.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchIPs = useCallback(async () => {
    try {
      const res = await axios.get("/api/security/ip", { headers });
      setBlockedIPs(res.data.data.blocked);
      setWhitelistedIPs(res.data.data.whitelisted);
    } catch (err) { console.error(err); }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await axios.get("/api/security/sessions", { headers });
      setSessions(res.data.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await axios.get("/api/security/audit-logs", { headers });
      setAuditLogs(res.data.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await axios.get("/api/security/devices", { headers });
      setDevices(res.data.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchOverview(), fetchFirewall(), fetchRateLimits(), fetchIPs(), fetchSessions(), fetchAuditLogs(), fetchDevices()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  // ── ACTIONS ─────────────────────────────────────────

  const handleBlockIP = async () => {
    if (!newIP) return;
    try {
      await axios.post("/api/security/ip/block", { ip: newIP, reason: newIPReason || "Manual block" }, { headers });
      toast.success(`Blocked IP: ${newIP}`);
      setNewIP("");
      setNewIPReason("");
      setShowBlockIPModal(false);
      fetchIPs();
    } catch (err) { toast.error("Failed to block IP"); }
  };

  const handleUnblockIP = async (ip: string) => {
    try {
      await axios.delete(`/api/security/ip/block/${encodeURIComponent(ip)}`, { headers });
      toast.success(`Unblocked IP: ${ip}`);
      fetchIPs();
    } catch (err) { toast.error("Failed to unblock IP"); }
  };

  const handleAddWhitelist = async () => {
    if (!newWhitelistIP) return;
    try {
      await axios.post("/api/security/ip/whitelist", { ip: newWhitelistIP, label: newWhitelistLabel }, { headers });
      toast.success(`Whitelisted: ${newWhitelistIP}`);
      setNewWhitelistIP("");
      setNewWhitelistLabel("");
      setShowWhitelistModal(false);
      fetchIPs();
    } catch (err) { toast.error("Failed to whitelist IP"); }
  };

  const handleAddFirewallRule = async () => {
    if (!newRule.name || !newRule.source) return;
    try {
      await axios.post("/api/security/firewall", newRule, { headers });
      toast.success("Firewall rule added");
      setNewRule({ name: "", type: "DENY", source: "", destination: "", port: "443", protocol: "HTTPS", enabled: true });
      setShowFirewallModal(false);
      fetchFirewall();
    } catch (err) { toast.error("Failed to add rule"); }
  };

  const handleToggleFirewallRule = async (id: string, enabled: boolean) => {
    try {
      await axios.patch(`/api/security/firewall/${id}`, { enabled: !enabled }, { headers });
      fetchFirewall();
    } catch (err) { toast.error("Failed to update rule"); }
  };

  const handleDeleteFirewallRule = async (id: string) => {
    try {
      await axios.delete(`/api/security/firewall/${id}`, { headers });
      toast.success("Rule deleted");
      fetchFirewall();
    } catch (err) { toast.error("Failed to delete rule"); }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await axios.delete(`/api/security/sessions/${sessionId}`, { headers });
      toast.success("Session terminated");
      fetchSessions();
    } catch (err) { toast.error("Failed to terminate session"); }
  };

  const handleTerminateAll = async () => {
    try {
      await axios.delete("/api/security/sessions", { headers });
      toast.success("All sessions terminated");
      fetchSessions();
    } catch (err) { toast.error("Failed to terminate sessions"); }
  };

  const handleUpdateConfig = async (updates: Partial<SecurityConfig>) => {
    try {
      const res = await axios.patch("/api/security/config", updates, { headers });
      setConfig(res.data.data);
      toast.success("Configuration updated");
    } catch (err) { toast.error("Failed to update config"); }
  };

  // ── TABS ────────────────────────────────────────────

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Shield className="w-4 h-4" /> },
    { id: "firewall", label: "Firewall & Rate Limits", icon: <ShieldAlert className="w-4 h-4" /> },
    { id: "ips", label: "IP Management", icon: <Globe className="w-4 h-4" /> },
    { id: "sessions", label: "Sessions", icon: <Users className="w-4 h-4" /> },
    { id: "config", label: "Security Config", icon: <Settings className="w-4 h-4" /> },
    { id: "audit", label: "Audit Logs", icon: <FileWarning className="w-4 h-4" /> },
    { id: "devices", label: "Devices", icon: <Smartphone className="w-4 h-4" /> },
  ];

  // ── RENDER ──────────────────────────────────────────

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Security Center"
        subtitle="Enterprise security monitoring, firewall management, and access control"
        icon={<Shield className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Super Admin", path: "/super-admin" },
          { label: "Security Center" },
        ]}
        badge={{ label: stats ? `Score: ${stats.securityScore}%` : "Loading...", color: stats && stats.securityScore >= 80 ? "green" : "amber" }}
        actions={
          <button
            onClick={() => { fetchOverview(); fetchFirewall(); fetchIPs(); fetchSessions(); fetchAuditLogs(); toast.success("Refreshed"); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        }
      />

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab stats={stats} securityChecks={securityChecks} loading={loading} />}
      {activeTab === "firewall" && (
        <FirewallTab
          rules={firewallRules}
          rateLimits={rateLimits}
          onToggleRule={handleToggleFirewallRule}
          onDeleteRule={handleDeleteFirewallRule}
          onAddRule={() => setShowFirewallModal(true)}
          loading={loading}
        />
      )}
      {activeTab === "ips" && (
        <IPManagementTab
          blockedIPs={blockedIPs}
          whitelistedIPs={whitelistedIPs}
          onUnblock={handleUnblockIP}
          onBlockNew={() => setShowBlockIPModal(true)}
          onWhitelistNew={() => setShowWhitelistModal(true)}
          loading={loading}
        />
      )}
      {activeTab === "sessions" && (
        <SessionsTab
          sessions={sessions}
          onTerminate={handleTerminateSession}
          onTerminateAll={() => setConfirmDialog({ open: true, title: "Terminate All Sessions", message: "This will force logout all users. Are you sure?", onConfirm: handleTerminateAll })}
          loading={loading}
        />
      )}
      {activeTab === "config" && config && (
        <SecurityConfigTab config={config} onUpdate={handleUpdateConfig} />
      )}
      {activeTab === "audit" && <AuditLogsTab logs={auditLogs} loading={loading} />}
      {activeTab === "devices" && <DevicesTab devices={devices} loading={loading} />}

      {/* Modals */}
      {showBlockIPModal && (
        <Modal title="Block IP Address" onClose={() => setShowBlockIPModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">IP Address</label>
              <input type="text" value={newIP} onChange={(e) => setNewIP(e.target.value)} placeholder="e.g. 192.168.1.100" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason</label>
              <input type="text" value={newIPReason} onChange={(e) => setNewIPReason(e.target.value)} placeholder="Reason for blocking" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
            </div>
            <button onClick={handleBlockIP} className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Block IP</button>
          </div>
        </Modal>
      )}

      {showWhitelistModal && (
        <Modal title="Add to Whitelist" onClose={() => setShowWhitelistModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">IP / CIDR</label>
              <input type="text" value={newWhitelistIP} onChange={(e) => setNewWhitelistIP(e.target.value)} placeholder="e.g. 192.168.1.0/24" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Label</label>
              <input type="text" value={newWhitelistLabel} onChange={(e) => setNewWhitelistLabel(e.target.value)} placeholder="Office Network" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
            </div>
            <button onClick={handleAddWhitelist} className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">Add to Whitelist</button>
          </div>
        </Modal>
      )}

      {showFirewallModal && (
        <Modal title="Add Firewall Rule" onClose={() => setShowFirewallModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rule Name</label>
              <input type="text" value={newRule.name} onChange={(e) => setNewRule({ ...newRule, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                <select value={newRule.type} onChange={(e) => setNewRule({ ...newRule, type: e.target.value as "ALLOW" | "DENY" })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  <option value="DENY">DENY</option>
                  <option value="ALLOW">ALLOW</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Protocol</label>
                <select value={newRule.protocol} onChange={(e) => setNewRule({ ...newRule, protocol: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  <option value="HTTPS">HTTPS</option>
                  <option value="HTTP">HTTP</option>
                  <option value="TCP">TCP</option>
                  <option value="ALL">ALL</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source (IP/CIDR)</label>
              <input type="text" value={newRule.source} onChange={(e) => setNewRule({ ...newRule, source: e.target.value })} placeholder="0.0.0.0/0" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destination (Path)</label>
              <input type="text" value={newRule.destination} onChange={(e) => setNewRule({ ...newRule, destination: e.target.value })} placeholder="/api/*" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Port</label>
              <input type="text" value={newRule.port} onChange={(e) => setNewRule({ ...newRule, port: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
            </div>
            <button onClick={handleAddFirewallRule} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Add Rule</button>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, open: false }); }}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
        variant="danger"
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MODAL COMPONENT
// ══════════════════════════════════════════════════════

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// OVERVIEW TAB
// ══════════════════════════════════════════════════════

function OverviewTab({ stats, securityChecks, loading }: { stats: SecurityStats | null; securityChecks: Record<string, boolean>; loading: boolean }) {
  const scoreColor = (stats?.securityScore || 0) >= 90 ? "emerald" : (stats?.securityScore || 0) >= 70 ? "amber" : "rose";

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Security Score" value={`${stats?.securityScore || 0}%`} icon={<ShieldCheck className="w-5 h-5" />} color={scoreColor as any} loading={loading} />
        <StatsCard title="Active Sessions" value={stats?.activeSessions || 0} icon={<Users className="w-5 h-5" />} color="blue" loading={loading} />
        <StatsCard title="Blocked IPs" value={stats?.blockedIPs || 0} icon={<Ban className="w-5 h-5" />} color="rose" loading={loading} />
        <StatsCard title="Failed Logins (24h)" value={stats?.failedLogins24h || 0} icon={<AlertTriangle className="w-5 h-5" />} color="amber" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Score Gauge */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Security Health Score</h3>
          <div className="flex items-center justify-center py-6">
            <div className="relative w-48 h-48">
              <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="16" fill="none" className="text-slate-200 dark:text-slate-700" />
                <circle
                  cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="16" fill="none"
                  strokeDasharray={`${(stats?.securityScore || 0) * 5.024} 502.4`}
                  strokeLinecap="round"
                  className={scoreColor === "emerald" ? "text-emerald-500" : scoreColor === "amber" ? "text-amber-500" : "text-rose-500"}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">{stats?.securityScore || 0}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">out of 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Checklist */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Security Checks</h3>
          <div className="space-y-3">
            {Object.entries(securityChecks).map(([key, passed]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                <div className="flex items-center gap-2">
                  {passed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                  </span>
                </div>
                <StatusBadge label={passed ? "Passed" : "Failed"} variant={passed ? "success" : "danger"} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Firewall Rules" value={stats?.totalFirewallRules || 0} icon={<ShieldAlert className="w-5 h-5" />} color="indigo" loading={loading} />
        <StatsCard title="Threats Blocked" value={stats?.threatsBlocked || 0} icon={<Zap className="w-5 h-5" />} color="purple" loading={loading} trend={-12} trendLabel="vs last week" />
        <StatsCard title="Rate Limit Hits" value={Math.floor(Math.random() * 500) + 100} icon={<Activity className="w-5 h-5" />} color="cyan" loading={loading} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// FIREWALL TAB
// ══════════════════════════════════════════════════════

function FirewallTab({ rules, rateLimits, onToggleRule, onDeleteRule, onAddRule, loading }: {
  rules: FirewallRule[];
  rateLimits: RateLimitConfig[];
  onToggleRule: (id: string, enabled: boolean) => void;
  onDeleteRule: (id: string) => void;
  onAddRule: () => void;
  loading: boolean;
}) {
  const firewallColumns: Column<FirewallRule>[] = [
    { key: "name", label: "Rule Name", render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.name}</span> },
    { key: "type", label: "Type", render: (row) => <StatusBadge label={row.type} variant={row.type === "ALLOW" ? "success" : "danger"} /> },
    { key: "source", label: "Source", render: (row) => <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{row.source}</code> },
    { key: "destination", label: "Destination", render: (row) => <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{row.destination}</code> },
    { key: "protocol", label: "Protocol" },
    { key: "enabled", label: "Status", render: (row) => (
      <button onClick={() => onToggleRule(row.id, row.enabled)} className="flex items-center gap-1">
        {row.enabled ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
      </button>
    )},
    { key: "actions", label: "Actions", render: (row) => (
      <button onClick={() => onDeleteRule(row.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
        <Trash2 className="w-4 h-4" />
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={firewallColumns}
        data={rules}
        title="Firewall Rules"
        subtitle="Manage network access rules"
        loading={loading}
        headerActions={
          <button onClick={onAddRule} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        }
      />

      {/* Rate Limiting */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Rate Limiting Configuration</h3>
        <div className="space-y-3">
          {rateLimits.map((rl, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${rl.enabled ? "bg-emerald-500" : "bg-slate-400"}`} />
                <div>
                  <code className="text-sm font-mono text-slate-900 dark:text-white">{rl.endpoint}</code>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {rl.maxRequests} requests / {Math.round(rl.windowMs / 60000)} min
                  </p>
                </div>
              </div>
              <StatusBadge label={rl.enabled ? "Active" : "Disabled"} variant={rl.enabled ? "success" : "neutral"} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// IP MANAGEMENT TAB
// ══════════════════════════════════════════════════════

function IPManagementTab({ blockedIPs, whitelistedIPs, onUnblock, onBlockNew, onWhitelistNew, loading }: {
  blockedIPs: BlockedIP[];
  whitelistedIPs: WhitelistedIP[];
  onUnblock: (ip: string) => void;
  onBlockNew: () => void;
  onWhitelistNew: () => void;
  loading: boolean;
}) {
  const blockedColumns: Column<BlockedIP>[] = [
    { key: "ip", label: "IP Address", render: (row) => <code className="text-sm font-mono text-red-600 dark:text-red-400">{row.ip}</code> },
    { key: "reason", label: "Reason" },
    { key: "attempts", label: "Attempts", render: (row) => <span className="font-semibold text-slate-900 dark:text-white">{row.attempts}</span> },
    { key: "blockedAt", label: "Blocked At", render: (row) => <span className="text-sm">{new Date(row.blockedAt).toLocaleString()}</span> },
    { key: "actions", label: "", render: (row) => (
      <button onClick={() => onUnblock(row.ip)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300">
        <Unlock className="w-3 h-3" /> Unblock
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Blocked IPs */}
      <DataTable
        columns={blockedColumns}
        data={blockedIPs}
        rowKey="ip"
        title="Blocked IP Addresses"
        subtitle={`${blockedIPs.length} IPs currently blocked`}
        loading={loading}
        headerActions={
          <button onClick={onBlockNew} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
            <Ban className="w-4 h-4" /> Block IP
          </button>
        }
      />

      {/* Whitelisted IPs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">IP Whitelist</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Trusted IP ranges</p>
          </div>
          <button onClick={onWhitelistNew} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {whitelistedIPs.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <div>
                  <code className="text-sm font-mono text-emerald-700 dark:text-emerald-300">{item.ip}</code>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                </div>
              </div>
              <span className="text-xs text-slate-400">{new Date(item.addedAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// SESSIONS TAB
// ══════════════════════════════════════════════════════

function SessionsTab({ sessions, onTerminate, onTerminateAll, loading }: {
  sessions: Session[];
  onTerminate: (id: string) => void;
  onTerminateAll: () => void;
  loading: boolean;
}) {
  const sessionColumns: Column<Session>[] = [
    { key: "userName", label: "User", render: (row) => (
      <div>
        <p className="font-medium text-slate-900 dark:text-white">{row.userName}</p>
        <p className="text-xs text-slate-500">{row.email}</p>
      </div>
    )},
    { key: "role", label: "Role", render: (row) => <StatusBadge label={row.role} variant={row.role === "SUPER_ADMIN" ? "purple" : row.role === "ADMIN" ? "info" : "neutral"} /> },
    { key: "device", label: "Device", render: (row) => (
      <div className="flex items-center gap-2">
        <Monitor className="w-4 h-4 text-slate-400" />
        <span className="text-sm">{row.device}</span>
      </div>
    )},
    { key: "location", label: "Location" },
    { key: "ipAddress", label: "IP" , render: (row) => <code className="text-xs">{row.ipAddress}</code> },
    { key: "isActive", label: "Status", render: (row) => (
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${row.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
        <span className="text-xs">{row.isActive ? "Online" : "Idle"}</span>
      </div>
    )},
    { key: "lastActive", label: "Last Active", render: (row) => <span className="text-xs">{new Date(row.lastActive).toLocaleString()}</span> },
    { key: "actions", label: "", render: (row) => (
      <button onClick={() => onTerminate(row.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300">
        <LogOut className="w-3 h-3" /> Logout
      </button>
    )},
  ];

  return (
    <DataTable
      columns={sessionColumns}
      data={sessions}
      title="Active Sessions"
      subtitle={`${sessions.filter((s) => s.isActive).length} online, ${sessions.length} total`}
      loading={loading}
      pageSize={15}
      headerActions={
        <button onClick={onTerminateAll} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
          <LogOut className="w-4 h-4" /> Terminate All
        </button>
      }
    />
  );
}

// ══════════════════════════════════════════════════════
// SECURITY CONFIG TAB
// ══════════════════════════════════════════════════════

function SecurityConfigTab({ config, onUpdate }: { config: SecurityConfig; onUpdate: (updates: Partial<SecurityConfig>) => void }) {
  return (
    <div className="space-y-6">
      {/* JWT Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Key className="w-4 h-4" /> JWT Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfigField label="Access Token Expiry" value={config.jwtExpiresIn} onSave={(v) => onUpdate({ jwtExpiresIn: v })} />
          <ConfigField label="Refresh Token Expiry" value={config.jwtRefreshExpiresIn} onSave={(v) => onUpdate({ jwtRefreshExpiresIn: v })} />
          <ConfigField label="Session Timeout (min)" value={String(config.sessionTimeout)} type="number" onSave={(v) => onUpdate({ sessionTimeout: Number(v) })} />
          <ConfigField label="Max Login Attempts" value={String(config.maxLoginAttempts)} type="number" onSave={(v) => onUpdate({ maxLoginAttempts: Number(v) })} />
          <ConfigField label="Lockout Duration (min)" value={String(config.lockoutDuration)} type="number" onSave={(v) => onUpdate({ lockoutDuration: Number(v) })} />
        </div>
      </div>

      {/* Password Policy */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Lock className="w-4 h-4" /> Password Policy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfigField label="Minimum Length" value={String(config.passwordMinLength)} type="number" onSave={(v) => onUpdate({ passwordMinLength: Number(v) })} />
          <ConfigField label="Expiry (days)" value={String(config.passwordExpiryDays)} type="number" onSave={(v) => onUpdate({ passwordExpiryDays: Number(v) })} />
          <ToggleField label="Require Uppercase" enabled={config.passwordRequireUppercase} onToggle={(v) => onUpdate({ passwordRequireUppercase: v })} />
          <ToggleField label="Require Numbers" enabled={config.passwordRequireNumbers} onToggle={(v) => onUpdate({ passwordRequireNumbers: v })} />
          <ToggleField label="Require Special Characters" enabled={config.passwordRequireSpecial} onToggle={(v) => onUpdate({ passwordRequireSpecial: v })} />
        </div>
      </div>

      {/* 2FA Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Fingerprint className="w-4 h-4" /> Two-Factor Authentication</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleField label="Enable 2FA" enabled={config.twoFactorEnabled} onToggle={(v) => onUpdate({ twoFactorEnabled: v })} />
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Method</span>
            <select
              value={config.twoFactorMethod}
              onChange={(e) => onUpdate({ twoFactorMethod: e.target.value })}
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="TOTP">TOTP (Authenticator)</option>
              <option value="SMS">SMS</option>
              <option value="EMAIL">Email</option>
            </select>
          </div>
          <ToggleField label="API Key Authentication" enabled={config.apiKeyEnabled} onToggle={(v) => onUpdate({ apiKeyEnabled: v })} />
        </div>
      </div>

      {/* CORS */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Globe className="w-4 h-4" /> CORS Origins</h3>
        <div className="space-y-2">
          {config.corsOrigins.map((origin, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <Globe className="w-4 h-4 text-slate-400" />
              <code className="text-sm text-slate-700 dark:text-slate-300 flex-1">{origin}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfigField({ label, value, type = "text", onSave }: { label: string; value: string; type?: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type={type}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="w-24 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            autoFocus
          />
          <button onClick={() => { onSave(localValue); setEditing(false); }} className="text-emerald-600 hover:text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
          </button>
          <button onClick={() => { setLocalValue(value); setEditing(false); }} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="text-sm font-mono text-indigo-600 dark:text-indigo-400 hover:underline">{value}</button>
      )}
    </div>
  );
}

function ToggleField({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <button onClick={() => onToggle(!enabled)}>
        {enabled ? <ToggleRight className="w-7 h-7 text-emerald-500" /> : <ToggleLeft className="w-7 h-7 text-slate-400" />}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// AUDIT LOGS TAB
// ══════════════════════════════════════════════════════

function AuditLogsTab({ logs, loading }: { logs: AuditLog[]; loading: boolean }) {
  const auditColumns: Column<AuditLog>[] = [
    { key: "timestamp", label: "Time", render: (row) => <span className="text-xs whitespace-nowrap">{new Date(row.timestamp).toLocaleString()}</span> },
    { key: "action", label: "Action", render: (row) => (
      <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{row.action}</span>
    )},
    { key: "severity", label: "Severity", render: (row) => (
      <StatusBadge label={row.severity} variant={row.severity === "danger" ? "danger" : row.severity === "warning" ? "warning" : "info"} />
    )},
    { key: "user", label: "User", render: (row) => (
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{row.user}</p>
        <p className="text-xs text-slate-500">{row.role}</p>
      </div>
    )},
    { key: "ipAddress", label: "IP", render: (row) => <code className="text-xs">{row.ipAddress}</code> },
    { key: "userAgent", label: "Client" },
    { key: "details", label: "Details" },
  ];

  return (
    <DataTable
      columns={auditColumns}
      data={logs}
      title="Security Audit Logs"
      subtitle="Complete audit trail of security events"
      loading={loading}
      pageSize={15}
    />
  );
}

// ══════════════════════════════════════════════════════
// DEVICES TAB
// ══════════════════════════════════════════════════════

function DevicesTab({ devices, loading }: { devices: Device[]; loading: boolean }) {
  const deviceColumns: Column<Device>[] = [
    { key: "name", label: "Device", render: (row) => (
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${row.type === "Mobile" ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"}`}>
          {row.type === "Mobile" ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
        </div>
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{row.name}</p>
          <p className="text-xs text-slate-500">{row.os}</p>
        </div>
      </div>
    )},
    { key: "browser", label: "Browser" },
    { key: "type", label: "Type" },
    { key: "trusted", label: "Trust", render: (row) => (
      <StatusBadge label={row.trusted ? "Trusted" : "Untrusted"} variant={row.trusted ? "success" : "warning"} />
    )},
    { key: "lastSeen", label: "Last Seen", render: (row) => <span className="text-sm">{new Date(row.lastSeen).toLocaleString()}</span> },
    { key: "fingerprint", label: "Fingerprint", render: (row) => <code className="text-xs text-slate-400">{row.fingerprint.slice(0, 12)}...</code> },
  ];

  return (
    <DataTable
      columns={deviceColumns}
      data={devices}
      title="Trusted Devices"
      subtitle="Manage recognized devices for enhanced security"
      loading={loading}
    />
  );
}
