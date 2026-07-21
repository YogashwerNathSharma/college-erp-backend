import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Activity, Cpu, MemoryStick, HardDrive, Server, Clock, Wifi, WifiOff,
  RefreshCw, AlertTriangle, CheckCircle2, XCircle, TrendingUp, Zap,
  BarChart3, Globe, ArrowUpDown, Play, Pause, Timer, Layers,
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  ComposedChart,
} from "recharts";
import {
  PageHeader, StatsCard, ChartCard, StatusBadge, DataTable,
} from "../../components/enterprise";
import type { Column } from "../../components/enterprise";

// ══════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════

interface SystemMetrics {
  cpu: { usage: number; cores: number; model: string; speed: number; perCore: number[] };
  memory: { total: number; used: number; free: number; usage: number };
  disk: { total: number; used: number; free: number; usage: number; breakdown: { label: string; size: number; color: string }[] };
  uptime: number;
  platform: string;
  hostname: string;
  nodeVersion: string;
  pid: number;
  processMemory: { rss: number; heapTotal: number; heapUsed: number; external: number };
}

interface ServiceHealth { name: string; status: string; latency: number; uptime: number; }
interface QueueInfo { name: string; pending: number; processing: number; completed: number; failed: number; avgProcessTime: number; }
interface BackgroundJob { id: string; name: string; schedule: string; lastRun: string; nextRun: string; status: string; duration: number; success: boolean; }
interface TimeSeriesPoint { timestamp: string; usage: number; }
interface ResponseTimePoint { timestamp: string; avg: number; p95: number; p99: number; }
interface APIStats {
  history: { hour: string; total: number; success: number; errors: number; errorRate: number }[];
  endpoints: { path: string; calls: number; avgLatency: number; errorRate: number }[];
  errorBreakdown: { code: number; label: string; count: number }[];
}

interface DashboardData {
  metrics: SystemMetrics;
  health: ServiceHealth[];
  queues: QueueInfo[];
  jobs: BackgroundJob[];
  summary: { overallStatus: string; healthyServices: number; totalServices: number; totalQueuePending: number; totalJobsFailed: number; uptimeFormatted: string };
}

type TabId = "overview" | "performance" | "api" | "queues" | "jobs";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

// ══════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════

export default function MonitoringPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [cpuHistory, setCpuHistory] = useState<TimeSeriesPoint[]>([]);
  const [ramHistory, setRamHistory] = useState<TimeSeriesPoint[]>([]);
  const [responseTime, setResponseTime] = useState<ResponseTimePoint[]>([]);
  const [apiStats, setApiStats] = useState<APIStats | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchDashboard = useCallback(async () => { try { const res = await axios.get("/api/monitoring/dashboard", { headers }); setDashboard(res.data.data); } catch (err) { console.error(err); } }, []);
  const fetchCPUHistory = useCallback(async () => { try { const res = await axios.get("/api/monitoring/cpu-history", { headers }); setCpuHistory(res.data.data); } catch (err) { console.error(err); } }, []);
  const fetchRAMHistory = useCallback(async () => { try { const res = await axios.get("/api/monitoring/ram-history", { headers }); setRamHistory(res.data.data); } catch (err) { console.error(err); } }, []);
  const fetchResponseTime = useCallback(async () => { try { const res = await axios.get("/api/monitoring/response-time", { headers }); setResponseTime(res.data.data); } catch (err) { console.error(err); } }, []);
  const fetchAPIStats = useCallback(async () => { try { const res = await axios.get("/api/monitoring/api-stats", { headers }); setApiStats(res.data.data); } catch (err) { console.error(err); } }, []);

  useEffect(() => { const loadAll = async () => { setLoading(true); await Promise.all([fetchDashboard(), fetchCPUHistory(), fetchRAMHistory(), fetchResponseTime(), fetchAPIStats()]); setLoading(false); }; loadAll(); }, []);
  useEffect(() => { if (!autoRefresh) return; const interval = setInterval(() => { fetchDashboard(); fetchCPUHistory(); fetchRAMHistory(); }, 15000); return () => clearInterval(interval); }, [autoRefresh]);

  const metrics = dashboard?.metrics;
  const summary = dashboard?.summary;

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "System Overview", icon: <Activity className="w-4 h-4" /> },
    { id: "performance", label: "Performance", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "api", label: "API Monitoring", icon: <Globe className="w-4 h-4" /> },
    { id: "queues", label: "Queues", icon: <Layers className="w-4 h-4" /> },
    { id: "jobs", label: "Background Jobs", icon: <Timer className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="System Monitoring"
        subtitle="Real-time server health, performance metrics, and infrastructure monitoring"
        icon={<Activity className="w-5 h-5" />}
        breadcrumbs={[{ label: "Super Admin", path: "/super-admin" }, { label: "Monitoring" }]}
        badge={{ label: summary?.overallStatus === "healthy" ? "All Systems Operational" : "Degraded", color: summary?.overallStatus === "healthy" ? "green" : "amber" }}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setAutoRefresh(!autoRefresh)} className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${autoRefresh ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400"}`}>
              {autoRefresh ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />} {autoRefresh ? "Live" : "Paused"}
            </button>
            <button onClick={() => { fetchDashboard(); fetchCPUHistory(); fetchRAMHistory(); fetchResponseTime(); fetchAPIStats(); toast.success("Refreshed"); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        }
      />

      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-700">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <OverviewTab metrics={metrics || null} health={dashboard?.health || []} summary={summary || null} loading={loading} />}
      {activeTab === "performance" && <PerformanceTab cpuHistory={cpuHistory} ramHistory={ramHistory} responseTime={responseTime} metrics={metrics || null} loading={loading} />}
      {activeTab === "api" && <APIMonitoringTab stats={apiStats} loading={loading} />}
      {activeTab === "queues" && <QueuesTab queues={dashboard?.queues || []} loading={loading} />}
      {activeTab === "jobs" && <JobsTab jobs={dashboard?.jobs || []} loading={loading} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// OVERVIEW TAB
// ══════════════════════════════════════════════════════

function OverviewTab({ metrics, health, summary, loading }: { metrics: SystemMetrics | null; health: ServiceHealth[]; summary: any; loading: boolean }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="CPU Usage" value={`${metrics?.cpu.usage || 0}%`} icon={<Cpu className="w-5 h-5" />} color={metrics && metrics.cpu.usage > 80 ? "rose" : metrics && metrics.cpu.usage > 50 ? "amber" : "emerald"} loading={loading} subtitle={`${metrics?.cpu.cores || 0} cores`} />
        <StatsCard title="RAM Usage" value={`${metrics?.memory.usage || 0}%`} icon={<MemoryStick className="w-5 h-5" />} color={metrics && metrics.memory.usage > 80 ? "rose" : "indigo"} loading={loading} subtitle={`${formatBytes(metrics?.memory.used || 0)} / ${formatBytes(metrics?.memory.total || 0)}`} />
        <StatsCard title="Disk Usage" value={`${metrics?.disk.usage || 0}%`} icon={<HardDrive className="w-5 h-5" />} color="purple" loading={loading} subtitle={formatBytes(metrics?.disk.used || 0)} />
        <StatsCard title="Uptime" value={summary?.uptimeFormatted || "\u2014"} icon={<Clock className="w-5 h-5" />} color="cyan" loading={loading} subtitle={metrics?.hostname || ""} />
        <StatsCard title="Services" value={`${summary?.healthyServices || 0}/${summary?.totalServices || 0}`} icon={<Server className="w-5 h-5" />} color={summary?.overallStatus === "healthy" ? "emerald" : "amber"} loading={loading} subtitle="healthy" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Health */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Service Health</h3>
          <div className="space-y-3">
            {health.map((service, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${service.status === "healthy" ? "bg-emerald-500" : service.status === "degraded" ? "bg-amber-500 animate-pulse" : "bg-red-500"}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{service.name}</p>
                    <p className="text-xs text-slate-500">{service.uptime}% uptime</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-mono ${service.latency > 200 ? "text-red-600" : service.latency > 100 ? "text-amber-600" : "text-emerald-600"}`}>{service.latency > 0 ? `${service.latency}ms` : "\u2014"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disk Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Storage Breakdown</h3>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">{formatBytes(metrics?.disk.used || 0)} used</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">{formatBytes(metrics?.disk.total || 0)} total</span>
            </div>
            <div className="w-full h-6 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
              {metrics?.disk.breakdown.map((item, i) => (
                <div key={i} className="h-full transition-all duration-500" style={{ width: `${(item.size / (metrics?.disk.used || 1)) * 100}%`, backgroundColor: item.color }} title={`${item.label}: ${formatBytes(item.size)}`} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {metrics?.disk.breakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} /><span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span></div>
                <span className="text-sm font-mono text-slate-900 dark:text-white">{formatBytes(item.size)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">System Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Hostname", value: metrics?.hostname || "\u2014" },
            { label: "Platform", value: metrics?.platform || "\u2014" },
            { label: "Node.js", value: metrics?.nodeVersion || "\u2014" },
            { label: "PID", value: String(metrics?.pid || "\u2014") },
            { label: "CPU Model", value: metrics?.cpu.model?.split(" ").slice(0, 4).join(" ") || "\u2014" },
            { label: "CPU Speed", value: `${metrics?.cpu.speed || 0} MHz` },
            { label: "Heap Used", value: formatBytes(metrics?.processMemory?.heapUsed || 0) },
            { label: "RSS", value: formatBytes(metrics?.processMemory?.rss || 0) },
          ].map((item, i) => (
            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5 truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// PERFORMANCE TAB
// ══════════════════════════════════════════════════════

function PerformanceTab({ cpuHistory, ramHistory, responseTime, metrics, loading }: { cpuHistory: TimeSeriesPoint[]; ramHistory: TimeSeriesPoint[]; responseTime: ResponseTimePoint[]; metrics: SystemMetrics | null; loading: boolean }) {
  return (
    <div className="space-y-6">
      <ChartCard title="CPU Usage" subtitle="Real-time CPU utilization (last 60 minutes)" actions={<div className="flex items-center gap-2"><span className={`text-lg font-bold ${(metrics?.cpu.usage || 0) > 80 ? "text-red-600" : "text-emerald-600"}`}>{metrics?.cpu.usage || 0}%</span><span className="text-xs text-slate-400">current</span></div>}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cpuHistory}>
            <defs><linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} stroke="#64748b" fontSize={11} />
            <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} labelFormatter={(v) => new Date(v).toLocaleTimeString()} formatter={(value: number) => [`${value}%`, "CPU"]} labelStyle={{ color: "#94a3b8" }} />
            <Area type="monotone" dataKey="usage" stroke="#6366f1" strokeWidth={2} fill="url(#cpuGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Memory Usage" subtitle="RAM utilization over time" actions={<div className="flex items-center gap-2"><span className={`text-lg font-bold ${(metrics?.memory.usage || 0) > 80 ? "text-red-600" : "text-emerald-600"}`}>{metrics?.memory.usage || 0}%</span><span className="text-xs text-slate-400">{formatBytes(metrics?.memory.used || 0)}</span></div>}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={ramHistory}>
            <defs><linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} stroke="#64748b" fontSize={11} />
            <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} labelFormatter={(v) => new Date(v).toLocaleTimeString()} formatter={(value: number) => [`${value}%`, "RAM"]} labelStyle={{ color: "#94a3b8" }} />
            <Area type="monotone" dataKey="usage" stroke="#10b981" strokeWidth={2} fill="url(#ramGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="API Response Time" subtitle="Average, P95, and P99 latencies">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={responseTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}ms`} />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} labelFormatter={(v) => new Date(v).toLocaleTimeString()} labelStyle={{ color: "#94a3b8" }} />
            <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2} dot={false} name="Average" />
            <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} dot={false} name="P95" strokeDasharray="4 2" />
            <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={1.5} dot={false} name="P99" strokeDasharray="2 2" />
            <Legend />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {metrics && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Per-Core CPU Usage</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {metrics.cpu.perCore.map((usage, i) => (
              <div key={i} className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="relative w-14 h-14 mx-auto mb-2">
                  <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="24" stroke="currentColor" strokeWidth="6" fill="none" className="text-slate-200 dark:text-slate-700" />
                    <circle cx="30" cy="30" r="24" stroke="currentColor" strokeWidth="6" fill="none" strokeDasharray={`${usage * 1.508} 150.8`} strokeLinecap="round" className={usage > 80 ? "text-red-500" : usage > 50 ? "text-amber-500" : "text-emerald-500"} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-900 dark:text-white">{usage}%</span>
                </div>
                <p className="text-xs text-slate-500">Core {i}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// API MONITORING TAB
// ══════════════════════════════════════════════════════

function APIMonitoringTab({ stats, loading }: { stats: APIStats | null; loading: boolean }) {
  if (!stats) return <div className="text-center py-12 text-slate-500">Loading API stats...</div>;
  const errorColors = ["#ef4444", "#f59e0b", "#8b5cf6", "#6366f1", "#06b6d4", "#64748b"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Requests (24h)" value={(stats.history.reduce((a, h) => a + h.total, 0)).toLocaleString()} icon={<Globe className="w-5 h-5" />} color="indigo" loading={loading} />
        <StatsCard title="Success Rate" value={`${(100 - (stats.history.reduce((a, h) => a + h.errorRate, 0) / stats.history.length)).toFixed(2)}%`} icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" loading={loading} />
        <StatsCard title="Total Errors" value={stats.history.reduce((a, h) => a + h.errors, 0)} icon={<XCircle className="w-5 h-5" />} color="rose" loading={loading} />
        <StatsCard title="Avg Error Rate" value={`${(stats.history.reduce((a, h) => a + h.errorRate, 0) / stats.history.length).toFixed(2)}%`} icon={<AlertTriangle className="w-5 h-5" />} color="amber" loading={loading} />
      </div>

      <ChartCard title="Request Volume (24h)" subtitle="Success and error distribution by hour">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={stats.history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="hour" tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit" })} stroke="#64748b" fontSize={11} />
            <YAxis yAxisId="left" stroke="#64748b" fontSize={11} />
            <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} labelFormatter={(v) => new Date(v).toLocaleTimeString()} labelStyle={{ color: "#94a3b8" }} />
            <Bar yAxisId="left" dataKey="success" fill="#10b981" radius={[2, 2, 0, 0]} name="Success" opacity={0.8} />
            <Bar yAxisId="left" dataKey="errors" fill="#ef4444" radius={[2, 2, 0, 0]} name="Errors" opacity={0.8} />
            <Line yAxisId="right" type="monotone" dataKey="errorRate" stroke="#f59e0b" strokeWidth={2} dot={false} name="Error Rate %" />
            <Legend />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Top Endpoints</h3>
          <div className="space-y-3">
            {stats.endpoints.map((ep, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex-1 min-w-0"><code className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate block">{ep.path}</code><p className="text-xs text-slate-500 mt-0.5">{ep.calls.toLocaleString()} calls</p></div>
                <div className="flex items-center gap-4 ml-4">
                  <span className={`text-sm font-mono ${ep.avgLatency > 200 ? "text-red-600" : ep.avgLatency > 100 ? "text-amber-600" : "text-emerald-600"}`}>{ep.avgLatency}ms</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ep.errorRate > 1 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"}`}>{ep.errorRate}% err</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Error Breakdown</h3>
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.errorBreakdown} cx="50%" cy="50%" outerRadius={70} dataKey="count">{stats.errorBreakdown.map((_, i) => <Cell key={i} fill={errorColors[i % errorColors.length]} />)}</Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {stats.errorBreakdown.map((err, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: errorColors[i % errorColors.length] }} /><span className="text-sm text-slate-700 dark:text-slate-300">{err.code} \u2014 {err.label}</span></div><span className="text-sm font-mono font-bold text-slate-900 dark:text-white">{err.count}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// QUEUES TAB
// ══════════════════════════════════════════════════════

function QueuesTab({ queues, loading }: { queues: QueueInfo[]; loading: boolean }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Pending" value={queues.reduce((a, q) => a + q.pending, 0)} icon={<Layers className="w-5 h-5" />} color="amber" loading={loading} />
        <StatsCard title="Processing Now" value={queues.reduce((a, q) => a + q.processing, 0)} icon={<Activity className="w-5 h-5" />} color="indigo" loading={loading} />
        <StatsCard title="Total Failed" value={queues.reduce((a, q) => a + q.failed, 0)} icon={<XCircle className="w-5 h-5" />} color="rose" loading={loading} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {queues.map((queue, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{queue.name}</h4>
              <StatusBadge label={queue.processing > 0 ? "Active" : queue.pending > 0 ? "Pending" : "Idle"} variant={queue.processing > 0 ? "info" : queue.pending > 0 ? "warning" : "success"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg"><p className="text-xl font-bold text-amber-600 dark:text-amber-400">{queue.pending}</p><p className="text-xs text-slate-500">Pending</p></div>
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg"><p className="text-xl font-bold text-blue-600 dark:text-blue-400">{queue.processing}</p><p className="text-xs text-slate-500">Processing</p></div>
              <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg"><p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{queue.completed.toLocaleString()}</p><p className="text-xs text-slate-500">Completed</p></div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-900/10 rounded-lg"><p className="text-xl font-bold text-red-600 dark:text-red-400">{queue.failed}</p><p className="text-xs text-slate-500">Failed</p></div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-500"><span>Avg Process Time</span><span className="font-mono text-slate-900 dark:text-white">{formatDuration(queue.avgProcessTime)}</span></div>
              <div className="mt-2 w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (queue.completed / (queue.completed + queue.failed || 1)) * 100)}%` }} /></div>
              <p className="text-xs text-slate-400 mt-1 text-right">{((queue.completed / (queue.completed + queue.failed || 1)) * 100).toFixed(1)}% success</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// JOBS TAB
// ══════════════════════════════════════════════════════

function JobsTab({ jobs, loading }: { jobs: BackgroundJob[]; loading: boolean }) {
  const jobColumns: Column<BackgroundJob>[] = [
    { key: "name", label: "Job Name", render: (row) => (<div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${row.status === "running" ? "bg-blue-500 animate-pulse" : row.success ? "bg-emerald-500" : "bg-red-500"}`} /><span className="font-medium text-slate-900 dark:text-white">{row.name}</span></div>) },
    { key: "schedule", label: "Schedule", render: (row) => <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{row.schedule}</code> },
    { key: "status", label: "Status", render: (row) => <StatusBadge label={row.status} variant={row.status === "running" ? "info" : row.status === "completed" ? "success" : "danger"} /> },
    { key: "lastRun", label: "Last Run", render: (row) => <span className="text-xs">{new Date(row.lastRun).toLocaleString()}</span> },
    { key: "nextRun", label: "Next Run", render: (row) => <span className="text-xs">{new Date(row.nextRun).toLocaleString()}</span> },
    { key: "duration", label: "Duration", render: (row) => <span className="font-mono text-sm">{row.duration > 0 ? formatDuration(row.duration) : "\u2014"}</span> },
    { key: "success", label: "Health", render: (row) => row.success ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Jobs" value={jobs.length} icon={<Timer className="w-5 h-5" />} color="indigo" loading={loading} />
        <StatsCard title="Running" value={jobs.filter((j) => j.status === "running").length} icon={<Play className="w-5 h-5" />} color="blue" loading={loading} />
        <StatsCard title="Completed" value={jobs.filter((j) => j.status === "completed").length} icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" loading={loading} />
        <StatsCard title="Failed" value={jobs.filter((j) => !j.success).length} icon={<XCircle className="w-5 h-5" />} color="rose" loading={loading} />
      </div>
      <DataTable columns={jobColumns} data={jobs} title="Background Jobs" subtitle="Scheduled tasks and cron jobs" loading={loading} />

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Next Scheduled Runs</h3>
        <div className="space-y-3">
          {jobs.sort((a, b) => new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime()).slice(0, 5).map((job) => {
            const timeUntil = new Date(job.nextRun).getTime() - Date.now();
            const hoursUntil = Math.max(0, Math.floor(timeUntil / 3600000));
            const minsUntil = Math.max(0, Math.floor((timeUntil % 3600000) / 60000));
            return (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400"><Timer className="w-4 h-4" /></div>
                  <div><p className="text-sm font-medium text-slate-900 dark:text-white">{job.name}</p><p className="text-xs text-slate-500">{new Date(job.nextRun).toLocaleString()}</p></div>
                </div>
                <div className="text-right"><p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{hoursUntil > 0 ? `${hoursUntil}h ${minsUntil}m` : `${minsUntil}m`}</p><p className="text-xs text-slate-400">until next run</p></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
