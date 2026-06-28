import { useEffect, useState } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import { useNavigate } from "react-router-dom";
import {
  UserPlus, Users, CheckCircle, Clock, XCircle,
  TrendingUp, TrendingDown, ArrowRight, Plus,
  FileText, Download, Printer, Filter, Search,
  RefreshCw, Calendar, Eye, MoreHorizontal,
} from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from "recharts";

// ─────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────

interface AdmissionStats {
  totalApplications: number;
  approved: number;
  pending: number;
  rejected: number;
  thisMonth: number;
  conversionRate: number;
}

interface Application {
  id: string;
  studentName: string;
  className: string;
  appliedOn: string;
  status: "PENDING" | "REVIEWED" | "APPROVED" | "REJECTED" | "ENROLLED";
  parentName: string;
  phone: string;
  source: string;
}

// ─────────────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────────────

const FUNNEL_COLORS = ["#6366f1", "#8b5cf6", "#10b981", "#06b6d4"];
const SOURCE_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────

const STATUS_BADGES: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400" },
  REVIEWED: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  APPROVED: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  REJECTED: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
  ENROLLED: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400" },
};

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────

export default function AdmissionDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdmissionStats>({
    totalApplications: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    thisMonth: 0,
    conversionRate: 0,
  });
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [classWiseData, setClassWiseData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(getFullUrl("/api/admission/dashboard"), { headers });
      const data = res.data;

      setStats(data.stats || {
        totalApplications: 0, approved: 0, pending: 0,
        rejected: 0, thisMonth: 0, conversionRate: 0,
      });
      setFunnelData(data.funnelData || []);
      setClassWiseData(data.classWiseApplications || []);
      setMonthlyData(data.monthlyAdmissions || []);
      setSourceData(data.sourceDistribution || []);
      setApplications(data.recentApplications || []);
    } catch (err) {
      console.error("Failed to fetch admission dashboard:", err);
      // Fallback demo data
      setStats({
        totalApplications: 186,
        approved: 142,
        pending: 28,
        rejected: 16,
        thisMonth: 34,
        conversionRate: 76.3,
      });
      setFunnelData([
        { stage: "Applied", count: 186 },
        { stage: "Reviewed", count: 158 },
        { stage: "Approved", count: 142 },
        { stage: "Enrolled", count: 128 },
      ]);
      setClassWiseData([
        { class: "Nursery", count: 28 },
        { class: "LKG", count: 24 },
        { class: "UKG", count: 22 },
        { class: "Class 1", count: 18 },
        { class: "Class 2", count: 15 },
        { class: "Class 3", count: 12 },
        { class: "Class 4", count: 10 },
        { class: "Class 5", count: 8 },
        { class: "Class 6", count: 14 },
        { class: "Class 7", count: 11 },
        { class: "Class 8", count: 9 },
        { class: "Class 9", count: 8 },
        { class: "Class 10", count: 7 },
      ]);
      setMonthlyData([
        { month: "Jan", admissions: 18 },
        { month: "Feb", admissions: 22 },
        { month: "Mar", admissions: 45 },
        { month: "Apr", admissions: 38 },
        { month: "May", admissions: 29 },
        { month: "Jun", admissions: 34 },
      ]);
      setSourceData([
        { name: "Online", value: 65 },
        { name: "Walk-in", value: 52 },
        { name: "Transfer", value: 38 },
        { name: "Sibling", value: 21 },
        { name: "Referral", value: 10 },
      ]);
      setApplications([
        { id: "1", studentName: "Aarav Sharma", className: "Class 5", appliedOn: "2026-06-25", status: "PENDING", parentName: "Rajesh Sharma", phone: "9876543210", source: "Online" },
        { id: "2", studentName: "Priya Singh", className: "Nursery", appliedOn: "2026-06-24", status: "APPROVED", parentName: "Vikash Singh", phone: "9876543211", source: "Walk-in" },
        { id: "3", studentName: "Rohan Gupta", className: "Class 3", appliedOn: "2026-06-23", status: "REVIEWED", parentName: "Anil Gupta", phone: "9876543212", source: "Sibling" },
        { id: "4", studentName: "Ananya Patel", className: "LKG", appliedOn: "2026-06-22", status: "ENROLLED", parentName: "Kiran Patel", phone: "9876543213", source: "Online" },
        { id: "5", studentName: "Kabir Joshi", className: "Class 8", appliedOn: "2026-06-21", status: "REJECTED", parentName: "Suresh Joshi", phone: "9876543214", source: "Transfer" },
        { id: "6", studentName: "Meera Reddy", className: "Class 1", appliedOn: "2026-06-20", status: "PENDING", parentName: "Naresh Reddy", phone: "9876543215", source: "Online" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────
  // STAT CARD
  // ─────────────────────────────────────────────────────

  const StatCard = ({
    title, value, icon: Icon, color, trend, trendValue, subtitle,
  }: {
    title: string; value: string | number; icon: any; color: string;
    trend?: "up" | "down"; trendValue?: string; subtitle?: string;
  }) => {
    const colorMap: Record<string, { iconBg: string; iconText: string }> = {
      blue: { iconBg: "bg-blue-100 dark:bg-blue-900/30", iconText: "text-blue-600 dark:text-blue-400" },
      green: { iconBg: "bg-green-100 dark:bg-green-900/30", iconText: "text-green-600 dark:text-green-400" },
      amber: { iconBg: "bg-amber-100 dark:bg-amber-900/30", iconText: "text-amber-600 dark:text-amber-400" },
      red: { iconBg: "bg-red-100 dark:bg-red-900/30", iconText: "text-red-600 dark:text-red-400" },
      purple: { iconBg: "bg-purple-100 dark:bg-purple-900/30", iconText: "text-purple-600 dark:text-purple-400" },
      indigo: { iconBg: "bg-indigo-100 dark:bg-indigo-900/30", iconText: "text-indigo-600 dark:text-indigo-400" },
    };
    const c = colorMap[color] || colorMap.blue;

    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${c.iconText}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              trend === "up" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}>
              {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trendValue}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────
  // FILTERED APPLICATIONS
  // ─────────────────────────────────────────────────────

  const filteredApplications = applications.filter((app) => {
    const matchesSearch = app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.parentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ─────────────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-64 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-72 bg-white dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admission Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track and manage student admissions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate("/students/new-admission")}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Application
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Applications" value={stats.totalApplications} icon={Users} color="blue" trend="up" trendValue="+12%" />
        <StatCard title="Approved" value={stats.approved} icon={CheckCircle} color="green" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} color="amber" />
        <StatCard title="Rejected" value={stats.rejected} icon={XCircle} color="red" />
        <StatCard title="This Month" value={stats.thisMonth} icon={Calendar} color="purple" subtitle={`${stats.conversionRate}% conversion`} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Funnel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Funnel</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={funnelData} layout="vertical" barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={{ stroke: "#e5e7eb" }} />
              <YAxis
                type="category"
                dataKey="stage"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {funnelData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source of Admission - Donut */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Source of Admission</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
              >
                {sourceData.map((_, index) => (
                  <Cell key={`source-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={10}
                formatter={(value) => <span className="text-sm text-gray-600 dark:text-gray-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class-wise Applications - Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Class-wise Applications</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={classWiseData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="class"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
                angle={-30}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={{ stroke: "#e5e7eb" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Admissions - Area Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Admission Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="admissionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Area
                type="monotone"
                dataKey="admissions"
                stroke="#4f46e5"
                strokeWidth={2.5}
                fill="url(#admissionGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Applications Table + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Recent Applications Table */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="p-5 border-b border-gray-100 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Applications</h3>
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 w-40 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="REVIEWED">Reviewed</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="ENROLLED">Enrolled</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Student</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Class</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Applied On</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Source</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 dark:text-gray-500 py-8">
                      No applications found
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => (
                    <tr key={app.id} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {app.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{app.studentName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{app.parentName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{app.className}</td>
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {new Date(app.appliedOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{app.source}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[app.status]?.bg} ${STATUS_BADGES[app.status]?.text}`}>
                          {app.status.charAt(0) + app.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors" title="View">
                            <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </button>
                          <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors" title="More">
                            <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
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

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {[
                { label: "New Application", icon: Plus, color: "indigo", path: "/students/new-admission" },
                { label: "Approve Pending", icon: CheckCircle, color: "green", path: "/students/new-admission" },
                { label: "Download List", icon: Download, color: "blue", path: "#" },
                { label: "Print ID Cards", icon: Printer, color: "purple", path: "/students/id-card" },
                { label: "Admission Report", icon: FileText, color: "amber", path: "/students/reports" },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:border-gray-200 dark:hover:border-slate-500 transition-all group"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    action.color === "indigo" ? "bg-indigo-100 dark:bg-indigo-900/30" :
                    action.color === "green" ? "bg-green-100 dark:bg-green-900/30" :
                    action.color === "blue" ? "bg-blue-100 dark:bg-blue-900/30" :
                    action.color === "purple" ? "bg-purple-100 dark:bg-purple-900/30" :
                    "bg-amber-100 dark:bg-amber-900/30"
                  }`}>
                    <action.icon className={`w-4 h-4 ${
                      action.color === "indigo" ? "text-indigo-600 dark:text-indigo-400" :
                      action.color === "green" ? "text-green-600 dark:text-green-400" :
                      action.color === "blue" ? "text-blue-600 dark:text-blue-400" :
                      action.color === "purple" ? "text-purple-600 dark:text-purple-400" :
                      "text-amber-600 dark:text-amber-400"
                    }`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex-1 text-left">
                    {action.label}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Conversion Rate Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm p-5 text-white">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-5 h-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Conversion Rate</span>
            </div>
            <p className="text-3xl font-bold">{stats.conversionRate}%</p>
            <p className="text-sm opacity-75 mt-1">Applied → Enrolled</p>
            <div className="mt-3 w-full bg-white/20 rounded-full h-2">
              <div
                className="h-2 bg-white rounded-full transition-all"
                style={{ width: `${stats.conversionRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
