import { useState, useEffect } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  Layers,
  Play,
  RotateCcw,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Settings,
  AlertTriangle,
  Loader2,
  Activity,
  Server,
  Gauge,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// ══════════════════════════════════════════════════════════
// QUEUE MONITOR - Frontend Dashboard
// Real-time queue monitoring and management
// ══════════════════════════════════════════════════════════

interface QueueJob {
  id: string;
  type: string;
  payload: any;
  priority: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  processedAt?: string;
  completedAt?: string;
  createdAt: string;
}

interface QueueStats {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  retrying: number;
  byType: Record<string, Record<string, number>>;
  recentCompleted: any[];
  recentFailed: any[];
}

interface QueueConfigItem {
  type: string;
  maxConcurrent: number;
  retryDelay: number;
  maxRetries: number;
  isActive: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  NORMAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  LOW: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const STATUS_STYLES: Record<string, { bg: string; icon: any }> = {
  QUEUED: { bg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  PROCESSING: { bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Loader2 },
  COMPLETED: { bg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  FAILED: { bg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  RETRYING: { bg: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: RotateCcw },
};

const TYPE_LABELS: Record<string, string> = {
  SMS: "📱 SMS",
  EMAIL: "📧 Email",
  PDF_GENERATION: "📄 PDF Generation",
  BACKUP: "💾 Backup",
  BULK_OPERATION: "⚡ Bulk Operation",
  REPORT: "📊 Report",
};

const CHART_COLORS = ["#eab308", "#3b82f6", "#10b981", "#ef4444", "#a855f7"];

export default function QueueMonitor() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [configs, setConfigs] = useState<QueueConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "jobs" | "config">("overview");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<QueueConfigItem | null>(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const tenantId = user.tenantId;

  useEffect(() => {
    fetchData();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, jobsRes, configRes] = await Promise.all([
        axios.get(getFullUrl(`/api/${tenantId}/queue/status`)),
        axios.get(getFullUrl(`/api/${tenantId}/queue/jobs?limit=50`)),
        axios.get(getFullUrl(`/api/${tenantId}/queue/config`)),
      ]);
      setStats(statsRes.data.data);
      setJobs(jobsRes.data.data || []);
      setConfigs(configRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch queue data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (jobId: string) => {
    try {
      await axios.post(getFullUrl(`/api/${tenantId}/queue/retry/${jobId}`));
      fetchData();
    } catch (err) {
      console.error("Retry failed:", err);
    }
  };

  const handleRetryAll = async () => {
    if (!confirm("Retry all failed jobs?")) return;
    try {
      await axios.post(getFullUrl(`/api/${tenantId}/queue/retry-all`));
      fetchData();
    } catch (err) {
      console.error("Retry all failed:", err);
    }
  };

  const handleCancel = async (jobId: string) => {
    try {
      await axios.delete(getFullUrl(`/api/${tenantId}/queue/jobs/${jobId}`));
      fetchData();
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  };

  const handleTriggerProcessing = async () => {
    try {
      await axios.post(getFullUrl(`/api/${tenantId}/queue/process`));
      fetchData();
    } catch (err) {
      console.error("Trigger failed:", err);
    }
  };

  const handleUpdateConfig = async () => {
    if (!editingConfig) return;
    try {
      await axios.put(getFullUrl(`/api/${tenantId}/queue/config`), editingConfig);
      setShowConfigModal(false);
      setEditingConfig(null);
      fetchData();
    } catch (err) {
      console.error("Config update failed:", err);
    }
  };

  const handleCleanup = async () => {
    if (!confirm("Delete completed jobs older than 30 days?")) return;
    try {
      const res = await axios.post(getFullUrl(`/api/${tenantId}/queue/cleanup`), { olderThanDays: 30 });
      alert(res.data.message);
      fetchData();
    } catch (err) {
      console.error("Cleanup failed:", err);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const filteredJobs = jobs.filter((j) => {
    const matchesType = !filterType || j.type === filterType;
    const matchesStatus = !filterStatus || j.status === filterStatus;
    return matchesType && matchesStatus;
  });

  // Prepare donut chart data
  const chartData = stats
    ? [
        { name: "Queued", value: stats.queued, color: "#eab308" },
        { name: "Processing", value: stats.processing, color: "#3b82f6" },
        { name: "Completed", value: stats.completed, color: "#10b981" },
        { name: "Failed", value: stats.failed, color: "#ef4444" },
        { name: "Retrying", value: stats.retrying, color: "#a855f7" },
      ].filter((d) => d.value > 0)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="w-7 h-7 text-indigo-600" />
            Queue Monitor
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Background job processing and management
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTriggerProcessing}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Play size={16} />
            Process Queue
          </button>
          <button
            onClick={fetchData}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={stats?.total || 0} icon={<Layers size={20} />} color="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300" />
        <StatCard label="Queued" value={stats?.queued || 0} icon={<Clock size={20} />} color="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400" />
        <StatCard label="Processing" value={stats?.processing || 0} icon={<Zap size={20} />} color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
        <StatCard label="Completed" value={stats?.completed || 0} icon={<CheckCircle2 size={20} />} color="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
        <StatCard label="Failed" value={stats?.failed || 0} icon={<XCircle size={20} />} color="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
        <StatCard label="Retrying" value={stats?.retrying || 0} icon={<RotateCcw size={20} />} color="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          {[
            { key: "overview", label: "Overview", icon: <Gauge size={16} /> },
            { key: "jobs", label: "All Jobs", icon: <Activity size={16} /> },
            { key: "config", label: "Configuration", icon: <Settings size={16} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Queue Distribution</h3>
            {chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No jobs in queue
              </div>
            )}
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {chartData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-gray-600 dark:text-gray-400">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Type Breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">By Job Type</h3>
            <div className="space-y-3">
              {Object.entries(stats?.byType || {}).map(([type, statuses]) => {
                const total = Object.values(statuses).reduce((sum, n) => sum + n, 0);
                return (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {TYPE_LABELS[type] || type}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{total}</span>
                      {(statuses as any)["FAILED"] > 0 && (
                        <span className="text-xs text-red-500">({(statuses as any)["FAILED"]} failed)</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {Object.keys(stats?.byType || {}).length === 0 && (
                <p className="text-center text-gray-400 py-4">No jobs yet</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex gap-2">
              {(stats?.failed || 0) > 0 && (
                <button
                  onClick={handleRetryAll}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                >
                  <RotateCcw size={14} />
                  Retry All Failed
                </button>
              )}
              <button
                onClick={handleCleanup}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                <Trash2 size={14} />
                Cleanup Old
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === "jobs" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            >
              <option value="">All Types</option>
              {Object.keys(TYPE_LABELS).map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            >
              <option value="">All Statuses</option>
              {["QUEUED", "PROCESSING", "COMPLETED", "FAILED", "RETRYING"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Jobs Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Priority</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Attempts</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Created</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Error</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">No jobs found</td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => {
                      const StatusIcon = STATUS_STYLES[job.status]?.icon || Clock;
                      return (
                        <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {TYPE_LABELS[job.type] || job.type}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[job.priority]}`}>
                              {job.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${STATUS_STYLES[job.status]?.bg}`}>
                              <StatusIcon size={12} className={job.status === "PROCESSING" ? "animate-spin" : ""} />
                              {job.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {job.attempts}/{job.maxAttempts}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{formatDate(job.createdAt)}</td>
                          <td className="px-4 py-3 text-xs text-red-500 max-w-[150px] truncate">
                            {job.lastError || "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {job.status === "FAILED" && (
                                <button
                                  onClick={() => handleRetry(job.id)}
                                  title="Retry"
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
                                >
                                  <RotateCcw size={14} />
                                </button>
                              )}
                              {["QUEUED", "FAILED", "COMPLETED"].includes(job.status) && (
                                <button
                                  onClick={() => handleCancel(job.id)}
                                  title="Remove"
                                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Config Tab */}
      {activeTab === "config" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {configs.map((cfg) => (
            <div
              key={cfg.type}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {TYPE_LABELS[cfg.type] || cfg.type}
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    cfg.isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {cfg.isActive ? "Active" : "Paused"}
                </span>
              </div>
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Max Concurrent:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{cfg.maxConcurrent}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Retries:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{cfg.maxRetries}</span>
                </div>
                <div className="flex justify-between">
                  <span>Retry Delay:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{cfg.retryDelay / 1000}s</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingConfig(cfg);
                  setShowConfigModal(true);
                }}
                className="mt-4 w-full py-2 text-xs font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Edit Configuration
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Config Edit Modal */}
      {showConfigModal && editingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Configure {TYPE_LABELS[editingConfig.type] || editingConfig.type}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Concurrent Jobs
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={editingConfig.maxConcurrent}
                  onChange={(e) => setEditingConfig({ ...editingConfig, maxConcurrent: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Retries
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={editingConfig.maxRetries}
                  onChange={(e) => setEditingConfig({ ...editingConfig, maxRetries: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Retry Delay (seconds)
                </label>
                <input
                  type="number"
                  min={5}
                  max={3600}
                  value={editingConfig.retryDelay / 1000}
                  onChange={(e) => setEditingConfig({ ...editingConfig, retryDelay: parseInt(e.target.value) * 1000 })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingConfig.isActive}
                  onChange={(e) => setEditingConfig({ ...editingConfig, isActive: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active (process jobs)</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateConfig}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Stat Card Component
// ──────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
