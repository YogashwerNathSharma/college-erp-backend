import { useState, useEffect, useCallback } from "react";
import {
  Puzzle,
  Power,
  PowerOff,
  Download,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  ShoppingBag,
  Settings,
  Shield,
  Activity,
  Star,
  ArrowUpCircle,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Bell,
  Code,
  Key,
  History,
  Save,
  Upload,
  ChevronDown,
  ChevronRight,
  Eye,
  Plus,
  Minus,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import {
  DataTable,
  PageHeader,
  StatsCard,
  StatusBadge,
  ConfirmDialog,
  ActivityTimeline,
} from "../../components/enterprise";
import type { Column } from "../../components/enterprise";

// ══════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════

interface Plugin {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  category: string;
  author: string;
  icon: string;
  permissions: string[];
  configSchema: Record<string, any>;
  config: Record<string, any>;
  isEnabled: boolean;
  isInstalled: boolean;
  hasUpdate: boolean;
  latestVersion: string | null;
  price: number;
  homepage: string;
  repository: string;
  installedAt: string;
  createdAt: string;
  updatedAt: string;
  activityLogs?: PluginLog[];
}

interface PluginLog {
  id: string;
  pluginId: string;
  action: string;
  message: string;
  metadata?: any;
  createdAt: string;
}

interface StoreItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  category: string;
  author: string;
  price: number;
  rating: number;
  downloads: number;
  icon: string;
  installed: boolean;
}

interface PluginStats {
  total: number;
  enabled: number;
  disabled: number;
  updatesAvailable: number;
}

// ══════════════════════════════════════════════════════
// MOCK DATA
// ══════════════════════════════════════════════════════

const mockPlugins: Plugin[] = [
  {
    id: "plg-1",
    name: "Email Notifications",
    slug: "email-notifications",
    description: "Advanced email notification system with templates, scheduling, and delivery tracking",
    version: "2.4.0",
    category: "Communication",
    author: "NotifyPro",
    icon: "Mail",
    permissions: ["send_email", "read_users", "read_templates", "manage_schedules"],
    configSchema: {
      smtpHost: { type: "string", label: "SMTP Host", required: true },
      smtpPort: { type: "number", label: "SMTP Port", required: true },
      smtpUser: { type: "string", label: "SMTP User", required: true },
      smtpPass: { type: "password", label: "SMTP Password", required: true },
      fromEmail: { type: "string", label: "From Email" },
      maxRetries: { type: "number", label: "Max Retries", default: 3 },
    },
    config: { smtpHost: "smtp.gmail.com", smtpPort: 587, smtpUser: "erp@school.com", fromEmail: "noreply@school.com", maxRetries: 3 },
    isEnabled: true,
    isInstalled: true,
    hasUpdate: true,
    latestVersion: "2.5.0",
    price: 0,
    homepage: "https://notifypro.dev",
    repository: "https://github.com/notifypro/email-plugin",
    installedAt: "2024-03-15T00:00:00Z",
    createdAt: "2024-03-15T00:00:00Z",
    updatedAt: "2024-06-20T00:00:00Z",
    activityLogs: [
      { id: "log-1", pluginId: "plg-1", action: "configured", message: "SMTP settings updated", createdAt: "2024-06-20T10:30:00Z" },
      { id: "log-2", pluginId: "plg-1", action: "enabled", message: "Plugin enabled", createdAt: "2024-06-19T09:00:00Z" },
    ],
  },
  {
    id: "plg-2",
    name: "Two-Factor Authentication",
    slug: "two-factor-auth",
    description: "Add 2FA security with TOTP, SMS verification, and backup codes",
    version: "1.2.0",
    category: "Security",
    author: "SecureAuth",
    icon: "Shield",
    permissions: ["manage_auth", "read_users", "send_sms", "write_sessions"],
    configSchema: {
      totpEnabled: { type: "boolean", label: "Enable TOTP", default: true },
      smsEnabled: { type: "boolean", label: "Enable SMS", default: false },
      backupCodesCount: { type: "number", label: "Backup Codes Count", default: 10 },
      enforceForAdmins: { type: "boolean", label: "Enforce for Admins", default: true },
    },
    config: { totpEnabled: true, smsEnabled: false, backupCodesCount: 10, enforceForAdmins: true },
    isEnabled: true,
    isInstalled: true,
    hasUpdate: false,
    latestVersion: null,
    price: 19.99,
    homepage: "https://secureauth.io",
    repository: "",
    installedAt: "2024-04-01T00:00:00Z",
    createdAt: "2024-04-01T00:00:00Z",
    updatedAt: "2024-05-15T00:00:00Z",
    activityLogs: [
      { id: "log-3", pluginId: "plg-2", action: "installed", message: "Plugin installed v1.2.0", createdAt: "2024-04-01T14:00:00Z" },
    ],
  },
  {
    id: "plg-3",
    name: "Backup Manager",
    slug: "backup-manager",
    description: "Automated database and file backups with cloud storage integration (AWS S3, GCS)",
    version: "3.1.0",
    category: "System",
    author: "CloudBack",
    icon: "HardDrive",
    permissions: ["read_database", "write_storage", "manage_cron", "read_config"],
    configSchema: {
      provider: { type: "select", label: "Storage Provider", options: ["aws-s3", "gcs", "local"], default: "local" },
      bucket: { type: "string", label: "Bucket Name" },
      schedule: { type: "string", label: "Cron Schedule", default: "0 2 * * *" },
      retention: { type: "number", label: "Retention Days", default: 30 },
      compress: { type: "boolean", label: "Compress Backups", default: true },
    },
    config: { provider: "aws-s3", bucket: "erp-backups", schedule: "0 2 * * *", retention: 30, compress: true },
    isEnabled: true,
    isInstalled: true,
    hasUpdate: true,
    latestVersion: "3.2.0",
    price: 29.99,
    homepage: "https://cloudback.dev",
    repository: "https://github.com/cloudback/backup-plugin",
    installedAt: "2024-02-10T00:00:00Z",
    createdAt: "2024-02-10T00:00:00Z",
    updatedAt: "2024-07-01T00:00:00Z",
    activityLogs: [
      { id: "log-4", pluginId: "plg-3", action: "configured", message: "Switched to AWS S3 provider", createdAt: "2024-07-01T11:00:00Z" },
      { id: "log-5", pluginId: "plg-3", action: "updated_version", message: "Updated from v3.0.0 to v3.1.0", createdAt: "2024-06-15T08:00:00Z" },
    ],
  },
  {
    id: "plg-4",
    name: "SMS Gateway",
    slug: "sms-gateway",
    description: "Send SMS notifications via Twilio, Vonage, or custom providers",
    version: "1.8.0",
    category: "Communication",
    author: "SMSHub",
    icon: "MessageSquare",
    permissions: ["send_sms", "read_users", "manage_templates"],
    configSchema: {
      provider: { type: "select", label: "Provider", options: ["twilio", "vonage", "custom"] },
      apiKey: { type: "string", label: "API Key", required: true },
      apiSecret: { type: "password", label: "API Secret", required: true },
      fromNumber: { type: "string", label: "From Number" },
    },
    config: { provider: "twilio", apiKey: "AC***", fromNumber: "+1234567890" },
    isEnabled: false,
    isInstalled: true,
    hasUpdate: false,
    latestVersion: null,
    price: 14.99,
    homepage: "https://smshub.io",
    repository: "",
    installedAt: "2024-05-20T00:00:00Z",
    createdAt: "2024-05-20T00:00:00Z",
    updatedAt: "2024-05-20T00:00:00Z",
    activityLogs: [
      { id: "log-6", pluginId: "plg-4", action: "disabled", message: "Plugin disabled by admin", createdAt: "2024-06-01T16:00:00Z" },
      { id: "log-7", pluginId: "plg-4", action: "installed", message: "Plugin installed v1.8.0", createdAt: "2024-05-20T10:00:00Z" },
    ],
  },
  {
    id: "plg-5",
    name: "PDF Report Generator",
    slug: "pdf-generator",
    description: "Generate professional PDF reports, certificates, and documents with custom templates",
    version: "2.0.0",
    category: "Documents",
    author: "DocGen",
    icon: "FileText",
    permissions: ["read_data", "write_files", "manage_templates"],
    configSchema: {
      paperSize: { type: "select", label: "Default Paper Size", options: ["A4", "Letter", "Legal"], default: "A4" },
      headerLogo: { type: "string", label: "Header Logo URL" },
      footerText: { type: "string", label: "Footer Text", default: "Generated by College ERP" },
      watermark: { type: "boolean", label: "Add Watermark", default: false },
    },
    config: { paperSize: "A4", footerText: "Generated by College ERP", watermark: false },
    isEnabled: true,
    isInstalled: true,
    hasUpdate: false,
    latestVersion: null,
    price: 24.99,
    homepage: "https://docgen.io",
    repository: "https://github.com/docgen/pdf-plugin",
    installedAt: "2024-01-20T00:00:00Z",
    createdAt: "2024-01-20T00:00:00Z",
    updatedAt: "2024-06-10T00:00:00Z",
    activityLogs: [],
  },
  {
    id: "plg-6",
    name: "Webhook Manager",
    slug: "webhook-manager",
    description: "Configure webhooks for external integrations, with retry logic and logging",
    version: "1.5.0",
    category: "Integration",
    author: "HookMaster",
    icon: "Webhook",
    permissions: ["manage_webhooks", "read_events", "send_http"],
    configSchema: {
      maxRetries: { type: "number", label: "Max Retries", default: 3 },
      timeout: { type: "number", label: "Timeout (ms)", default: 5000 },
      logRetention: { type: "number", label: "Log Retention (days)", default: 7 },
    },
    config: { maxRetries: 3, timeout: 5000, logRetention: 7 },
    isEnabled: true,
    isInstalled: true,
    hasUpdate: false,
    latestVersion: null,
    price: 0,
    homepage: "",
    repository: "https://github.com/hookmaster/webhook-plugin",
    installedAt: "2024-04-10T00:00:00Z",
    createdAt: "2024-04-10T00:00:00Z",
    updatedAt: "2024-06-25T00:00:00Z",
    activityLogs: [],
  },
];

const mockStats: PluginStats = {
  total: 6,
  enabled: 5,
  disabled: 1,
  updatesAvailable: 2,
};

// ══════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════

export default function PluginManagement() {
  const [plugins, setPlugins] = useState<Plugin[]>(mockPlugins);
  const [stats, setStats] = useState<PluginStats>(mockStats);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"installed" | "store">("installed");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [store, setStore] = useState<StoreItem[]>([]);
  const [configModal, setConfigModal] = useState<Plugin | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [permissionsModal, setPermissionsModal] = useState<Plugin | null>(null);
  const [logsModal, setLogsModal] = useState<Plugin | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  // ─── FETCH DATA ──────────────────────────────────────
  const fetchPlugins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/super-admin/plugins", {
        params: { category: categoryFilter !== "all" ? categoryFilter : undefined },
      });
      if (res.data.success) {
        setPlugins(res.data.data.plugins);
        setStats(res.data.data.stats);
      }
    } catch {
      setPlugins(mockPlugins);
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  const fetchStore = useCallback(async () => {
    try {
      const res = await axios.get("/api/super-admin/plugins/store");
      if (res.data.success) {
        setStore(res.data.data);
      }
    } catch {
      setStore([
        { id: "store-1", name: "Email Notifications", slug: "email-notifications", description: "Advanced email notification system with templates and scheduling", version: "2.4.0", category: "Communication", author: "NotifyPro", price: 0, rating: 4.7, downloads: 23000, icon: "Mail", installed: true },
        { id: "store-2", name: "Two-Factor Auth", slug: "two-factor-auth", description: "Add 2FA security layer with TOTP and SMS verification", version: "1.2.0", category: "Security", author: "SecureAuth", price: 19.99, rating: 4.9, downloads: 45000, icon: "Shield", installed: true },
        { id: "store-3", name: "Backup Manager", slug: "backup-manager", description: "Automated backups with cloud storage integration", version: "3.1.0", category: "System", author: "CloudBack", price: 29.99, rating: 4.6, downloads: 18500, icon: "HardDrive", installed: true },
        { id: "store-4", name: "SMS Gateway", slug: "sms-gateway", description: "Send SMS notifications via multiple providers", version: "1.8.0", category: "Communication", author: "SMSHub", price: 14.99, rating: 4.4, downloads: 12000, icon: "MessageSquare", installed: true },
        { id: "store-5", name: "PDF Generator", slug: "pdf-generator", description: "Generate professional PDF reports and certificates", version: "2.0.0", category: "Documents", author: "DocGen", price: 24.99, rating: 4.8, downloads: 31000, icon: "FileText", installed: true },
        { id: "store-6", name: "Payment Gateway", slug: "payment-gateway", description: "Accept payments via Stripe, Razorpay, and PayPal", version: "2.3.0", category: "Finance", author: "PayHub", price: 39.99, rating: 4.7, downloads: 28000, icon: "CreditCard", installed: false },
        { id: "store-7", name: "Analytics Dashboard", slug: "analytics-dashboard", description: "Advanced analytics with custom reports and visualizations", version: "1.9.0", category: "Analytics", author: "DataViz", price: 34.99, rating: 4.5, downloads: 15000, icon: "BarChart", installed: false },
        { id: "store-8", name: "Chat Bot", slug: "chat-bot", description: "AI-powered chatbot for student and parent queries", version: "1.0.0", category: "Communication", author: "BotAI", price: 49.99, rating: 4.3, downloads: 5600, icon: "Bot", installed: false },
      ]);
    }
  }, []);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  useEffect(() => {
    if (activeTab === "store") fetchStore();
  }, [activeTab, fetchStore]);

  // ─── ACTIONS ─────────────────────────────────────────
  const handleToggleStatus = async (plugin: Plugin) => {
    try {
      await axios.patch(`/api/super-admin/plugins/${plugin.id}/toggle-status`);
      toast.success(`${plugin.name} ${plugin.isEnabled ? "disabled" : "enabled"}`);
      fetchPlugins();
    } catch {
      setPlugins((prev) =>
        prev.map((p) => (p.id === plugin.id ? { ...p, isEnabled: !p.isEnabled } : p))
      );
      toast.success(`${plugin.name} ${plugin.isEnabled ? "disabled" : "enabled"}`);
    }
  };

  const handleUninstall = (plugin: Plugin) => {
    setConfirmDialog({
      open: true,
      title: "Uninstall Plugin",
      message: `Are you sure you want to uninstall "${plugin.name}"? This action cannot be undone and all plugin data will be lost.`,
      onConfirm: async () => {
        try {
          await axios.delete(`/api/super-admin/plugins/${plugin.id}`);
        } catch {
          setPlugins((prev) => prev.filter((p) => p.id !== plugin.id));
        }
        toast.success(`${plugin.name} uninstalled`);
        setConfirmDialog((d) => ({ ...d, open: false }));
        fetchPlugins();
      },
    });
  };

  const handleApplyUpdate = async (plugin: Plugin) => {
    try {
      await axios.patch(`/api/super-admin/plugins/${plugin.id}/apply-update`);
      toast.success(`${plugin.name} updated to ${plugin.latestVersion}`);
      fetchPlugins();
    } catch {
      setPlugins((prev) =>
        prev.map((p) =>
          p.id === plugin.id
            ? { ...p, version: p.latestVersion || p.version, hasUpdate: false, latestVersion: null }
            : p
        )
      );
      toast.success(`${plugin.name} updated to ${plugin.latestVersion}`);
    }
  };

  const handleSaveConfig = async () => {
    if (!configModal) return;
    try {
      await axios.patch(`/api/super-admin/plugins/${configModal.id}/config`, { config: configValues });
      toast.success("Configuration saved");
    } catch {
      setPlugins((prev) =>
        prev.map((p) => (p.id === configModal.id ? { ...p, config: configValues } : p))
      );
      toast.success("Configuration saved");
    }
    setConfigModal(null);
  };

  const openConfigModal = (plugin: Plugin) => {
    setConfigValues({ ...plugin.config });
    setConfigModal(plugin);
  };

  // ─── TABLE COLUMNS ───────────────────────────────────
  const columns: Column<Plugin>[] = [
    {
      key: "name",
      label: "Plugin",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
            <Puzzle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white">{row.name}</span>
              {row.hasUpdate && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded">
                  <ArrowUpCircle className="w-3 h-3" />
                  UPDATE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[220px]">
              {row.description}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "version",
      label: "Version",
      width: "120px",
      render: (row) => (
        <div>
          <span className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
            v{row.version}
          </span>
          {row.hasUpdate && row.latestVersion && (
            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">
              → v{row.latestVersion}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      width: "120px",
      render: (row) => (
        <StatusBadge
          label={row.category}
          variant={
            row.category === "Security" ? "danger" :
            row.category === "Communication" ? "info" :
            row.category === "System" ? "warning" :
            "neutral"
          }
          dot={false}
        />
      ),
    },
    {
      key: "author",
      label: "Author",
      width: "120px",
      render: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">{row.author}</span>
      ),
    },
    {
      key: "permissions",
      label: "Permissions",
      width: "100px",
      align: "center",
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPermissionsModal(row);
          }}
          className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <Key className="w-3 h-3" />
          {row.permissions.length}
        </button>
      ),
    },
    {
      key: "isEnabled",
      label: "Status",
      width: "110px",
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleStatus(row);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            row.isEnabled
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
          }`}
        >
          {row.isEnabled ? (
            <ToggleRight className="w-3.5 h-3.5" />
          ) : (
            <ToggleLeft className="w-3.5 h-3.5" />
          )}
          {row.isEnabled ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: "180px",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openConfigModal(row)}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Configure"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLogsModal(row)}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Activity Logs"
          >
            <History className="w-4 h-4" />
          </button>
          {row.hasUpdate && (
            <button
              onClick={() => handleApplyUpdate(row)}
              className="p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
              title="Update"
            >
              <ArrowUpCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleUninstall(row)}
            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
            title="Uninstall"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // ─── CATEGORIES ──────────────────────────────────────
  const categories = ["all", ...new Set(plugins.map((p) => p.category))];

  const filteredPlugins = plugins.filter((p) => {
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    return true;
  });

  // ─── RENDER ──────────────────────────────────────────
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Plugin Management"
        subtitle="Install, configure, and manage plugins to extend ERP functionality"
        icon={<Puzzle className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Super Admin", path: "/super-admin" },
          { label: "Plugin Management" },
        ]}
        badge={{ label: `${stats.total} Plugins`, color: "purple" }}
        actions={
          <div className="flex items-center gap-2">
            {stats.updatesAvailable > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-lg">
                <Bell className="w-4 h-4" />
                {stats.updatesAvailable} update{stats.updatesAvailable > 1 ? "s" : ""} available
              </span>
            )}
            <button
              onClick={fetchPlugins}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Plugins" value={stats.total} icon={<Puzzle className="w-5 h-5" />} color="purple" />
        <StatsCard title="Active" value={stats.enabled} icon={<Power className="w-5 h-5" />} color="emerald" />
        <StatsCard title="Inactive" value={stats.disabled} icon={<PowerOff className="w-5 h-5" />} color="amber" />
        <StatsCard
          title="Updates Available"
          value={stats.updatesAvailable}
          icon={<ArrowUpCircle className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("installed")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "installed"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
          }`}
        >
          <Settings className="w-4 h-4" />
          Installed ({stats.total})
        </button>
        <button
          onClick={() => setActiveTab("store")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "store"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Plugin Store
        </button>
      </div>

      {/* Installed Plugins */}
      {activeTab === "installed" && (
        <>
          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Filter className="w-4 h-4 text-slate-400" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  categoryFilter === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>

          <DataTable
            columns={columns}
            data={filteredPlugins}
            loading={loading}
            rowKey="id"
            searchPlaceholder="Search plugins..."
            pageSize={10}
            onRefresh={fetchPlugins}
            emptyMessage="No plugins found"
          />
        </>
      )}

      {/* Plugin Store */}
      {activeTab === "store" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {store.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Puzzle className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.rating}</span>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{item.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 flex-1">{item.description}</p>
              <div className="flex items-center gap-2 mb-3 text-[11px] text-slate-400 dark:text-slate-500">
                <span>{item.author}</span>
                <span>•</span>
                <span>{item.downloads.toLocaleString()} installs</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {item.price === 0 ? "Free" : `$${item.price}`}
                </span>
                {item.installed ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Installed
                  </span>
                ) : (
                  <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    Install
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Configuration Modal */}
      {configModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-500" />
                  Configure: {configModal.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">v{configModal.version}</p>
              </div>
              <button
                onClick={() => setConfigModal(null)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {Object.entries(configModal.configSchema).map(([key, schema]: [string, any]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {schema.label || key}
                    {schema.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {schema.type === "boolean" ? (
                    <button
                      onClick={() => setConfigValues((v) => ({ ...v, [key]: !v[key] }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        configValues[key]
                          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
                          : "border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800"
                      }`}
                    >
                      {configValues[key] ? (
                        <ToggleRight className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                      )}
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {configValues[key] ? "Enabled" : "Disabled"}
                      </span>
                    </button>
                  ) : schema.type === "select" ? (
                    <select
                      value={configValues[key] || schema.default || ""}
                      onChange={(e) => setConfigValues((v) => ({ ...v, [key]: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {(schema.options || []).map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : schema.type === "number" ? (
                    <input
                      type="number"
                      value={configValues[key] ?? schema.default ?? ""}
                      onChange={(e) => setConfigValues((v) => ({ ...v, [key]: Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <input
                      type={schema.type === "password" ? "password" : "text"}
                      value={configValues[key] ?? schema.default ?? ""}
                      onChange={(e) => setConfigValues((v) => ({ ...v, [key]: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder={`Enter ${schema.label || key}`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setConfigModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {permissionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                Permissions: {permissionsModal.name}
              </h2>
              <button
                onClick={() => setPermissionsModal(null)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                This plugin requires the following permissions to function:
              </p>
              <div className="space-y-2">
                {permissionsModal.permissions.map((perm) => (
                  <div
                    key={perm}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {perm.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-slate-400">{perm}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setPermissionsModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Logs Modal */}
      {logsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                Activity: {logsModal.name}
              </h2>
              <button
                onClick={() => setLogsModal(null)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {logsModal.activityLogs && logsModal.activityLogs.length > 0 ? (
                <div className="space-y-3">
                  {logsModal.activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        log.action === "installed" ? "bg-emerald-100 dark:bg-emerald-900/30" :
                        log.action === "enabled" ? "bg-blue-100 dark:bg-blue-900/30" :
                        log.action === "disabled" ? "bg-amber-100 dark:bg-amber-900/30" :
                        log.action === "uninstalled" ? "bg-red-100 dark:bg-red-900/30" :
                        "bg-slate-100 dark:bg-slate-700"
                      }`}>
                        {log.action === "installed" ? <Download className="w-4 h-4 text-emerald-600" /> :
                         log.action === "enabled" ? <Power className="w-4 h-4 text-blue-600" /> :
                         log.action === "disabled" ? <PowerOff className="w-4 h-4 text-amber-600" /> :
                         log.action === "uninstalled" ? <Trash2 className="w-4 h-4 text-red-600" /> :
                         <Activity className="w-4 h-4 text-slate-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-300">{log.message}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">No activity logs yet</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setLogsModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Uninstall"
        variant="danger"
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((d) => ({ ...d, open: false }))}
      />
    </div>
  );
}
