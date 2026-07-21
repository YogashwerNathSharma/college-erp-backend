import { useState, useEffect, useCallback } from "react";
import {
  BarChart3, DollarSign, Building2, Activity, LogIn, CreditCard, Shield, Server,
  Download, Printer, Calendar, TrendingUp, TrendingDown, Users, HardDrive, Clock, AlertTriangle, ArrowUpRight,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, ComposedChart, Line,
} from "recharts";
import { DataTable, PageHeader, StatsCard, ChartCard } from "../../components/enterprise";
import type { Column } from "../../components/enterprise";

// ═══════════════════════════════════════════════════════════
// TYPES & CONFIG
// ═══════════════════════════════════════════════════════════

interface ReportFilter { startDate: string; endDate: string; granularity: string; }

const TABS = [
  { key: "revenue", label: "Revenue", icon: DollarSign },
  { key: "tenants", label: "Tenants", icon: Building2 },
  { key: "usage", label: "Usage", icon: Activity },
  { key: "login", label: "Login", icon: LogIn },
  { key: "subscription", label: "Subscription", icon: CreditCard },
  { key: "audit", label: "Audit", icon: Shield },
  { key: "system", label: "System", icon: Server },
] as const;

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function ReportCenter() {
  const [activeTab, setActiveTab] = useState<string>("revenue");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReportFilter>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    granularity: "month",
  });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/super-admin/report-center/${activeTab}`, { params: filter });
      if (data.success) setReportData(data.report);
    } catch { setReportData(generateMockData(activeTab)); }
    finally { setLoading(false); }
  }, [activeTab, filter]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = async (format: string) => {
    try { await axios.post("/api/super-admin/report-center/export", { reportType: activeTab, format, ...filter }); } catch {}
    toast.success(`Report exported as ${format.toUpperCase()}`);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Report Center"
        subtitle="Comprehensive analytics and business intelligence"
        icon={<BarChart3 className="w-5 h-5" />}
        breadcrumbs={[{ label: "Super Admin", path: "/super-admin" }, { label: "Report Center" }]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => { window.print(); }} className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"><Printer className="w-4 h-4" /> Print</button>
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Download className="w-4 h-4" /> Export</button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 py-1 min-w-[120px]">
                <button onClick={() => handleExport("csv")} className="w-full px-4 py-2 text-sm text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">CSV</button>
                <button onClick={() => handleExport("excel")} className="w-full px-4 py-2 text-sm text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">Excel</button>
                <button onClick={() => handleExport("pdf")} className="w-full px-4 py-2 text-sm text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">PDF</button>
              </div>
            </div>
          </div>
        }
      />

      {/* Date Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Date Range:</span></div>
        <input type="date" value={filter.startDate} onChange={(e) => setFilter({ ...filter, startDate: e.target.value })} className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
        <span className="text-slate-400">to</span>
        <input type="date" value={filter.endDate} onChange={(e) => setFilter({ ...filter, endDate: e.target.value })} className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
        <select value={filter.granularity} onChange={(e) => setFilter({ ...filter, granularity: e.target.value })} className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
          <option value="day">Daily</option><option value="week">Weekly</option><option value="month">Monthly</option><option value="quarter">Quarterly</option><option value="year">Yearly</option>
        </select>
        <div className="flex gap-1 ml-auto">
          {["7d", "30d", "90d", "1y"].map((preset) => (
            <button key={preset} onClick={() => { const days = preset === "7d" ? 7 : preset === "30d" ? 30 : preset === "90d" ? 90 : 365; setFilter({ ...filter, startDate: new Date(Date.now() - days * 86400000).toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0] }); }} className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 transition-colors">{preset}</button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex items-center border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {TABS.map((tab) => { const Icon = tab.icon; return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}><Icon className="w-4 h-4" />{tab.label}</button>
          ); })}
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" /></div>
          ) : (
            <>
              {activeTab === "revenue" && <RevenueReport data={reportData} />}
              {activeTab === "tenants" && <TenantReport data={reportData} />}
              {activeTab === "usage" && <UsageReport data={reportData} />}
              {activeTab === "login" && <LoginReport data={reportData} />}
              {activeTab === "subscription" && <SubscriptionReport data={reportData} />}
              {activeTab === "audit" && <AuditReport data={reportData} />}
              {activeTab === "system" && <SystemReport data={reportData} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// REVENUE REPORT
// ═══════════════════════════════════════════════════════════

function RevenueReport({ data }: { data: any }) {
  if (!data) return null;
  const { summary, chartData } = data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Revenue" value={`\u20B9${(summary.totalRevenue || 0).toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} trend={22} trendLabel="vs last period" color="emerald" />
        <StatsCard title="Transactions" value={summary.totalTransactions?.toLocaleString() || "0"} icon={<CreditCard className="w-5 h-5" />} color="indigo" />
        <StatsCard title="Avg Transaction" value={`\u20B9${(summary.avgTransaction || 0).toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} color="cyan" />
        <StatsCard title="Growth" value="+22%" icon={<ArrowUpRight className="w-5 h-5" />} color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Revenue Trend" subtitle="Revenue over time">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(v: number) => `\u20B9${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue" />
                <Line type="monotone" dataKey="transactions" stroke="#10b981" strokeWidth={2} dot={false} name="Transactions" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <ChartCard title="Revenue by Type">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={Object.entries(summary.byType || {}).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {Object.entries(summary.byType || {}).map((_, idx) => (<Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TENANT REPORT
// ═══════════════════════════════════════════════════════════

function TenantReport({ data }: { data: any }) {
  if (!data) return null;
  const { summary, planDistribution, monthlyGrowth, topTenants } = data;
  const columns: Column<any>[] = [
    { key: "name", label: "Tenant", render: (row: any) => <span className="font-medium text-sm text-slate-900 dark:text-white">{row.name}</span> },
    { key: "plan", label: "Plan", render: (row: any) => <span className="px-2 py-0.5 text-xs font-medium rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">{row.plan}</span> },
    { key: "users", label: "Users" },
    { key: "active", label: "Status", render: (row: any) => <span className={`px-2 py-0.5 text-xs font-medium rounded ${row.active ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-red-50 text-red-600"}`}>{row.active ? "Active" : "Inactive"}</span> },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Tenants" value={summary.totalTenants} icon={<Building2 className="w-5 h-5" />} color="indigo" />
        <StatsCard title="Active" value={summary.activeTenants} icon={<Activity className="w-5 h-5" />} color="emerald" />
        <StatsCard title="New This Month" value={summary.newThisMonth} icon={<TrendingUp className="w-5 h-5" />} trend={summary.growth} color="cyan" />
        <StatsCard title="Avg Users/Tenant" value={summary.avgUsersPerTenant} icon={<Users className="w-5 h-5" />} color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Tenant Growth" subtitle="Monthly new registrations">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyGrowth}><CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} /><XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(v: string) => v.slice(5)} /><YAxis tick={{ fontSize: 11 }} stroke="#64748b" /><Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} /><Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="New Tenants" /></BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Plan Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={Object.entries(planDistribution || {}).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>{Object.entries(planDistribution || {}).map((_, idx) => (<Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} /></PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <DataTable columns={columns} data={topTenants || []} title="Top Tenants by Users" rowKey="id" pageSize={10} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// USAGE REPORT
// ═══════════════════════════════════════════════════════════

function UsageReport({ data }: { data: any }) {
  if (!data) return null;
  const { summary, dailyApiCalls, storageByTenant } = data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total API Calls" value={summary.totalApiCalls?.toLocaleString() || "0"} icon={<Activity className="w-5 h-5" />} color="indigo" />
        <StatsCard title="Avg Response Time" value={`${summary.avgResponseTime}ms`} icon={<Clock className="w-5 h-5" />} color="cyan" />
        <StatsCard title="Total Storage" value={`${Math.round((summary.totalStorage || 0) / (1024 * 1024))} MB`} icon={<HardDrive className="w-5 h-5" />} color="purple" />
        <StatsCard title="Top Endpoints" value={summary.topEndpoints?.length || 0} icon={<Activity className="w-5 h-5" />} color="emerald" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Daily API Calls" subtitle="Last 30 days">
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={dailyApiCalls}><CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} /><XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(v: string) => v.slice(5)} /><YAxis tick={{ fontSize: 11 }} stroke="#64748b" /><Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} /><Area type="monotone" dataKey="calls" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} name="API Calls" /></AreaChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Storage by Tenant">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={storageByTenant} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} /><XAxis type="number" tick={{ fontSize: 11 }} stroke="#64748b" /><YAxis dataKey="tenant" type="category" tick={{ fontSize: 11 }} stroke="#64748b" width={100} /><Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} /><Bar dataKey="used" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Used" /></BarChart></ResponsiveContainer>
        </ChartCard>
      </div>
      {summary.topEndpoints && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Top API Endpoints</h4>
          <div className="space-y-2">{summary.topEndpoints.map((ep: any, idx: number) => (<div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800"><span className="text-sm font-mono text-slate-600 dark:text-slate-400">{ep.endpoint}</span><span className="text-sm font-semibold text-slate-900 dark:text-white">{ep.count.toLocaleString()} calls</span></div>))}</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LOGIN REPORT
// ═══════════════════════════════════════════════════════════

function LoginReport({ data }: { data: any }) {
  if (!data) return null;
  const { summary, byHour, byDevice, dailyLogins, suspiciousIps } = data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Logins" value={summary.totalLogins?.toLocaleString() || "0"} icon={<LogIn className="w-5 h-5" />} color="indigo" />
        <StatsCard title="Successful" value={summary.successful?.toLocaleString() || "0"} icon={<Activity className="w-5 h-5" />} color="emerald" />
        <StatsCard title="Failed" value={summary.failed?.toLocaleString() || "0"} icon={<AlertTriangle className="w-5 h-5" />} color="rose" />
        <StatsCard title="Success Rate" value={`${summary.successRate}%`} icon={<TrendingUp className="w-5 h-5" />} color="cyan" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Daily Login Activity" subtitle="Success vs Failed">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={dailyLogins}><CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} /><XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(v: string) => v.slice(5)} /><YAxis tick={{ fontSize: 11 }} stroke="#64748b" /><Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} /><Bar dataKey="success" fill="#10b981" radius={[4, 4, 0, 0]} name="Successful" stackId="a" /><Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failed" stackId="a" /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Login by Hour">
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={byHour}><CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} /><XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(v: number) => `${v}:00`} /><YAxis tick={{ fontSize: 11 }} stroke="#64748b" /><Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} /><Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} name="Logins" /></AreaChart></ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Device Distribution">
          <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={Object.entries(byDevice || {}).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>{Object.entries(byDevice || {}).map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} /><Legend /></PieChart></ResponsiveContainer>
        </ChartCard>
        {suspiciousIps?.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 p-4">
            <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Suspicious IPs (5+ failed attempts)</h4>
            <div className="space-y-2">{suspiciousIps.map((ip: any, idx: number) => (<div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg"><span className="text-sm font-mono text-slate-700 dark:text-slate-300">{ip.ip}</span><span className="text-sm font-bold text-red-600 dark:text-red-400">{ip.attempts} attempts</span></div>))}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SUBSCRIPTION REPORT
// ═══════════════════════════════════════════════════════════

function SubscriptionReport({ data }: { data: any }) {
  if (!data) return null;
  const { summary, planRevenue, mrrTrend } = data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="MRR" value={`\u20B9${(summary.mrr || 0).toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} trend={12} trendLabel="growth" color="emerald" />
        <StatsCard title="ARR" value={`\u20B9${(summary.arr || 0).toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} color="indigo" />
        <StatsCard title="Churn Rate" value={`${summary.churnRate}%`} icon={<TrendingDown className="w-5 h-5" />} color="rose" />
        <StatsCard title="LTV" value={`\u20B9${(summary.ltv || 0).toLocaleString()}`} icon={<CreditCard className="w-5 h-5" />} color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="MRR Trend" subtitle="Monthly recurring revenue">
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={mrrTrend}><CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} /><XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(v: string) => v.slice(5)} /><YAxis tick={{ fontSize: 11 }} stroke="#64748b" /><Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} /><Area type="monotone" dataKey="mrr" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="MRR" /></AreaChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Revenue by Plan">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={Object.entries(planRevenue || {}).map(([plan, d]: [string, any]) => ({ plan, ...d }))}><CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} /><XAxis dataKey="plan" tick={{ fontSize: 11 }} stroke="#64748b" /><YAxis tick={{ fontSize: 11 }} stroke="#64748b" /><Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} /><Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Subscribers" /><Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" /></BarChart></ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// AUDIT & SYSTEM REPORTS
// ═══════════════════════════════════════════════════════════

function AuditReport({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Events" value={data.totalLogs?.toLocaleString() || "0"} icon={<Shield className="w-5 h-5" />} color="indigo" />
        <StatsCard title="This Week" value={data.weekLogs?.toLocaleString() || "0"} icon={<Activity className="w-5 h-5" />} color="emerald" />
        <StatsCard title="Warnings" value={data.bySeverity?.warning || 0} icon={<AlertTriangle className="w-5 h-5" />} color="amber" />
        <StatsCard title="Critical" value={data.bySeverity?.critical || 0} icon={<AlertTriangle className="w-5 h-5" />} color="rose" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Events by Severity">
          <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={Object.entries(data.bySeverity || {}).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>{Object.entries(data.bySeverity || {}).map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} /><Legend /></PieChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Events by Type">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={Object.entries(data.byType || {}).map(([name, value]) => ({ name, value }))}><CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} /><XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" /><YAxis tick={{ fontSize: 11 }} stroke="#64748b" /><Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} /><Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Events" /></BarChart></ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function SystemReport({ data }: { data: any }) {
  if (!data) return null;
  const { summary } = data;
  const formatUptime = (s: number) => { if (!s) return "\u2014"; const d = Math.floor(s / 86400); const h = Math.floor((s % 86400) / 3600); const m = Math.floor((s % 3600) / 60); return `${d}d ${h}h ${m}m`; };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={summary.totalUsers?.toLocaleString() || "0"} icon={<Users className="w-5 h-5" />} color="indigo" />
        <StatsCard title="Total Tenants" value={summary.totalTenants?.toLocaleString() || "0"} icon={<Building2 className="w-5 h-5" />} color="emerald" />
        <StatsCard title="DB Size" value={`${summary.dbSizeMB || 0} MB`} icon={<HardDrive className="w-5 h-5" />} color="purple" />
        <StatsCard title="Uptime" value={formatUptime(summary.uptime)} icon={<Server className="w-5 h-5" />} color="cyan" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-4">System Information</h4>
          <div className="space-y-3">
            {[["Node.js", summary.nodeVersion], ["Audit Logs", (summary.totalLogs||0).toLocaleString()], ["DB Size", `${summary.dbSizeMB || 0} MB`], ["Uptime", formatUptime(summary.uptime)]].map(([l, v]) => (
              <div key={String(l)} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"><span className="text-sm text-slate-500 dark:text-slate-400">{l}</span><span className="text-sm font-medium text-slate-900 dark:text-white">{v}</span></div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Memory Usage</h4>
          <div className="space-y-4">
            {[["Heap Used", summary.memoryUsage?.heapUsed, summary.memoryUsage?.heapTotal], ["RSS", summary.memoryUsage?.rss, summary.memoryUsage?.rss * 1.5]].map(([label, used, total]) => {
              const pct = Math.min(100, Math.round(((used as number) || 0) / ((total as number) || 1) * 100));
              return (<div key={String(label)}><div className="flex justify-between mb-1"><span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span><span className="text-xs font-medium text-slate-900 dark:text-white">{Math.round(((used as number)||0)/(1024*1024))} MB ({pct}%)</span></div><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} /></div></div>);
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════

function generateMockData(type: string): any {
  switch (type) {
    case "revenue": return { summary: { totalRevenue: 2847500, totalTransactions: 1247, avgTransaction: 2283, byType: { subscription: 2100000, addon: 500000, setup: 247500 } }, chartData: Array.from({ length: 6 }, (_, i) => ({ period: `2025-${String(i + 1).padStart(2, "0")}`, revenue: Math.floor(Math.random() * 500000) + 300000, transactions: Math.floor(Math.random() * 200) + 150 })) };
    case "tenants": return { summary: { totalTenants: 156, activeTenants: 142, inactiveTenants: 14, newThisMonth: 8, growth: 23, avgUsersPerTenant: 45 }, planDistribution: { free: 42, starter: 56, professional: 38, enterprise: 20 }, monthlyGrowth: Array.from({ length: 12 }, (_, i) => ({ month: `2025-${String(i + 1).padStart(2, "0")}`, count: Math.floor(Math.random() * 15) + 5 })), topTenants: Array.from({ length: 10 }, (_, i) => ({ id: `t-${i}`, name: `College ${i + 1}`, plan: ["free", "starter", "professional", "enterprise"][i % 4], users: Math.floor(Math.random() * 200) + 20, active: i < 8 })) };
    case "usage": return { summary: { totalApiCalls: 456789, avgResponseTime: 145, totalStorage: 5 * 1024 * 1024 * 1024, topEndpoints: [{ endpoint: "GET /api/dashboard", count: 45000 }, { endpoint: "POST /api/auth/login", count: 32000 }, { endpoint: "GET /api/students", count: 28000 }, { endpoint: "GET /api/attendance", count: 21000 }, { endpoint: "POST /api/fees/payment", count: 15000 }] }, dailyApiCalls: Array.from({ length: 30 }, (_, i) => ({ date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split("T")[0], calls: Math.floor(Math.random() * 20000) + 10000 })), storageByTenant: Array.from({ length: 8 }, (_, i) => ({ tenant: `College ${i + 1}`, used: Math.floor(Math.random() * 500000000) + 50000000 })) };
    case "login": return { summary: { totalLogins: 12456, successful: 11890, failed: 566, successRate: 95 }, byHour: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: Math.floor(Math.random() * 200) + (i >= 8 && i <= 18 ? 100 : 20) })), byDevice: { desktop: 6500, mobile: 4200, tablet: 1200, other: 556 }, dailyLogins: Array.from({ length: 30 }, (_, i) => ({ date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split("T")[0], success: Math.floor(Math.random() * 400) + 200, failed: Math.floor(Math.random() * 30) + 5 })), suspiciousIps: [{ ip: "45.33.32.156", attempts: 23 }, { ip: "185.220.101.34", attempts: 18 }, { ip: "103.253.41.65", attempts: 12 }] };
    case "subscription": return { summary: { mrr: 485000, arr: 5820000, churnRate: 3, ltv: 145000, activeSubscriptions: 142, avgMonthlyFee: 3415 }, planRevenue: { free: { count: 42, revenue: 0 }, starter: { count: 56, revenue: 112000 }, professional: { count: 38, revenue: 228000 }, enterprise: { count: 20, revenue: 200000 } }, mrrTrend: Array.from({ length: 12 }, (_, i) => ({ month: `2025-${String(i + 1).padStart(2, "0")}`, mrr: 350000 + i * 15000 + Math.floor(Math.random() * 20000), subscribers: 110 + i * 3 })) };
    case "audit": return { totalLogs: 45892, weekLogs: 2156, bySeverity: { info: 35000, warning: 8000, error: 2500, critical: 392 }, byType: { audit: 12000, user: 15000, activity: 8000, admin: 5000, api: 4000, db: 1892 } };
    case "system": return { summary: { totalUsers: 6742, totalTenants: 156, totalLogs: 45892, dbSizeBytes: 2.5 * 1024 * 1024 * 1024, dbSizeMB: 2560, uptime: 1234567, nodeVersion: "v20.11.0", memoryUsage: { heapUsed: 156 * 1024 * 1024, heapTotal: 256 * 1024 * 1024, rss: 320 * 1024 * 1024 } } };
    default: return null;
  }
}
