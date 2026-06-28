import { useState, useEffect } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Timer,
  Calendar,
  Zap,
  Settings,
  ChevronDown,
  Search,
  RotateCcw,
  Activity,
} from "lucide-react";

// ══════════════════════════════════════════════════════════
// SCHEDULER DASHBOARD
// Manage scheduled/cron tasks with visual UI
// ══════════════════════════════════════════════════════════

interface ScheduledTask {
  id: string;
  name: string;
  description?: string;
  type: string;
  cronExpression: string;
  handler: string;
  params?: any;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  lastStatus?: string;
  lastError?: string;
  runCount: number;
  createdAt: string;
}

interface SchedulerLog {
  id: string;
  taskId: string;
  task?: { name: string; type: string };
  status: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  output?: string;
  error?: string;
}

interface Stats {
  totalTasks: number;
  activeTasks: number;
  inactiveTasks: number;
  executionsToday: number;
  failedToday: number;
  successRate: number;
  recentLogs: SchedulerLog[];
}

// Cron presets for the builder
const CRON_PRESETS = [
  { label: "Every Minute", value: "* * * * *" },
  { label: "Every Hour", value: "0 * * * *" },
  { label: "Daily at 2 AM", value: "0 2 * * *" },
  { label: "Daily at 7 AM", value: "0 7 * * *" },
  { label: "Daily at 9 AM", value: "0 9 * * *" },
  { label: "Daily at 11 AM", value: "0 11 * * *" },
  { label: "Every Monday 9 AM", value: "0 9 * * 1" },
  { label: "Every Friday 5 PM", value: "0 17 * * 5" },
  { label: "1st of Month 6 AM", value: "0 6 1 * *" },
  { label: "15th of Month 6 AM", value: "0 6 15 * *" },
];

const TASK_TYPES = ["BACKUP", "SMS", "EMAIL", "REPORT", "REMINDER", "CUSTOM"];

const TYPE_COLORS: Record<string, string> = {
  BACKUP: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SMS: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  EMAIL: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  REPORT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  REMINDER: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  CUSTOM: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "text-green-600 dark:text-green-400",
  FAILED: "text-red-600 dark:text-red-400",
  RUNNING: "text-blue-600 dark:text-blue-400",
  SKIPPED: "text-yellow-600 dark:text-yellow-400",
};

export default function SchedulerDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [logs, setLogs] = useState<SchedulerLog[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "logs" | "templates">("tasks");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "CUSTOM",
    cronExpression: "0 2 * * *",
    handler: "",
    params: "",
    isActive: true,
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const tenantId = user.tenantId;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, tasksRes, logsRes, templatesRes] = await Promise.all([
        axios.get(getFullUrl(`/api/${tenantId}/scheduler/stats`)),
        axios.get(getFullUrl(`/api/${tenantId}/scheduler/tasks`)),
        axios.get(getFullUrl(`/api/${tenantId}/scheduler/logs?limit=30`)),
        axios.get(getFullUrl(`/api/${tenantId}/scheduler/templates`)),
      ]);
      setStats(statsRes.data.data);
      setTasks(tasksRes.data.data || []);
      setLogs(logsRes.data.data || []);
      setTemplates(templatesRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch scheduler data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      const payload: any = {
        ...formData,
        params: formData.params ? JSON.parse(formData.params) : undefined,
      };
      await axios.post(getFullUrl(`/api/${tenantId}/scheduler/tasks`), payload);
      setShowCreateModal(false);
      setFormData({
        name: "",
        description: "",
        type: "CUSTOM",
        cronExpression: "0 2 * * *",
        handler: "",
        params: "",
        isActive: true,
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create task");
    }
  };

  const handleToggle = async (taskId: string) => {
    try {
      await axios.post(getFullUrl(`/api/${tenantId}/scheduler/tasks/${taskId}/toggle`));
      fetchData();
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const handleRunNow = async (taskId: string) => {
    try {
      await axios.post(getFullUrl(`/api/${tenantId}/scheduler/tasks/${taskId}/run`));
      fetchData();
    } catch (err) {
      console.error("Run failed:", err);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this scheduled task?")) return;
    try {
      await axios.delete(getFullUrl(`/api/${tenantId}/scheduler/tasks/${taskId}`));
      fetchData();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleUseTemplate = (template: any) => {
    setFormData({
      name: template.name,
      description: template.description,
      type: template.type,
      cronExpression: template.cronExpression,
      handler: template.handler,
      params: "",
      isActive: true,
    });
    setShowCreateModal(true);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filterType || t.type === filterType;
    return matchesSearch && matchesType;
  });

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
            <Clock className="w-7 h-7 text-indigo-600" />
            Task Scheduler
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage automated tasks, cron jobs, and scheduled operations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Create Task
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<Timer size={22} />}
          label="Total Tasks"
          value={stats?.totalTasks || 0}
          color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        />
        <StatCard
          icon={<Zap size={22} />}
          label="Active"
          value={stats?.activeTasks || 0}
          color="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
        />
        <StatCard
          icon={<Pause size={22} />}
          label="Inactive"
          value={stats?.inactiveTasks || 0}
          color="bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400"
        />
        <StatCard
          icon={<Activity size={22} />}
          label="Runs Today"
          value={stats?.executionsToday || 0}
          color="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
        />
        <StatCard
          icon={<CheckCircle2 size={22} />}
          label="Success Rate"
          value={`${stats?.successRate || 100}%`}
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          {[
            { key: "tasks", label: "Active Tasks", icon: <Timer size={16} /> },
            { key: "logs", label: "Execution Logs", icon: <Activity size={16} /> },
            { key: "templates", label: "Templates", icon: <Settings size={16} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            >
              <option value="">All Types</option>
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button
              onClick={fetchData}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {/* Tasks Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Task</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Schedule</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Last Run</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Next Run</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Runs</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400">
                        No scheduled tasks found. Create one to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr
                        key={task.id}
                        className={`hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors ${
                          !task.isActive ? "opacity-50" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{task.name}</p>
                            {task.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[200px]">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[task.type] || TYPE_COLORS.CUSTOM}`}>
                            {task.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                            {task.cronExpression}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {formatDate(task.lastRunAt)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {task.isActive ? formatDate(task.nextRunAt) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {task.lastStatus && (
                            <span className={`flex items-center gap-1 text-xs font-medium ${STATUS_COLORS[task.lastStatus] || ""}`}>
                              {task.lastStatus === "SUCCESS" && <CheckCircle2 size={14} />}
                              {task.lastStatus === "FAILED" && <XCircle size={14} />}
                              {task.lastStatus === "RUNNING" && <RefreshCw size={14} className="animate-spin" />}
                              {task.lastStatus}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-600 dark:text-gray-400">
                          {task.runCount}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleRunNow(task.id)}
                              title="Run Now"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                              <Play size={15} />
                            </button>
                            <button
                              onClick={() => handleToggle(task.id)}
                              title={task.isActive ? "Pause" : "Resume"}
                              className={`p-1.5 rounded-lg transition-colors ${
                                task.isActive
                                  ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                  : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                              }`}
                            >
                              {task.isActive ? <Pause size={15} /> : <RotateCcw size={15} />}
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              title="Delete"
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Task</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Started</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Duration</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Output / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      No execution logs yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {log.task?.name || log.taskId}
                        </p>
                        <p className="text-xs text-gray-500">{log.task?.type}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs font-medium ${STATUS_COLORS[log.status] || ""}`}>
                          {log.status === "SUCCESS" && <CheckCircle2 size={14} />}
                          {log.status === "FAILED" && <XCircle size={14} />}
                          {log.status === "SKIPPED" && <AlertTriangle size={14} />}
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(log.startedAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {formatDuration(log.duration)}
                      </td>
                      <td className="px-4 py-3 text-xs max-w-[300px] truncate">
                        {log.error ? (
                          <span className="text-red-500">{log.error}</span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">{log.output || "—"}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "templates" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tmpl, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[tmpl.type] || TYPE_COLORS.CUSTOM}`}>
                  {tmpl.type}
                </span>
                <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono">
                  {tmpl.cronExpression}
                </code>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{tmpl.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{tmpl.description}</p>
              <button
                onClick={() => handleUseTemplate(tmpl)}
                className="w-full py-2 text-sm font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
              >
                Use This Template
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Scheduled Task</h2>
              <p className="text-sm text-gray-500 mt-1">Set up a new automated task</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Daily Backup"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does this task do?"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {TASK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cron Expression */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Schedule (Cron Expression) *
                </label>
                <input
                  type="text"
                  value={formData.cronExpression}
                  onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                  placeholder="0 2 * * *"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                />
                <div className="mt-2 flex flex-wrap gap-1">
                  {CRON_PRESETS.slice(0, 6).map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, cronExpression: preset.value })}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Handler */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Handler Function *</label>
                <input
                  type="text"
                  value={formData.handler}
                  onChange={(e) => setFormData({ ...formData, handler: e.target.value })}
                  placeholder="e.g., backupService.createAutoBackup"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Parameters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Parameters (JSON, optional)
                </label>
                <textarea
                  value={formData.params}
                  onChange={(e) => setFormData({ ...formData, params: e.target.value })}
                  placeholder='{"key": "value"}'
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enable immediately</span>
              </label>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!formData.name || !formData.cronExpression || !formData.handler}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Task
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
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
