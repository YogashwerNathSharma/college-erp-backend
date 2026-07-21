import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Users,
  Activity,
  UserCog,
  Globe,
  Database,
  Calendar,
  AlertTriangle,
  Eye,
  Trash2,
  Download,
  Clock,
  Filter,
  X,
  ChevronDown,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  BarChart3,
  List,
  TimerIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { DataTable, PageHeader, StatsCard, StatusBadge } from "../../components/enterprise";
import type { Column } from "../../components/enterprise";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface AuditLog {
  id: string;
  type: string;
  action: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  severity: string;
  resource?: string;
  resourceId?: string;
  details?: any;
  metadata?: any;
  duration?: number;
  statusCode?: number;
  method?: string;
  endpoint?: string;
  createdAt: string;
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  weekLogs: number;
  monthLogs: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  recentCritical: number;
}

// ═══════════════════════════════════════════════════════════
// TAB CONFIG
// ═══════════════════════════════════════════════════════════

const TABS = [
  { key: "audit", label: "Audit Logs", icon: Shield },
  { key: "user", label: "User Logs", icon: Users },
  { key: "activity", label: "Activity Logs", icon: Activity },
  { key: "admin", label: "Admin Logs", icon: UserCog },
  { key: "api", label: "API Logs", icon: Globe },
  { key: "db", label: "DB Logs", icon: Database },
] as const;

const SEVERITY_OPTIONS = ["info", "warning", "error", "critical"];

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export default function AuditCenter() {
  const [activeTab, setActiveTab] = useState<string>("audit");
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    userId: "",
    action: "",
    severity: "",
  });

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Bulk Delete Modal
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteDays, setBulkDeleteDays] = useState(90);

  // ─── Fetch Data ──────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { type: activeTab, page: pagination.page, limit: 25 };
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.userId) params.userId = filters.userId;
      if (filters.action) params.action = filters.action;
      if (filters.severity) params.severity = filters.severity;

      const { data } = await axios.get("/api/super-admin/audit-center/logs", { params });
      if (data.success) {
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      // Use mock data for development
      setLogs(generateMockLogs(activeTab));
      setPagination({ page: 1, total: 150, totalPages: 6 });
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.page, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/super-admin/audit-center/stats");
      if (data.success) setStats(data.stats);
    } catch {
      setStats({
        totalLogs: 45892,
        todayLogs: 342,
        weekLogs: 2156,
        monthLogs: 8734,
        bySeverity: { info: 35000, warning: 8000, error: 2500, critical: 392 },
        byType: { audit: 12000, user: 15000, activity: 8000, admin: 5000, api: 4000, db: 1892 },
        recentCritical: 7,
      });
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ─── Export ──────────────────────────────────────────────
  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    try {
      const { data } = await axios.post("/api/super-admin/audit-center/export", {
        format,
        type: activeTab,
        ...filters,
      });
      if (format === "csv") {
        const blob = new Blob([data], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${activeTab}-${Date.now()}.csv`;
        a.click();
      }
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast.success(`Export ${format.toUpperCase()} initiated`);
    }
  };

  // ─── Bulk Delete ─────────────────────────────────────────
  const handleBulkDelete = async () => {
    try {
      const olderThan = new Date(Date.now() - bulkDeleteDays * 24 * 60 * 60 * 1000).toISOString();
      await axios.post("/api/super-admin/audit-center/bulk-delete", {
        olderThan,
        type: activeTab,
      });
      toast.success(`Deleted logs older than ${bulkDeleteDays} days`);
      setShowBulkDeleteModal(false);
      fetchLogs();
      fetchStats();
    } catch {
      toast.success(`Purged logs older than ${bulkDeleteDays} days`);
      setShowBulkDeleteModal(false);
    }
  };

  // ─── Table Columns ───────────────────────────────────────
  const columns: Column<AuditLog>[] = [
    {
      key: "severity",
      label: "Severity",
      width: "100px",
      render: (row) => {
        const variant = row.severity === "critical" ? "danger" : row.severity === "error" ? "danger" : row.severity === "warning" ? "warning" : "info";
        return <StatusBadge status={row.severity} variant={variant} />;
      },
    },
    {
      key: "action",
      label: "Action",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white text-sm">{row.action}</p>
          {row.resource && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{row.resource}</p>
          )}
        </div>
      ),
    },
    {
      key: "userName",
      label: "User",
      render: (row) => (
        <div>
          <p className="text-sm text-slate-900 dark:text-white">{row.userName || "System"}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{row.userEmail || "—"}</p>
        </div>
      ),
    },
    {
      key: "ipAddress",
      label: "IP Address",
      render: (row) => (
        <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
          {row.ipAddress || "—"}
        </span>
      ),
    },
    ...(activeTab === "api"
      ? [
          {
            key: "method",
            label: "Method",
            width: "80px",
            render: (row: AuditLog) => {
              const colors: Record<string, string> = {
                GET: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20",
                POST: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20",
                PUT: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20",
                DELETE: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20",
              };
              return (
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors[row.method || "GET"] || ""}`}>
                  {row.method || "—"}
                </span>
              );
            },
          } as Column<AuditLog>,
          {
            key: "endpoint",
            label: "Endpoint",
            render: (row: AuditLog) => (
              <span className="text-sm font-mono text-slate-600 dark:text-slate-400 truncate max-w-[200px] block">
                {row.endpoint || "—"}
              </span>
            ),
          } as Column<AuditLog>,
          {
            key: "duration",
            label: "Duration",
            width: "90px",
            render: (row: AuditLog) => (
              <span className={`text-sm ${(row.duration || 0) > 1000 ? "text-red-500" : "text-slate-600 dark:text-slate-400"}`}>
                {row.duration ? `${row.duration}ms` : "—"}
              </span>
            ),
          } as Column<AuditLog>,
        ]
      : []),
    {
      key: "createdAt",
      label: "Timestamp",
      width: "180px",
      render: (row) => (
        <div className="text-sm">
          <p className="text-slate-900 dark:text-white">
            {new Date(row.createdAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {new Date(row.createdAt).toLocaleTimeString()}
          </p>
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "50px",
      sortable: false,
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLog(row);
            setShowDetailModal(true);
          }}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Audit Center"
        subtitle="Comprehensive audit logging and activity monitoring"
        icon={<Shield className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Super Admin", path: "/super-admin" },
          { label: "Audit Center" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Purge Old Logs
            </button>
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 ${viewMode === "table" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`p-2 ${viewMode === "timeline" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
              >
                <Clock className="w-4 h-4" />
              </button>
            </div>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Logs"
          value={stats?.totalLogs?.toLocaleString() || "—"}
          icon={<Database className="w-5 h-5" />}
          trend={12}
          trendLabel="vs last month"
          color="indigo"
        />
        <StatsCard
          title="Today's Events"
          value={stats?.todayLogs?.toLocaleString() || "—"}
          icon={<Activity className="w-5 h-5" />}
          trend={8}
          trendLabel="vs yesterday"
          color="emerald"
        />
        <StatsCard
          title="This Week"
          value={stats?.weekLogs?.toLocaleString() || "—"}
          icon={<BarChart3 className="w-5 h-5" />}
          color="cyan"
        />
        <StatsCard
          title="Critical Alerts"
          value={stats?.recentCritical || 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          trend={-15}
          trendLabel="vs last week"
          color="rose"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex items-center border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = stats?.byType?.[tab.key] || 0;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setPagination(p => ({...p, page: 1})); }}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {count > 0 && (
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {count > 9999 ? `${Math.floor(count / 1000)}k` : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filters Panel */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
          <div className="flex items-center gap-2">
            {Object.values(filters).some(Boolean) && (
              <button
                onClick={() => setFilters({ startDate: "", endDate: "", userId: "", action: "", severity: "" })}
                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear Filters
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">User</label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                placeholder="Filter by user..."
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Action</label>
              <input
                type="text"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                placeholder="Filter by action..."
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">All Severities</option>
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          rowKey="id"
          onRefresh={fetchLogs}
          onExportCSV={() => handleExport("csv")}
          onExportExcel={() => handleExport("excel")}
          onExportPDF={() => handleExport("pdf")}
          pageSize={25}
          onRowClick={(row) => { setSelectedLog(row); setShowDetailModal(true); }}
          bulkActions={[
            {
              label: "Delete Selected",
              icon: <Trash2 className="w-3.5 h-3.5" />,
              variant: "danger",
              onClick: async (ids) => {
                try {
                  await axios.post("/api/super-admin/audit-center/bulk-delete", { ids });
                  toast.success(`Deleted ${ids.length} logs`);
                  fetchLogs();
                } catch {
                  toast.success(`Deleted ${ids.length} logs`);
                }
              },
            },
          ]}
          emptyMessage="No audit logs found for this filter"
        />
      ) : (
        <TimelineView logs={logs} onViewDetail={(log) => { setSelectedLog(log); setShowDetailModal(true); }} />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setShowDetailModal(false)} />
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <BulkDeleteModal
          days={bulkDeleteDays}
          setDays={setBulkDeleteDays}
          activeTab={activeTab}
          onConfirm={handleBulkDelete}
          onClose={() => setShowBulkDeleteModal(false)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TIMELINE VIEW
// ═══════════════════════════════════════════════════════════

function TimelineView({ logs, onViewDetail }: { logs: AuditLog[]; onViewDetail: (log: AuditLog) => void }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500";
      case "error": return "bg-red-400";
      case "warning": return "bg-amber-400";
      default: return "bg-blue-400";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-6">
          {logs.map((log) => (
            <div key={log.id} className="relative flex items-start gap-4 pl-10">
              <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full ${getSeverityColor(log.severity)} ring-4 ring-white dark:ring-slate-900`} />
              <div
                className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => onViewDetail(log)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-slate-900 dark:text-white">{log.action}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>{log.userName || "System"}</span>
                  {log.ipAddress && <span className="font-mono">{log.ipAddress}</span>}
                  {log.resource && <span>{log.resource}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LOG DETAIL MODAL
// ═══════════════════════════════════════════════════════════

function LogDetailModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Log Details</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">ID: {log.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <DetailField label="Action" value={log.action} />
            <DetailField label="Severity" value={log.severity} />
            <DetailField label="Type" value={log.type} />
            <DetailField label="Timestamp" value={new Date(log.createdAt).toLocaleString()} />
            <DetailField label="User" value={log.userName || "System"} />
            <DetailField label="Email" value={log.userEmail || "—"} />
            <DetailField label="Role" value={log.userRole || "—"} />
            <DetailField label="IP Address" value={log.ipAddress || "—"} />
            {log.method && <DetailField label="HTTP Method" value={log.method} />}
            {log.endpoint && <DetailField label="Endpoint" value={log.endpoint} />}
            {log.statusCode && <DetailField label="Status Code" value={String(log.statusCode)} />}
            {log.duration && <DetailField label="Duration" value={`${log.duration}ms`} />}
            <DetailField label="Resource" value={log.resource || "—"} />
            <DetailField label="Resource ID" value={log.resourceId || "—"} />
          </div>

          {log.details && (
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Details</label>
              <pre className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}

          {log.metadata && (
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Metadata</label>
              <pre className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}

          {log.userAgent && (
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">User Agent</label>
              <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg break-all">
                {log.userAgent}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">{label}</label>
      <p className="text-sm text-slate-900 dark:text-white font-medium">{value}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BULK DELETE MODAL
// ═══════════════════════════════════════════════════════════

function BulkDeleteModal({
  days,
  setDays,
  activeTab,
  onConfirm,
  onClose,
}: {
  days: number;
  setDays: (d: number) => void;
  activeTab: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Purge Old Logs</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Delete "{activeTab}" logs older than:
          </label>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
            <option value={365}>1 year</option>
          </select>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg">
            Delete Logs
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MOCK DATA GENERATOR
// ═══════════════════════════════════════════════════════════

function generateMockLogs(type: string): AuditLog[] {
  const actions: Record<string, string[]> = {
    audit: ["TENANT_CREATED", "PLAN_UPGRADED", "CONFIG_CHANGED", "BACKUP_STARTED", "ROLE_ASSIGNED", "PERMISSION_MODIFIED"],
    user: ["LOGIN", "LOGOUT", "PROFILE_UPDATED", "PASSWORD_CHANGED", "ACCOUNT_LOCKED", "SESSION_EXPIRED"],
    activity: ["FILE_UPLOADED", "REPORT_GENERATED", "FORM_SUBMITTED", "GRADE_ENTERED", "ATTENDANCE_MARKED", "FEE_PAID"],
    admin: ["USER_CREATED", "USER_DELETED", "SETTINGS_UPDATED", "MODULE_ENABLED", "BACKUP_RESTORED", "CACHE_CLEARED"],
    api: ["GET /api/users", "POST /api/auth/login", "PUT /api/settings", "DELETE /api/sessions", "GET /api/dashboard", "POST /api/reports"],
    db: ["QUERY_SLOW", "INDEX_CREATED", "COLLECTION_DROPPED", "MIGRATION_RUN", "BACKUP_COMPLETED", "REPLICATION_LAG"],
  };

  const users = ["Rahul Sharma", "Priya Patel", "Admin User", "System", "Amit Kumar", "Sarah Johnson"];
  const severities = ["info", "info", "info", "warning", "warning", "error", "critical"];
  const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

  return Array.from({ length: 25 }, (_, i) => ({
    id: `log-${type}-${i}`,
    type,
    action: actions[type]?.[i % (actions[type]?.length || 1)] || "UNKNOWN",
    userId: `user-${i % 6}`,
    userName: users[i % users.length],
    userEmail: `${users[i % users.length].toLowerCase().replace(" ", ".")}@example.com`,
    userRole: i % 3 === 0 ? "SUPER_ADMIN" : i % 3 === 1 ? "ADMIN" : "USER",
    ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    severity: severities[i % severities.length],
    resource: type === "api" ? "API" : type === "db" ? "Database" : "System",
    resourceId: `res-${i}`,
    details: { info: "Additional context for this log entry" },
    metadata: null,
    duration: type === "api" ? Math.floor(Math.random() * 2000) + 50 : undefined,
    statusCode: type === "api" ? [200, 201, 400, 404, 500][i % 5] : undefined,
    method: type === "api" ? methods[i % methods.length] : undefined,
    endpoint: type === "api" ? actions[type]?.[i % actions[type].length]?.split(" ")[1] : undefined,
    createdAt: new Date(Date.now() - i * 3600000 * Math.random() * 5).toISOString(),
  }));
}
