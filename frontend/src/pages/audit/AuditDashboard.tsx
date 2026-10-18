import { useState, useEffect } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  Activity,
  Eye,
  Shield,
  Clock,
  Users,
  Download,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Plus,
  Printer,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Monitor,
  Smartphone,
  Globe,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface AuditStats {
  actionsToday: number;
  activeUsersToday: number;
  loginsToday: number;
  exportsToday: number;
  totalLogs: number;
}

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  entityId?: string;
  entityType?: string;
  previousData?: any;
  newData?: any;
  changes?: any[];
  ipAddress?: string;
  browser?: string;
  device?: string;
  os?: string;
  isRollbackable: boolean;
  rolledBack: boolean;
  createdAt: string;
}

interface TopUser {
  userId: string;
  userName: string;
  count: number;
}

interface WeeklyTrend {
  date: string;
  day: string;
  count: number;
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

const ACTION_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  CREATE: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: Plus, label: "Created" },
  UPDATE: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Edit, label: "Updated" },
  DELETE: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: Trash2, label: "Deleted" },
  LOGIN: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: LogIn, label: "Logged In" },
  LOGOUT: { color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", icon: LogOut, label: "Logged Out" },
  EXPORT: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: Download, label: "Exported" },
  PRINT: { color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400", icon: Printer, label: "Printed" },
  APPROVE: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle, label: "Approved" },
  REJECT: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle, label: "Rejected" },
  VIEW: { color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", icon: Eye, label: "Viewed" },
  ROLLBACK: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: RotateCcw, label: "Rolled Back" },
};

const CHART_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316"];

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export default function AuditDashboard() {
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [topModules, setTopModules] = useState<any[]>([]);
  const [actionBreakdown, setActionBreakdown] = useState<any[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "logins">("overview");

  // ─────────────────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────────────────

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
    }
  }, [activeTab, page, filterModule, filterAction, filterDate, search]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get(getFullUrl("/api/audit/stats"));
      const { stats, topUsers, topModules, actionBreakdown, recentLogs, weeklyTrend } = res.data.data;
      setStats(stats);
      setTopUsers(topUsers);
      setTopModules(topModules);
      setActionBreakdown(actionBreakdown);
      setRecentLogs(recentLogs);
      setWeeklyTrend(weeklyTrend);
    } catch (error) {
      console.error("Failed to fetch audit stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const params: any = { page, limit: 20 };
      if (filterModule) params.module = filterModule;
      if (filterAction) params.action = filterAction;
      if (filterDate) params.startDate = filterDate;
      if (search) params.search = search;

      const res = await axios.get(getFullUrl("/api/audit/logs"), { params });
      setLogs(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleRollback = async (logId: string) => {
    if (!confirm("Are you sure you want to rollback this change?")) return;
    try {
      await axios.post(getFullUrl(`/api/audit/rollback/${logId}`));
      fetchLogs();
      fetchStats();
    } catch (error: any) {
      alert(error.response?.data?.message || "Rollback failed");
    }
  };

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit & Activity Log</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track all system activities, user actions, and changes
          </p>
        </div>
        <button
          onClick={() => { fetchStats(); fetchLogs(); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-slate-700">
        <nav className="flex gap-6">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "logs", label: "Activity Logs", icon: Shield },
            { id: "logins", label: "Login History", icon: LogIn },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors text-sm font-medium ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Actions Today", value: stats?.actionsToday || 0, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950" },
              { label: "Active Users", value: stats?.activeUsersToday || 0, icon: Users, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
              { label: "Logins Today", value: stats?.loginsToday || 0, icon: LogIn, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
              { label: "Exports Today", value: stats?.exportsToday || 0, icon: Download, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950" },
              { label: "Total Logs", value: stats?.totalLogs?.toLocaleString("en-IN") || 0, icon: Shield, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950" },
            ].map((card, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <card.icon size={20} className={card.color} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{card.label}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Activity Trend */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Weekly Activity Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={weeklyTrend}>
                  <defs>
                    <linearGradient id="auditGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#4f46e5" fill="url(#auditGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Action Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Today's Actions</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={actionBreakdown}
                    dataKey="count"
                    nameKey="action"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={2}
                    label={({ action, count }: any) => `${action}: ${count}`}
                    labelLine={false}
                  >
                    {actionBreakdown.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Row: Top Users + Top Modules + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Users */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Most Active Users (This Week)</h3>
              <div className="space-y-3">
                {topUsers.map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600">
                        {user.userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{user.userName}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{user.count}</span>
                  </div>
                ))}
                {topUsers.length === 0 && (
                  <p className="text-sm text-gray-400">No activity this week</p>
                )}
              </div>
            </div>

            {/* Top Modules */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Most Used Modules</h3>
              <div className="space-y-3">
                {topModules.map((mod: any, idx: number) => {
                  const maxCount = topModules[0]?.count || 1;
                  const percentage = Math.round((mod.count / maxCount) * 100);
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300 capitalize">{mod.module}</span>
                        <span className="text-gray-500 dark:text-gray-400">{mod.count}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%`, backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {recentLogs.map((log, idx) => {
                  const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.VIEW;
                  const ActionIcon = config.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                        <ActionIcon size={13} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                          <span className="font-medium">{log.userName}</span> {config.label.toLowerCase()}{" "}
                          <span className="capitalize">{log.entityType || log.module}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(log.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by user, module..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterModule}
                onChange={(e) => { setFilterModule(e.target.value); setPage(1); }}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="">All Modules</option>
                {["students", "teachers", "fees", "attendance", "exam", "transport", "library", "hostel", "hr", "communication", "settings"].map((m) => (
                  <option key={m} value={m} className="capitalize">{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
              <select
                value={filterAction}
                onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="">All Actions</option>
                {["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "EXPORT", "PRINT", "APPROVE", "REJECT"].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            {logsLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Module</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Entity</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">IP / Device</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Time</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {logs.map((log) => {
                      const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.VIEW;
                      const ActionIcon = config.icon;
                      return (
                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600">
                                {log.userName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{log.userName}</p>
                                <p className="text-xs text-gray-400">{log.userRole}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                              <ActionIcon size={11} />
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{log.module}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {log.entityType || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Globe size={11} />
                                {log.ipAddress || "N/A"}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                {log.device === "mobile" ? <Smartphone size={11} /> : <Monitor size={11} />}
                                {log.browser || "Unknown"}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(log.createdAt)}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => { setSelectedLog(log); setShowDetail(true); }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors"
                                title="View Details"
                              >
                                <Eye size={14} />
                              </button>
                              {log.isRollbackable && !log.rolledBack && (
                                <button
                                  onClick={() => handleRollback(log.id)}
                                  className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 transition-colors"
                                  title="Rollback"
                                >
                                  <RotateCcw size={14} />
                                </button>
                              )}
                              {log.rolledBack && (
                                <span className="text-xs text-amber-500 font-medium">Rolled Back</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                          No audit logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Login History Tab */}
      {activeTab === "logins" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Login / Logout History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Browser</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Device</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {recentLogs
                  .filter((l) => ["LOGIN", "LOGOUT"].includes(l.action))
                  .map((log, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{log.userName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.action === "LOGIN"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                        }`}>
                          {log.action === "LOGIN" ? <LogIn size={11} /> : <LogOut size={11} />}
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{log.ipAddress || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{log.browser || "Unknown"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{log.device || "Desktop"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(log.createdAt)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">-</td>
                    </tr>
                  ))}
                {recentLogs.filter((l) => ["LOGIN", "LOGOUT"].includes(l.action)).length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      No login history available. Login events will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Audit Log Detail</h2>
              <button
                onClick={() => setShowDetail(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <XCircle size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">User</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedLog.userName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Role</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedLog.userRole}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Action</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Module</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 capitalize">{selectedLog.module}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Time</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{formatDateTime(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">IP Address</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedLog.ipAddress || "N/A"}</p>
                </div>
              </div>

              {/* Changes Diff */}
              {selectedLog.changes && selectedLog.changes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Changes</h3>
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-600">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Field</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-red-500">Before</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-green-500">After</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                        {selectedLog.changes.map((change: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300">{change.field}</td>
                            <td className="px-3 py-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10">
                              {JSON.stringify(change.oldValue) || "—"}
                            </td>
                            <td className="px-3 py-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10">
                              {JSON.stringify(change.newValue) || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Rollback button */}
              {selectedLog.isRollbackable && !selectedLog.rolledBack && (
                <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                  <button
                    onClick={() => { handleRollback(selectedLog.id); setShowDetail(false); }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <RotateCcw size={16} />
                    Rollback This Change
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
