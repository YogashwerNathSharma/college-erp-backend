import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Database, HardDrive, Zap, Clock, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, Download, Upload, Archive, Search, TrendingUp, Activity,
  Layers, FileText, BarChart3, Settings, Play, ArrowUpDown, Server,
  Plus, Eye, Lightbulb, History,
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  PageHeader, StatsCard, DataTable, StatusBadge, ChartCard, ConfirmDialog,
} from "../../components/enterprise";
import type { Column } from "../../components/enterprise";

// ══════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════

interface DBHealth {
  status: string;
  responseTime: number;
  uptime: number;
  version: string;
  stats: {
    dataSize: number;
    storageSize: number;
    indexSize: number;
    totalObjects: number;
    totalCollections: number;
  };
  connections: {
    current: number;
    available: number;
    totalCreated: number;
    utilization: number;
  };
  collections: CollectionStat[];
}

interface CollectionStat {
  name: string;
  size: number;
  count: number;
  avgObjSize: number;
  storageSize: number;
  indexSize: number;
  indexes: number;
}

interface SlowQuery {
  id: string;
  query: string;
  collection: string;
  duration: number;
  timestamp: string;
  planSummary: string;
  docsExamined: number;
  docsReturned: number;
}

interface IndexInfo {
  id: string;
  collection: string;
  name: string;
  keys: Record<string, number>;
  unique: boolean;
  size: number;
  usage: number;
  lastUsed: string;
}

interface Optimization {
  id: string;
  severity: string;
  category: string;
  title: string;
  description: string;
  action: string;
  impact: string;
}

interface Backup {
  id: string;
  name: string;
  type: string;
  status: string;
  size: number;
  duration: number;
  createdAt: string;
  expiresAt: string;
  location: string;
}

interface Migration {
  id: string;
  name: string;
  version: string;
  status: string;
  appliedAt: string;
  duration: number;
  changes: string;
}

interface QueryStat {
  timestamp: string;
  reads: number;
  writes: number;
  deletes: number;
  avgLatency: number;
}

type TabId = "health" | "queries" | "indexes" | "optimize" | "backups" | "migrations";

// ══════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════

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

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

// ══════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════

export default function DatabaseManagement() {
  const [activeTab, setActiveTab] = useState<TabId>("health");
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<DBHealth | null>(null);
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);
  const [indexes, setIndexes] = useState<IndexInfo[]>([]);
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [queryStats, setQueryStats] = useState<QueryStat[]>([]);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchHealth = useCallback(async () => {
    try {
      const res = await axios.get("/api/database/health", { headers });
      setHealth(res.data.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchSlowQueries = useCallback(async () => {
    try {
      const res = await axios.get("/api/database/slow-queries", { headers });
      setSlowQueries(res.data.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchIndexes = useCallback(async () => {
    try {
      const res = await axios.get("/api/database/indexes", { headers });
      setIndexes(res.data.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchOptimizations = useCallback(async () => {
    try {
      const res = await axios.get("/api/database/optimizations", { headers });
      setOptimizations(res.data.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchBackups = useCallback(async () => {
    try {
      const res = await axios.get("/api/database/backups", { headers });
      setBackups(res.data.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchMigrations = useCallback(async () => {
    try {
      const res = await axios.get("/api/database/migrations", { headers });
      setMigrations(res.data.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchQueryStats = useCallback(async () => {
    try {
      const res = await axios.get("/api/database/query-stats", { headers });
      setQueryStats(res.data.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchHealth(), fetchSlowQueries(), fetchIndexes(), fetchOptimizations(), fetchBackups(), fetchMigrations(), fetchQueryStats()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchQueryStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateBackup = async () => {
    try {
      await axios.post("/api/database/backups", { type: "full", name: `Manual Backup - ${new Date().toLocaleString()}` }, { headers });
      toast.success("Backup started");
      fetchBackups();
    } catch (err) { toast.error("Failed to create backup"); }
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "health", label: "Health & Stats", icon: <Activity className="w-4 h-4" /> },
    { id: "queries", label: "Slow Queries", icon: <Clock className="w-4 h-4" /> },
    { id: "indexes", label: "Indexes", icon: <Layers className="w-4 h-4" /> },
    { id: "optimize", label: "Optimization", icon: <Lightbulb className="w-4 h-4" /> },
    { id: "backups", label: "Backups", icon: <Archive className="w-4 h-4" /> },
    { id: "migrations", label: "Migrations", icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Database Management"
        subtitle="MongoDB health monitoring, query optimization, and backup management"
        icon={<Database className="w-5 h-5" />}
        breadcrumbs={[{ label: "Super Admin", path: "/super-admin" }, { label: "Database Management" }]}
        badge={{ label: health?.status === "healthy" ? "Healthy" : health?.status || "...", color: health?.status === "healthy" ? "green" : "amber" }}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleCreateBackup} className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium">
              <Archive className="w-4 h-4" /> Create Backup
            </button>
            <button onClick={() => { fetchHealth(); fetchQueryStats(); toast.success("Refreshed"); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
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

      {activeTab === "health" && <HealthTab health={health} queryStats={queryStats} loading={loading} />}
      {activeTab === "queries" && <SlowQueriesTab queries={slowQueries} loading={loading} />}
      {activeTab === "indexes" && <IndexesTab indexes={indexes} loading={loading} />}
      {activeTab === "optimize" && <OptimizationTab optimizations={optimizations} loading={loading} />}
      {activeTab === "backups" && <BackupsTab backups={backups} onCreateBackup={handleCreateBackup} loading={loading} />}
      {activeTab === "migrations" && <MigrationsTab migrations={migrations} loading={loading} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// HEALTH TAB
// ══════════════════════════════════════════════════════

function HealthTab({ health, queryStats, loading }: { health: DBHealth | null; queryStats: QueryStat[]; loading: boolean }) {
  const collectionColors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];
  const pieData = health?.collections.map((c, i) => ({ name: c.name, value: c.storageSize, color: collectionColors[i % collectionColors.length] })) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Response Time" value={`${health?.responseTime || 0}ms`} icon={<Zap className="w-5 h-5" />} color={health && health.responseTime < 100 ? "emerald" : "amber"} loading={loading} />
        <StatsCard title="Total Objects" value={(health?.stats.totalObjects || 0).toLocaleString()} icon={<Layers className="w-5 h-5" />} color="indigo" loading={loading} />
        <StatsCard title="Data Size" value={formatBytes(health?.stats.dataSize || 0)} icon={<HardDrive className="w-5 h-5" />} color="purple" loading={loading} />
        <StatsCard title="Uptime" value={formatUptime(health?.uptime || 0)} icon={<Clock className="w-5 h-5" />} color="cyan" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Pool */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Connection Pool</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Utilization</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{health?.connections.utilization || 0}%</span>
            </div>
            <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${(health?.connections.utilization || 0) > 80 ? "bg-red-500" : (health?.connections.utilization || 0) > 50 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${health?.connections.utilization || 0}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{health?.connections.current || 0}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{health?.connections.available || 0}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Available</p>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{(health?.connections.totalCreated || 0).toLocaleString()}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Created</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-sm"><span className="text-slate-500">MongoDB Version</span><span className="font-mono text-slate-900 dark:text-white">{health?.version || "..."}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Collections</span><span className="font-mono text-slate-900 dark:text-white">{health?.stats.totalCollections || 0}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Index Size</span><span className="font-mono text-slate-900 dark:text-white">{formatBytes(health?.stats.indexSize || 0)}</span></div>
          </div>
        </div>

        {/* Storage Pie */}
        <ChartCard title="Storage by Collection" subtitle="Distribution of data across collections">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                {pieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
              </Pie>
              <Tooltip formatter={(value: number) => formatBytes(value)} />
              <Legend formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Query Stats Chart */}
      <ChartCard title="Real-Time Query Statistics" subtitle="Operations per minute (last 30 minutes)">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={queryStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} labelFormatter={(v) => new Date(v).toLocaleTimeString()} labelStyle={{ color: "#94a3b8" }} />
            <Area type="monotone" dataKey="reads" stackId="1" fill="#6366f1" stroke="#6366f1" fillOpacity={0.3} name="Reads" />
            <Area type="monotone" dataKey="writes" stackId="1" fill="#10b981" stroke="#10b981" fillOpacity={0.3} name="Writes" />
            <Area type="monotone" dataKey="deletes" stackId="1" fill="#ef4444" stroke="#ef4444" fillOpacity={0.3} name="Deletes" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Collection Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Collection Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Collection</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Documents</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Data Size</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Doc</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Storage</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Indexes</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Index Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {health?.collections.map((col, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{col.name}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-300">{col.count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-300">{formatBytes(col.size)}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-300">{formatBytes(col.avgObjSize)}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-300">{formatBytes(col.storageSize)}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-300">{col.indexes}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-300">{formatBytes(col.indexSize)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// SLOW QUERIES TAB
// ══════════════════════════════════════════════════════

function SlowQueriesTab({ queries, loading }: { queries: SlowQuery[]; loading: boolean }) {
  const queryColumns: Column<SlowQuery>[] = [
    { key: "query", label: "Query", width: "35%", render: (row) => <code className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">{row.query}</code> },
    { key: "collection", label: "Collection", render: (row) => <span className="px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded">{row.collection}</span> },
    { key: "duration", label: "Duration", render: (row) => <span className={`font-mono text-sm font-bold ${row.duration > 1000 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>{formatDuration(row.duration)}</span> },
    { key: "planSummary", label: "Plan", render: (row) => <StatusBadge label={row.planSummary} variant={row.planSummary === "COLLSCAN" ? "danger" : row.planSummary === "SORT_KEY_GEN" ? "warning" : "success"} /> },
    { key: "docsExamined", label: "Examined", render: (row) => <span className="font-mono text-sm">{row.docsExamined.toLocaleString()}</span> },
    { key: "docsReturned", label: "Returned", render: (row) => <span className="font-mono text-sm">{row.docsReturned.toLocaleString()}</span> },
    { key: "timestamp", label: "Time", render: (row) => <span className="text-xs">{new Date(row.timestamp).toLocaleString()}</span> },
  ];

  const efficiencyData = queries.map((q) => ({ query: q.collection, duration: q.duration }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Avg Duration" value={`${Math.round(queries.reduce((a, q) => a + q.duration, 0) / (queries.length || 1))}ms`} icon={<Clock className="w-5 h-5" />} color="amber" loading={loading} />
        <StatsCard title="Collection Scans" value={queries.filter((q) => q.planSummary === "COLLSCAN").length} icon={<AlertTriangle className="w-5 h-5" />} color="rose" loading={loading} />
        <StatsCard title="Total Slow Queries" value={queries.length} icon={<Search className="w-5 h-5" />} color="indigo" loading={loading} />
      </div>

      <ChartCard title="Query Duration Analysis" subtitle="Duration by collection">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={efficiencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="query" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} />
            <Bar dataKey="duration" fill="#6366f1" radius={[4, 4, 0, 0]} name="Duration (ms)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <DataTable columns={queryColumns} data={queries} title="Slow Query Log" subtitle="Queries exceeding 500ms threshold" loading={loading} />
    </div>
  );
}

// ══════════════════════════════════════════════════════
// INDEXES TAB
// ══════════════════════════════════════════════════════

function IndexesTab({ indexes, loading }: { indexes: IndexInfo[]; loading: boolean }) {
  const indexColumns: Column<IndexInfo>[] = [
    { key: "name", label: "Index Name", render: (row) => <code className="text-sm font-mono text-slate-900 dark:text-white">{row.name}</code> },
    { key: "collection", label: "Collection", render: (row) => <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">{row.collection}</span> },
    { key: "keys", label: "Keys", render: (row) => <code className="text-xs">{JSON.stringify(row.keys)}</code> },
    { key: "unique", label: "Unique", render: (row) => row.unique ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <span className="text-slate-400">\u2014</span> },
    { key: "size", label: "Size", render: (row) => <span className="font-mono text-sm">{formatBytes(row.size)}</span> },
    { key: "usage", label: "Usage (ops)", render: (row) => <span className="font-mono text-sm">{row.usage.toLocaleString()}</span> },
    { key: "lastUsed", label: "Last Used", render: (row) => <span className="text-xs">{new Date(row.lastUsed).toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Indexes" value={indexes.length} icon={<Layers className="w-5 h-5" />} color="indigo" loading={loading} />
        <StatsCard title="Total Index Size" value={formatBytes(indexes.reduce((a, idx) => a + idx.size, 0))} icon={<HardDrive className="w-5 h-5" />} color="purple" loading={loading} />
        <StatsCard title="Unique Indexes" value={indexes.filter((i) => i.unique).length} icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" loading={loading} />
      </div>
      <DataTable columns={indexColumns} data={indexes} title="Index Management" subtitle="All database indexes and their usage statistics" loading={loading} />
    </div>
  );
}

// ══════════════════════════════════════════════════════
// OPTIMIZATION TAB
// ══════════════════════════════════════════════════════

function OptimizationTab({ optimizations, loading }: { optimizations: Optimization[]; loading: boolean }) {
  const severityColors: Record<string, string> = { high: "border-l-red-500 bg-red-50/50 dark:bg-red-900/10", medium: "border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10", low: "border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10" };
  const categoryIcons: Record<string, React.ReactNode> = { index: <Layers className="w-4 h-4" />, schema: <Database className="w-4 h-4" />, storage: <HardDrive className="w-4 h-4" />, connection: <Server className="w-4 h-4" /> };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="High Priority" value={optimizations.filter((o) => o.severity === "high").length} icon={<AlertTriangle className="w-5 h-5" />} color="rose" loading={loading} />
        <StatsCard title="Medium Priority" value={optimizations.filter((o) => o.severity === "medium").length} icon={<Lightbulb className="w-5 h-5" />} color="amber" loading={loading} />
        <StatsCard title="Low Priority" value={optimizations.filter((o) => o.severity === "low").length} icon={<TrendingUp className="w-5 h-5" />} color="blue" loading={loading} />
      </div>
      <div className="space-y-4">
        {optimizations.map((opt) => (
          <div key={opt.id} className={`border-l-4 rounded-xl border border-slate-200 dark:border-slate-700 p-5 ${severityColors[opt.severity] || ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">{categoryIcons[opt.category] || <Settings className="w-4 h-4" />}</div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{opt.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge label={opt.severity} variant={opt.severity === "high" ? "danger" : opt.severity === "medium" ? "warning" : "info"} size="sm" />
                      <span className="text-xs text-slate-500 uppercase">{opt.category}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{opt.description}</p>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Suggested Action:</p>
                  <code className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg block text-slate-700 dark:text-slate-300 font-mono">{opt.action}</code>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-slate-500">Impact</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{opt.impact}</p>
                <button className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300"><Play className="w-3 h-3" /> Apply</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// BACKUPS TAB
// ══════════════════════════════════════════════════════

function BackupsTab({ backups, onCreateBackup, loading }: { backups: Backup[]; onCreateBackup: () => void; loading: boolean }) {
  const backupColumns: Column<Backup>[] = [
    { key: "name", label: "Backup Name", render: (row) => (<div><p className="font-medium text-slate-900 dark:text-white">{row.name}</p><p className="text-xs text-slate-500">{row.location}</p></div>) },
    { key: "type", label: "Type", render: (row) => <StatusBadge label={row.type} variant={row.type === "full" ? "info" : row.type === "incremental" ? "success" : "purple"} /> },
    { key: "status", label: "Status", render: (row) => <StatusBadge label={row.status} variant={row.status === "completed" ? "success" : row.status === "in_progress" ? "warning" : "danger"} /> },
    { key: "size", label: "Size", render: (row) => <span className="font-mono text-sm">{formatBytes(row.size)}</span> },
    { key: "duration", label: "Duration", render: (row) => <span className="text-sm">{row.duration}s</span> },
    { key: "createdAt", label: "Created", render: (row) => <span className="text-xs">{new Date(row.createdAt).toLocaleString()}</span> },
    { key: "expiresAt", label: "Expires", render: (row) => <span className="text-xs">{new Date(row.expiresAt).toLocaleDateString()}</span> },
    { key: "actions", label: "", render: () => (<div className="flex items-center gap-2"><button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600"><Download className="w-4 h-4" /></button><button className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600"><Upload className="w-4 h-4" /></button></div>) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Backups" value={backups.length} icon={<Archive className="w-5 h-5" />} color="indigo" loading={loading} />
        <StatsCard title="Total Size" value={formatBytes(backups.reduce((a, b) => a + b.size, 0))} icon={<HardDrive className="w-5 h-5" />} color="purple" loading={loading} />
        <StatsCard title="Last Backup" value={backups[0] ? new Date(backups[0].createdAt).toLocaleDateString() : "Never"} icon={<Clock className="w-5 h-5" />} color="emerald" loading={loading} />
      </div>
      <DataTable columns={backupColumns} data={backups} title="Backup History" subtitle="Database backup management" loading={loading} headerActions={<button onClick={onCreateBackup} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"><Plus className="w-4 h-4" /> New Backup</button>} />
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MIGRATIONS TAB
// ══════════════════════════════════════════════════════

function MigrationsTab({ migrations, loading }: { migrations: Migration[]; loading: boolean }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Migrations" value={migrations.length} icon={<History className="w-5 h-5" />} color="indigo" loading={loading} />
        <StatsCard title="Latest Version" value={migrations[migrations.length - 1]?.version || "\u2014"} icon={<TrendingUp className="w-5 h-5" />} color="emerald" loading={loading} />
        <StatsCard title="Avg Duration" value={`${Math.round(migrations.reduce((a, m) => a + m.duration, 0) / (migrations.length || 1))}ms`} icon={<Clock className="w-5 h-5" />} color="purple" loading={loading} />
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-6">Migration History</h3>
        <div className="relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-6">
            {migrations.slice().reverse().map((mig) => (
              <div key={mig.id} className="flex gap-4 relative">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 ring-4 ring-white dark:ring-slate-900 z-10">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{mig.name}</h4>
                    <span className="px-2 py-0.5 text-xs font-mono bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">v{mig.version}</span>
                    <StatusBadge label={mig.status} variant="success" size="sm" />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{mig.changes}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(mig.appliedAt).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {formatDuration(mig.duration)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
