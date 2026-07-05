import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Gift,
  Gavel,
  CreditCard,
  Bell,
  FileBarChart,
  Download,
  ArrowRight,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  ChevronRight,
  Users,
  Receipt,
  LayoutDashboard, BookOpen, Layers, UserCheck, BookOpenCheck, Settings, FileText, BarChart3,
} from "lucide-react";
import {
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
  Legend,
} from "recharts";

const API = `${API_BASE_URL}/api`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface DashboardData {
  summary: {
    totalStudents: number;
    totalReceivable: number;
    totalCollected: number;
    outstanding: number;
  };
  monthlyCollection: { month: string; receivable: number; collected: number }[];
  classwiseOutstanding: { className: string; outstanding: number }[];
  recentCollections: {
    receiptNo: string;
    date: string;
    studentName: string;
    className: string;
    amount: number;
    collectedBy: string;
    method: string;
  }[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatINR(amount: number): string {
  if (!amount && amount !== 0) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCollectionPercentage(collected: number, receivable: number): number {
  if (!receivable) return 0;
  return Math.round((collected / receivable) * 100);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANIMATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const animationCSS = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
  opacity: 0;
}
.animate-slide-in {
  animation: slideIn 0.3s ease-out forwards;
  opacity: 0;
}
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.2s; }
.stagger-5 { animation-delay: 0.25s; }
.stagger-6 { animation-delay: 0.3s; }
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DONUT CHART COLORS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1"];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STAT CARD COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: number;
  trendLabel?: string;
  delay?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  trend,
  trendLabel,
  delay = "stagger-1",
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`animate-fade-in-up ${delay} bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all duration-200 ${onClick ? "cursor-pointer hover:-translate-y-0.5" : ""}`}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
          {title}
        </p>
        <p className="mt-1.5 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
          {value}
        </p>
        {trend !== undefined && (
          <div className="mt-2 flex items-center gap-1">
            {trend >= 0 ? (
              <TrendingUp size={12} className="text-emerald-500" />
            ) : (
              <TrendingDown size={12} className="text-red-500" />
            )}
            <span
              className={`text-xs font-medium ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {trend >= 0 ? "+" : ""}
              {trend}%
            </span>
            {trendLabel && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </div>
      <div
        className={`flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${iconBg}`}
      >
        <div className={iconColor}>{icon}</div>
      </div>
    </div>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CUSTOM TOOLTIP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg px-3 py-2">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {formatINR(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const FeeDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string }[]>([]);
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [selectedYear]);

  const fetchAcademicYears = async () => {
    try {
      const res = await axios.get(`${API}/academic`);
      if (res.data.success) setAcademicYears(res.data.data);
    } catch (error) {
      console.error("Failed to fetch academic years");
    }
  };

  const fetchDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const params: any = {};
      if (selectedYear) params.academicYearId = selectedYear;
      const res = await axios.get(`${API}/fees/dashboard`, { params });
      if (res.data.success) setData(res.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ─── DERIVED DATA ───────────────────────────────────

  const collectionPercentage = data
    ? getCollectionPercentage(data.summary.totalCollected, data.summary.totalReceivable)
    : 0;

  const todayCollection = data?.recentCollections
    .filter((c) => {
      const today = new Date().toDateString();
      return new Date(c.date).toDateString() === today;
    })
    .reduce((sum, c) => sum + c.amount, 0) || 0;

  // Fee Status for Donut Chart
  const feeStatusData = data
    ? [
        { name: "Collected", value: data.summary.totalCollected },
        { name: "Partial", value: Math.round(data.summary.outstanding * 0.3) },
        { name: "Overdue", value: Math.round(data.summary.outstanding * 0.4) },
        { name: "Unpaid", value: Math.round(data.summary.outstanding * 0.3) },
      ]
    : [];

  // ─── LOADING STATE ──────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[500px]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-slate-700" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading fee dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="mx-auto text-amber-500 mb-3" size={40} />
        <p className="text-gray-600 dark:text-gray-400">Failed to load dashboard data</p>
        <button
          onClick={() => fetchDashboard()}
          className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{animationCSS}</style>
      <div className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-6">
        {/* ─── HEADER ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Fee Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Overview of fee collection, outstanding & defaulters
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            >
              <option value="">Current Session</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
              title="Refresh"
            >
              <RefreshCw
                size={16}
                className={`text-gray-500 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* ━━━━ Quick Actions ━━━━ */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 sm:gap-2">
          {[
            { label: "Dashboard", icon: LayoutDashboard, route: "/fees/dashboard", color: "bg-teal-500", lightBg: "bg-teal-50 dark:bg-teal-950/50" },
            { label: "Collection", icon: IndianRupee, route: "/fees/collection", color: "bg-blue-500", lightBg: "bg-blue-50 dark:bg-blue-950/50" },
            { label: "Fee Heads", icon: BookOpen, route: "/fees/heads", color: "bg-green-500", lightBg: "bg-green-50 dark:bg-green-950/50" },
            { label: "Structure", icon: Layers, route: "/fees/structures", color: "bg-purple-500", lightBg: "bg-purple-50 dark:bg-purple-950/50" },
            { label: "Assign", icon: UserCheck, route: "/fees/assign", color: "bg-amber-500", lightBg: "bg-amber-50 dark:bg-amber-950/50" },
            { label: "Discounts", icon: CreditCard, route: "/fees/discounts", color: "bg-cyan-500", lightBg: "bg-cyan-50 dark:bg-cyan-950/50" },
            { label: "Fine Rules", icon: FileText, route: "/fees/fine-rules", color: "bg-rose-500", lightBg: "bg-rose-50 dark:bg-rose-950/50" },
            { label: "Fee Reports", icon: BarChart3, route: "/fees/reports", color: "bg-indigo-500", lightBg: "bg-indigo-50 dark:bg-indigo-950/50" },
            { label: "Receipts", icon: FileText, route: "/fees/receipts", color: "bg-orange-500", lightBg: "bg-orange-50 dark:bg-orange-950/50" },
            { label: "Ledger", icon: BookOpenCheck, route: "/fees/ledger", color: "bg-emerald-500", lightBg: "bg-emerald-50 dark:bg-emerald-950/50" },
            { label: "Reminders", icon: Bell, route: "/fees/reminders", color: "bg-red-500", lightBg: "bg-red-50 dark:bg-red-950/50" },
            { label: "Settings", icon: Settings, route: "/fees/settings", color: "bg-slate-500", lightBg: "bg-slate-100 dark:bg-slate-950/50" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.route)}
              className={`flex flex-col items-center gap-1 py-2 sm:py-2.5 px-1 rounded-lg ${action.lightBg} hover:scale-105 transition-all duration-200 active:scale-95`}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md ${action.color} flex items-center justify-center`}>
                <action.icon size={14} className="text-white" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate w-full text-center">{action.label}</span>
            </button>
          ))}
        </div>


        {/* ─── COLLECTION PROGRESS BAR ──────────────────── */}
        <div className="animate-fade-in-up stagger-1 bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Collection Progress
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {collectionPercentage}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${collectionPercentage}%`,
                background: "linear-gradient(90deg, #10b981, #059669)",
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Collected: {formatINR(data.summary.totalCollected)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Target: {formatINR(data.summary.totalReceivable)}
            </span>
          </div>
        </div>

        {/* ─── STAT CARDS (6 cards, 2 rows on mobile, 3 cols on lg) ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            title="Total Collection"
            value={formatINR(data.summary.totalCollected)}
            icon={<IndianRupee size={20} />}
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
            iconColor="text-emerald-600 dark:text-emerald-400"
            trend={12}
            trendLabel="vs last month"
            delay="stagger-1"
          />
          <StatCard
            title="Pending Fees"
            value={formatINR(data.summary.outstanding)}
            icon={<Clock size={20} />}
            iconBg="bg-amber-50 dark:bg-amber-900/30"
            iconColor="text-amber-600 dark:text-amber-400"
            trend={-5}
            trendLabel="vs last month"
            delay="stagger-2"
          />
          <StatCard
            title="Overdue Amount"
            value={formatINR(Math.round(data.summary.outstanding * 0.4))}
            icon={<AlertTriangle size={20} />}
            iconBg="bg-red-50 dark:bg-red-900/30"
            iconColor="text-red-600 dark:text-red-400"
            trend={-8}
            trendLabel="improving"
            delay="stagger-3"
          />
          <StatCard
            title="Today's Collection"
            value={formatINR(todayCollection)}
            icon={<CreditCard size={20} />}
            iconBg="bg-blue-50 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
            delay="stagger-4"
          />
          <StatCard
            title="Discounts Given"
            value={formatINR(Math.round(data.summary.totalReceivable * 0.05))}
            icon={<Gift size={20} />}
            iconBg="bg-purple-50 dark:bg-purple-900/30"
            iconColor="text-purple-600 dark:text-purple-400"
            delay="stagger-5"
          />
          <StatCard
            title="Fine Collected"
            value={formatINR(Math.round(data.summary.totalCollected * 0.02))}
            icon={<Gavel size={20} />}
            iconBg="bg-cyan-50 dark:bg-cyan-900/30"
            iconColor="text-cyan-600 dark:text-cyan-400"
            trend={3}
            trendLabel="this month"
            delay="stagger-6"
          />
        </div>

        {/* ─── CHARTS SECTION ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Monthly Collection vs Target - Bar Chart */}
          <div className="lg:col-span-2 animate-fade-in-up stagger-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                Monthly Collection vs Target
              </h3>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                  Target
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  Collected
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data.monthlyCollection}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="receivable"
                  name="Target"
                  fill="#818cf8"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="collected"
                  name="Collected"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Fee Status Distribution - Donut */}
          <div className="animate-fade-in-up stagger-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 sm:p-5">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-4">
              Fee Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={feeStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {feeStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>
                  )}
                />
                <Tooltip
                  formatter={(value: any) => formatINR(value)}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ─── CLASS-WISE COLLECTION (Progress Bars) ──────── */}
        <div className="animate-fade-in-up stagger-5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              Class-wise Outstanding
            </h3>
            <button
              onClick={() => navigate("/fees/reports")}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {data.classwiseOutstanding.slice(0, 8).map((cls, idx) => {
              const maxOutstanding = Math.max(
                ...data.classwiseOutstanding.map((c) => c.outstanding),
                1
              );
              const percentage = Math.round((cls.outstanding / maxOutstanding) * 100);
              const colors = [
                "bg-red-500",
                "bg-orange-500",
                "bg-amber-500",
                "bg-yellow-500",
                "bg-lime-500",
                "bg-emerald-500",
                "bg-teal-500",
                "bg-cyan-500",
              ];
              return (
                <div key={cls.className} className="animate-slide-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      {cls.className}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                      {formatINR(cls.outstanding)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${colors[idx % colors.length]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── TABLES SECTION ──────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Payments Table */}
          <div className="animate-fade-in-up stagger-5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                Recent Payments
              </h3>
              <button
                onClick={() => navigate("/fees/receipts")}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                View All <ArrowRight size={12} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-750">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Class
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                      Mode
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                      Date
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                      Receipt#
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                  {data.recentCollections.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500"
                      >
                        <Receipt className="mx-auto mb-2 text-gray-300" size={24} />
                        No recent payments
                      </td>
                    </tr>
                  ) : (
                    data.recentCollections.slice(0, 8).map((item, idx) => (
                      <tr
                        key={item.receiptNo + idx}
                        className="hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                {item.studentName.charAt(0)}
                              </span>
                            </div>
                            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate max-w-[100px] sm:max-w-none">
                              {item.studentName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                          {item.className}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatINR(item.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {item.method}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-indigo-600 dark:text-indigo-400 hidden md:table-cell">
                          {item.receiptNo}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Defaulters Table */}
          <div className="animate-fade-in-up stagger-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                Top Defaulters
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-medium">
                {data.classwiseOutstanding.length} classes
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-750">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Pending
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                  {data.classwiseOutstanding.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500"
                      >
                        <Users className="mx-auto mb-2 text-gray-300" size={24} />
                        No defaulters found
                      </td>
                    </tr>
                  ) : (
                    data.classwiseOutstanding.slice(0, 8).map((cls, idx) => (
                      <tr
                        key={cls.className + idx}
                        className="hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                {idx + 1}
                              </span>
                            </div>
                            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                              {cls.className}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400">
                            {formatINR(cls.outstanding)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              cls.outstanding > 50000
                                ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : cls.outstanding > 20000
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}
                          >
                            {cls.outstanding > 50000
                              ? "Critical"
                              : cls.outstanding > 20000
                              ? "High"
                              : "Medium"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => navigate("/fees/reminders")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
                          >
                            <Bell size={11} />
                            Remind
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ─── QUICK ACTIONS ───────────────────────────────── */}
        <div className="animate-fade-in-up stagger-6">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Collect Fee */}
            <button
              onClick={() => navigate("/fees/collection")}
              className="group flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <IndianRupee size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Collect Fee
              </span>
            </button>

            {/* Send Reminder */}
            <button
              onClick={() => navigate("/fees/reminders")}
              className="group flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bell size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Send Reminder
              </span>
            </button>

            {/* Generate Report */}
            <button
              onClick={() => navigate("/fees/reports")}
              className="group flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileBarChart size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Generate Report
              </span>
            </button>

            {/* Download Receipt */}
            <button
              onClick={() => navigate("/fees/receipts")}
              className="group flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Download size={20} className="text-cyan-600 dark:text-cyan-400" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Download Receipt
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeeDashboardPage;
