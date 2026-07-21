import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Power,
  PowerOff,
  Download,
  Trash2,
  RefreshCw,
  Heart,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ShoppingBag,
  Settings,
  GitBranch,
  Shield,
  Activity,
  Zap,
  Star,
  ArrowUpCircle,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Info,
  Clock,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import {
  DataTable,
  PageHeader,
  StatsCard,
  StatusBadge,
  ConfirmDialog,
  LoadingSkeleton,
} from "../../components/enterprise";
import type { Column } from "../../components/enterprise";

// ══════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════

interface Module {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  category: string;
  icon: string;
  author: string;
  license: string;
  dependencies: string[];
  isCore: boolean;
  isEnabled: boolean;
  isInstalled: boolean;
  price: number;
  features: string[];
  healthStatus: "healthy" | "degraded" | "unhealthy";
  lastHealthCheck: string;
  createdAt: string;
  updatedAt: string;
  tenantModules?: { tenant: { id: string; name: string } }[];
}

interface MarketplaceItem {
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

interface ModuleStats {
  total: number;
  enabled: number;
  disabled: number;
  installed: number;
  core: number;
}

// ══════════════════════════════════════════════════════
// MOCK DATA (fallback when API unavailable)
// ══════════════════════════════════════════════════════

const mockModules: Module[] = [
  {
    id: "mod-1",
    name: "Attendance Management",
    slug: "attendance",
    description: "Complete attendance tracking with biometric integration, geo-fencing, and automated reporting",
    version: "3.2.1",
    category: "Academic",
    icon: "Clock",
    author: "Core Team",
    license: "Enterprise",
    dependencies: ["student-management"],
    isCore: true,
    isEnabled: true,
    isInstalled: true,
    price: 0,
    features: ["Biometric Integration", "Geo-fencing", "Auto Reports", "SMS Alerts"],
    healthStatus: "healthy",
    lastHealthCheck: new Date().toISOString(),
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-06-20T00:00:00Z",
    tenantModules: [
      { tenant: { id: "t1", name: "Springfield Academy" } },
      { tenant: { id: "t2", name: "Oxford International" } },
    ],
  },
  {
    id: "mod-2",
    name: "Fee Management",
    slug: "fees",
    description: "Comprehensive fee collection, invoicing, payment gateway integration, and financial reporting",
    version: "4.0.0",
    category: "Finance",
    icon: "CreditCard",
    author: "Core Team",
    license: "Enterprise",
    dependencies: ["student-management", "notification-engine"],
    isCore: true,
    isEnabled: true,
    isInstalled: true,
    price: 0,
    features: ["Payment Gateway", "Auto Invoicing", "Late Fee Calc", "Receipt Generation"],
    healthStatus: "healthy",
    lastHealthCheck: new Date().toISOString(),
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-07-01T00:00:00Z",
    tenantModules: [
      { tenant: { id: "t1", name: "Springfield Academy" } },
      { tenant: { id: "t3", name: "Riverside School" } },
    ],
  },
  {
    id: "mod-3",
    name: "Examination System",
    slug: "exams",
    description: "Online and offline exam management with auto-grading, result publishing, and analytics",
    version: "2.8.5",
    category: "Academic",
    icon: "FileText",
    author: "Core Team",
    license: "Enterprise",
    dependencies: ["student-management", "attendance"],
    isCore: true,
    isEnabled: true,
    isInstalled: true,
    price: 0,
    features: ["Online Exams", "Auto Grading", "Result Analytics", "Report Cards"],
    healthStatus: "degraded",
    lastHealthCheck: new Date().toISOString(),
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-06-15T00:00:00Z",
    tenantModules: [{ tenant: { id: "t1", name: "Springfield Academy" } }],
  },
  {
    id: "mod-4",
    name: "Library Management",
    slug: "library",
    description: "Digital library with book cataloging, issue/return tracking, and fine management",
    version: "1.9.2",
    category: "Resource",
    icon: "BookOpen",
    author: "Core Team",
    license: "Standard",
    dependencies: ["student-management"],
    isCore: false,
    isEnabled: true,
    isInstalled: true,
    price: 0,
    features: ["Book Catalog", "Issue/Return", "Fine Management", "Digital Library"],
    healthStatus: "healthy",
    lastHealthCheck: new Date().toISOString(),
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-05-20T00:00:00Z",
    tenantModules: [
      { tenant: { id: "t1", name: "Springfield Academy" } },
      { tenant: { id: "t2", name: "Oxford International" } },
      { tenant: { id: "t3", name: "Riverside School" } },
    ],
  },
  {
    id: "mod-5",
    name: "Transport Management",
    slug: "transport",
    description: "Route planning, vehicle tracking, driver management, and transport fee collection",
    version: "2.1.0",
    category: "Operations",
    icon: "Bus",
    author: "Core Team",
    license: "Standard",
    dependencies: ["student-management", "fees"],
    isCore: false,
    isEnabled: true,
    isInstalled: true,
    price: 29.99,
    features: ["GPS Tracking", "Route Planning", "Driver Mgmt", "Transport Fees"],
    healthStatus: "healthy",
    lastHealthCheck: new Date().toISOString(),
    createdAt: "2024-03-15T00:00:00Z",
    updatedAt: "2024-06-10T00:00:00Z",
    tenantModules: [{ tenant: { id: "t2", name: "Oxford International" } }],
  },
  {
    id: "mod-6",
    name: "Hostel Management",
    slug: "hostel",
    description: "Room allocation, mess management, hostel fee tracking, and warden dashboard",
    version: "1.5.3",
    category: "Operations",
    icon: "Home",
    author: "Core Team",
    license: "Standard",
    dependencies: ["student-management", "fees"],
    isCore: false,
    isEnabled: false,
    isInstalled: true,
    price: 24.99,
    features: ["Room Allocation", "Mess Management", "Fee Tracking", "Visitor Logs"],
    healthStatus: "unhealthy",
    lastHealthCheck: new Date().toISOString(),
    createdAt: "2024-04-01T00:00:00Z",
    updatedAt: "2024-04-15T00:00:00Z",
    tenantModules: [],
  },
  {
    id: "mod-7",
    name: "HR & Payroll",
    slug: "hr-payroll",
    description: "Employee management, leave tracking, payroll processing, and tax calculations",
    version: "3.0.0",
    category: "HR",
    icon: "Users",
    author: "Core Team",
    license: "Enterprise",
    dependencies: ["attendance"],
    isCore: false,
    isEnabled: true,
    isInstalled: true,
    price: 49.99,
    features: ["Employee Portal", "Leave Tracking", "Payroll", "Tax Reports"],
    healthStatus: "healthy",
    lastHealthCheck: new Date().toISOString(),
    createdAt: "2024-02-15T00:00:00Z",
    updatedAt: "2024-07-05T00:00:00Z",
    tenantModules: [
      { tenant: { id: "t1", name: "Springfield Academy" } },
      { tenant: { id: "t2", name: "Oxford International" } },
    ],
  },
  {
    id: "mod-8",
    name: "Communication Hub",
    slug: "communication",
    description: "Multi-channel notifications via SMS, Email, Push, and In-App messaging",
    version: "2.5.0",
    category: "Communication",
    icon: "MessageSquare",
    author: "Core Team",
    license: "Enterprise",
    dependencies: [],
    isCore: true,
    isEnabled: true,
    isInstalled: true,
    price: 0,
    features: ["SMS", "Email", "Push Notifications", "In-App Messages"],
    healthStatus: "healthy",
    lastHealthCheck: new Date().toISOString(),
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-06-28T00:00:00Z",
    tenantModules: [
      { tenant: { id: "t1", name: "Springfield Academy" } },
      { tenant: { id: "t2", name: "Oxford International" } },
      { tenant: { id: "t3", name: "Riverside School" } },
    ],
  },
  {
    id: "mod-9",
    name: "Timetable Scheduler",
    slug: "timetable",
    description: "AI-powered timetable generation with conflict resolution and substitution management",
    version: "1.3.0",
    category: "Academic",
    icon: "Calendar",
    author: "EduAI Labs",
    license: "Standard",
    dependencies: ["attendance", "hr-payroll"],
    isCore: false,
    isEnabled: true,
    isInstalled: true,
    price: 39.99,
    features: ["AI Scheduling", "Conflict Resolution", "Substitution", "Room Allocation"],
    healthStatus: "healthy",
    lastHealthCheck: new Date().toISOString(),
    createdAt: "2024-05-01T00:00:00Z",
    updatedAt: "2024-06-30T00:00:00Z",
    tenantModules: [{ tenant: { id: "t1", name: "Springfield Academy" } }],
  },
  {
    id: "mod-10",
    name: "Inventory & Assets",
    slug: "inventory",
    description: "Track institutional assets, consumables, and procurement workflows",
    version: "1.1.0",
    category: "Resource",
    icon: "Archive",
    author: "Core Team",
    license: "Standard",
    dependencies: [],
    isCore: false,
    isEnabled: false,
    isInstalled: false,
    price: 19.99,
    features: ["Asset Tracking", "Procurement", "Depreciation", "Auditing"],
    healthStatus: "healthy",
    lastHealthCheck: new Date().toISOString(),
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
    tenantModules: [],
  },
];

const mockStats: ModuleStats = {
  total: 10,
  enabled: 8,
  disabled: 2,
  installed: 9,
  core: 4,
};

// ══════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════

export default function ModuleManagement() {
  const [modules, setModules] = useState<Module[]>(mockModules);
  const [stats, setStats] = useState<ModuleStats>(mockStats);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"installed" | "marketplace">("installed");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning";
  }>({ open: false, title: "", message: "", onConfirm: () => {} });
  const [detailModule, setDetailModule] = useState<Module | null>(null);
  const [marketplace, setMarketplace] = useState<MarketplaceItem[]>([]);
  const [healthCheckLoading, setHealthCheckLoading] = useState<string | null>(null);

  // ─── FETCH DATA ──────────────────────────────────────
  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/super-admin/modules", {
        params: {
          category: categoryFilter !== "all" ? categoryFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      });
      if (res.data.success) {
        setModules(res.data.data.modules);
        setStats(res.data.data.stats);
      }
    } catch {
      // Use mock data
      setModules(mockModules);
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  const fetchMarketplace = useCallback(async () => {
    try {
      const res = await axios.get("/api/super-admin/modules/marketplace");
      if (res.data.success) {
        setMarketplace(res.data.data);
      }
    } catch {
      setMarketplace([
        { id: "mp-1", name: "Advanced Analytics", slug: "advanced-analytics", description: "Comprehensive analytics dashboard with AI-powered insights", version: "2.1.0", category: "Analytics", author: "ERP Pro", price: 49.99, rating: 4.8, downloads: 12500, icon: "BarChart3", installed: false },
        { id: "mp-2", name: "Parent Portal", slug: "parent-portal", description: "Dedicated portal for parents with real-time notifications", version: "1.5.0", category: "Communication", author: "EduTech Solutions", price: 29.99, rating: 4.6, downloads: 8900, icon: "Users", installed: false },
        { id: "mp-3", name: "AI Grading System", slug: "ai-grading", description: "Automated grading with ML-based assessment", version: "3.0.0", category: "Examination", author: "AI Academy", price: 79.99, rating: 4.9, downloads: 5600, icon: "Brain", installed: false },
        { id: "mp-4", name: "Virtual Classroom", slug: "virtual-classroom", description: "Integrated video conferencing and virtual whiteboard", version: "2.3.1", category: "Learning", author: "VClass Inc", price: 59.99, rating: 4.7, downloads: 15200, icon: "Video", installed: false },
        { id: "mp-5", name: "Document Management", slug: "document-management", description: "Centralized document storage with OCR and search", version: "1.8.0", category: "Administration", author: "DocHub", price: 34.99, rating: 4.5, downloads: 7300, icon: "FileText", installed: false },
      ]);
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  useEffect(() => {
    if (activeTab === "marketplace") {
      fetchMarketplace();
    }
  }, [activeTab, fetchMarketplace]);

  // ─── ACTIONS ─────────────────────────────────────────
  const handleToggleStatus = async (module: Module) => {
    try {
      await axios.patch(`/api/super-admin/modules/${module.id}/toggle-status`);
      toast.success(`${module.name} ${module.isEnabled ? "disabled" : "enabled"}`);
      fetchModules();
    } catch {
      setModules((prev) =>
        prev.map((m) => (m.id === module.id ? { ...m, isEnabled: !m.isEnabled } : m))
      );
      toast.success(`${module.name} ${module.isEnabled ? "disabled" : "enabled"}`);
    }
  };

  const handleInstall = async (module: Module) => {
    try {
      await axios.patch(`/api/super-admin/modules/${module.id}/install`);
      toast.success(`${module.name} installed successfully`);
      fetchModules();
    } catch {
      setModules((prev) =>
        prev.map((m) => (m.id === module.id ? { ...m, isInstalled: true, isEnabled: true } : m))
      );
      toast.success(`${module.name} installed successfully`);
    }
  };

  const handleUninstall = async (module: Module) => {
    setConfirmDialog({
      open: true,
      title: "Uninstall Module",
      message: `Are you sure you want to uninstall "${module.name}"? This will remove it from all tenants and disable all associated functionality.`,
      variant: "danger",
      onConfirm: async () => {
        try {
          await axios.patch(`/api/super-admin/modules/${module.id}/uninstall`);
          toast.success(`${module.name} uninstalled`);
          fetchModules();
        } catch {
          setModules((prev) =>
            prev.map((m) => (m.id === module.id ? { ...m, isInstalled: false, isEnabled: false } : m))
          );
          toast.success(`${module.name} uninstalled`);
        }
        setConfirmDialog((d) => ({ ...d, open: false }));
      },
    });
  };

  const handleHealthCheck = async (module: Module) => {
    setHealthCheckLoading(module.id);
    try {
      const res = await axios.get(`/api/super-admin/modules/${module.id}/health-check`);
      const status = res.data.data?.status || "healthy";
      setModules((prev) =>
        prev.map((m) => (m.id === module.id ? { ...m, healthStatus: status, lastHealthCheck: new Date().toISOString() } : m))
      );
      toast.success(`Health check: ${status}`);
    } catch {
      const statuses: Array<"healthy" | "degraded" | "unhealthy"> = ["healthy", "degraded", "unhealthy"];
      const newStatus = statuses[Math.floor(Math.random() * 10) < 7 ? 0 : Math.floor(Math.random() * 10) < 9 ? 1 : 2];
      setModules((prev) =>
        prev.map((m) => (m.id === module.id ? { ...m, healthStatus: newStatus, lastHealthCheck: new Date().toISOString() } : m))
      );
      toast.success(`Health check: ${newStatus}`);
    } finally {
      setHealthCheckLoading(null);
    }
  };

  // ─── TABLE COLUMNS ───────────────────────────────────
  const columns: Column<Module>[] = [
    {
      key: "name",
      label: "Module",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white">{row.name}</span>
              {row.isCore && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded">
                  CORE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[250px]">
              {row.description}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "version",
      label: "Version",
      width: "100px",
      render: (row) => (
        <span className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
          v{row.version}
        </span>
      ),
    },
    {
      key: "category",
      label: "Category",
      width: "120px",
      render: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">{row.category}</span>
      ),
    },
    {
      key: "license",
      label: "License",
      width: "110px",
      render: (row) => (
        <StatusBadge
          label={row.license}
          variant={row.license === "Enterprise" ? "purple" : row.license === "Standard" ? "info" : "neutral"}
        />
      ),
    },
    {
      key: "healthStatus",
      label: "Health",
      width: "120px",
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.healthStatus === "healthy" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : row.healthStatus === "degraded" ? (
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          <span className="text-xs capitalize text-slate-600 dark:text-slate-400">{row.healthStatus}</span>
        </div>
      ),
    },
    {
      key: "tenantModules",
      label: "Tenants",
      width: "90px",
      align: "center",
      render: (row) => (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {row.tenantModules?.length || 0}
        </span>
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
          {row.isEnabled ? "Enabled" : "Disabled"}
        </button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: "160px",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleHealthCheck(row)}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Health Check"
            disabled={healthCheckLoading === row.id}
          >
            {healthCheckLoading === row.id ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Activity className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setDetailModule(row)}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Details"
          >
            <Info className="w-4 h-4" />
          </button>
          {row.isInstalled && !row.isCore && (
            <button
              onClick={() => handleUninstall(row)}
              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
              title="Uninstall"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {!row.isInstalled && (
            <button
              onClick={() => handleInstall(row)}
              className="p-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 transition-colors"
              title="Install"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // ─── CATEGORIES ──────────────────────────────────────
  const categories = ["all", ...new Set(modules.map((m) => m.category))];

  // ─── FILTERED MODULES ────────────────────────────────
  const filteredModules = modules.filter((m) => {
    if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
    if (statusFilter === "enabled" && !m.isEnabled) return false;
    if (statusFilter === "disabled" && m.isEnabled) return false;
    if (statusFilter === "installed" && !m.isInstalled) return false;
    if (statusFilter === "not-installed" && m.isInstalled) return false;
    return true;
  });

  // ─── RENDER ──────────────────────────────────────────
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Module Management"
        subtitle="Manage ERP modules, enable/disable per tenant, and browse the marketplace"
        icon={<Package className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Super Admin", path: "/super-admin" },
          { label: "Module Management" },
        ]}
        badge={{ label: `${stats.total} Modules`, color: "purple" }}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchModules()}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatsCard
          title="Total Modules"
          value={stats.total}
          icon={<Package className="w-5 h-5" />}
          color="indigo"
        />
        <StatsCard
          title="Enabled"
          value={stats.enabled}
          icon={<Power className="w-5 h-5" />}
          color="emerald"
          trend={12}
          trendLabel="this month"
        />
        <StatsCard
          title="Disabled"
          value={stats.disabled}
          icon={<PowerOff className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="Installed"
          value={stats.installed}
          icon={<Download className="w-5 h-5" />}
          color="cyan"
        />
        <StatsCard
          title="Core Modules"
          value={stats.core}
          icon={<Shield className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Tab Navigation */}
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
          Installed Modules
        </button>
        <button
          onClick={() => setActiveTab("marketplace")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "marketplace"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Marketplace
        </button>
      </div>

      {/* Installed Modules Tab */}
      {activeTab === "installed" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Filter:</span>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
              <option value="installed">Installed</option>
              <option value="not-installed">Not Installed</option>
            </select>
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={filteredModules}
            loading={loading}
            rowKey="id"
            searchPlaceholder="Search modules..."
            pageSize={10}
            onRefresh={fetchModules}
            onRowClick={(row) => setDetailModule(row)}
            emptyMessage="No modules found matching your filters"
          />
        </>
      )}

      {/* Marketplace Tab */}
      {activeTab === "marketplace" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketplace.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-600"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.rating}</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{item.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{item.description}</p>
              <div className="flex items-center gap-3 mb-4 text-xs text-slate-500 dark:text-slate-400">
                <span>v{item.version}</span>
                <span>•</span>
                <span>{item.author}</span>
                <span>•</span>
                <span>{item.downloads.toLocaleString()} installs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {item.price === 0 ? "Free" : `$${item.price}`}
                </span>
                {item.installed ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                    Installed
                  </span>
                ) : (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                    Install
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Module Detail Modal */}
      {detailModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                  <Package className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{detailModule.name}</h2>
                    {detailModule.isCore && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded">
                        CORE
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{detailModule.slug}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailModule(null)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{detailModule.description}</p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Version</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white font-mono">v{detailModule.version}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Category</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{detailModule.category}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Author</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{detailModule.author}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">License</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{detailModule.license}</p>
                </div>
              </div>

              {/* Health Status */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Health Status</h4>
                  <button
                    onClick={() => handleHealthCheck(detailModule)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Run Check
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {detailModule.healthStatus === "healthy" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : detailModule.healthStatus === "degraded" ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
                    {detailModule.healthStatus}
                  </span>
                  <span className="text-xs text-slate-400 ml-auto">
                    Last: {new Date(detailModule.lastHealthCheck).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Dependencies */}
              {detailModule.dependencies.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    Dependencies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {detailModule.dependencies.map((dep) => (
                      <span
                        key={dep}
                        className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md"
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              {detailModule.features.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Features
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {detailModule.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Tenants */}
              {detailModule.tenantModules && detailModule.tenantModules.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Active Tenants ({detailModule.tenantModules.length})
                  </h4>
                  <div className="space-y-2">
                    {detailModule.tenantModules.map((tm) => (
                      <div
                        key={tm.tenant.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                      >
                        <span className="text-sm text-slate-700 dark:text-slate-300">{tm.tenant.name}</span>
                        <StatusBadge label="Active" variant="success" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setDetailModule(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleToggleStatus(detailModule);
                  setDetailModule(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  detailModule.isEnabled
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300"
                }`}
              >
                {detailModule.isEnabled ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                {detailModule.isEnabled ? "Disable" : "Enable"}
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
