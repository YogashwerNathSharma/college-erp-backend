import { useEffect, useState } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import { useNavigate } from "react-router-dom";
import { useAcademicYear } from "../../context/AcademicYearContext";
import {
  UserCog, Users, UserCheck, Clock,
  BookOpen, Calendar,
  Plus, ClipboardCheck, Wallet, ArrowRight, TrendingUp,
  LayoutDashboard, IdCard, FolderOpen, BarChart3, Star, CalendarClock,
  TrendingDown, Award, Building2, RefreshCw, AlertCircle,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from "recharts";

// ─────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────

interface TeacherStats {
  totalTeachers: number;
  activeTeachers: number;
  onLeave: number;
  newJoinings: number;
  departments: number;
  maleTeachers: number;
  femaleTeachers: number;
}

interface TeacherOnLeave {
  id: string;
  name: string;
  department: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  status: string;
}

interface SalaryInfo {
  id: string;
  name: string;
  department: string;
  gross: number;
  deductions: number;
  net: number;
}

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────

function formatINR(amount: number): string {
  if (!amount && amount !== 0) return "₹0";
  return "₹" + amount.toLocaleString("en-IN");
}

/** Safe date formatter — returns "--" if the date is invalid */
function formatDateShort(dateStr: string): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "--";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

// ─────────────────────────────────────────────────────
// CHART COLORS
// ─────────────────────────────────────────────────────

const DEPT_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#06b6d4", "#8b5cf6", "#ec4899"];
const QUALIFICATION_COLORS = ["#6366f1", "#22c55e", "#eab308", "#ef4444"];
const GENDER_COLORS = ["#4f46e5", "#ec4899", "#94a3b8"]; // male, female, other/unset

// ─────────────────────────────────────────────────────
// EMPTY CHART PLACEHOLDER
// ─────────────────────────────────────────────────────

function EmptyChartPlaceholder({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[260px] text-gray-400 dark:text-gray-500">
      <AlertCircle className="w-10 h-10 mb-2 opacity-40" />
      <p className="text-sm font-medium">{message || "No data available"}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { selectedAcademicYearId, loading: academicYearLoading } = useAcademicYear();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TeacherStats>({
    totalTeachers: 0,
    activeTeachers: 0,
    onLeave: 0,
    newJoinings: 0,
    departments: 0,
    maleTeachers: 0,
    femaleTeachers: 0,
  });
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [experienceData, setExperienceData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [qualificationData, setQualificationData] = useState<any[]>([]);
  const [teachersOnLeave, setTeachersOnLeave] = useState<TeacherOnLeave[]>([]);
  const [salaryData, setSalaryData] = useState<SalaryInfo[]>([]);

  useEffect(() => {
    // Detect page refresh to bust cache (use modern PerformanceNavigationTiming API)
    let isPageRefresh = false;
    try {
      const navEntries = performance.getEntriesByType?.("navigation");
      if (navEntries && navEntries.length > 0) {
        isPageRefresh = (navEntries[0] as PerformanceNavigationTiming).type === "reload";
      }
    } catch {
      // Fallback: don't force refresh
    }
    if (!academicYearLoading && selectedAcademicYearId) {
      fetchDashboardData(isPageRefresh);
    }
  }, [academicYearLoading, selectedAcademicYearId]);

  const fetchDashboardData = async (refresh: boolean = false) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // ⚡ PERF: Pass refresh=true to bust 30-min backend cache
      const params = { academicYearId: selectedAcademicYearId, ...(refresh ? { refresh: "true" } : {}) };
      const res = await axios.get(getFullUrl("/api/teacher/dashboard"), { headers, params });
      const data = res.data?.data || res.data;

      setStats(data.stats || {
        totalTeachers: 0,
        activeTeachers: 0,
        onLeave: 0,
        newJoinings: 0,
        departments: 0,
        maleTeachers: 0,
        femaleTeachers: 0,
      });

      setDepartmentData(data.departmentDistribution || []);
      setExperienceData(data.experienceDistribution || []);
      setAttendanceData(data.attendanceTrend || []);
      setQualificationData(data.qualificationDistribution || []);
      setTeachersOnLeave(data.teachersOnLeave || []);
      setSalaryData(data.upcomingSalary || []);
    } catch (err) {
      console.error("Failed to fetch teacher dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────
  // COMPUTED VALUES (dynamic, not hardcoded)
  // ─────────────────────────────────────────────────────

  /** Active percentage — shown only when total > 0 */
  const activePercent = stats.totalTeachers > 0
    ? Math.round((stats.activeTeachers / stats.totalTeachers) * 100)
    : null;

  /** Gender distribution pie data — built from API stats */
  const genderData = (() => {
    const slices: { name: string; value: number }[] = [];
    if (stats.maleTeachers > 0) slices.push({ name: "Male", value: stats.maleTeachers });
    if (stats.femaleTeachers > 0) slices.push({ name: "Female", value: stats.femaleTeachers });
    const otherCount = stats.totalTeachers - stats.maleTeachers - stats.femaleTeachers;
    if (otherCount > 0) slices.push({ name: "Other", value: otherCount });
    return slices;
  })();

  // ─────────────────────────────────────────────────────
  // CLICKABLE STAT CARD COMPONENT
  // ─────────────────────────────────────────────────────

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    trend,
    trendValue,
    onClick,
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    onClick?: () => void;
  }) => {
    const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
      blue: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-900/50" },
      green: { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-600 dark:text-green-400", iconBg: "bg-green-100 dark:bg-green-900/50" },
      amber: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-100 dark:bg-amber-900/50" },
      red: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-600 dark:text-red-400", iconBg: "bg-red-100 dark:bg-red-900/50" },
      purple: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-100 dark:bg-purple-900/50" },
      cyan: { bg: "bg-cyan-50 dark:bg-cyan-950/30", text: "text-cyan-600 dark:text-cyan-400", iconBg: "bg-cyan-100 dark:bg-cyan-900/50" },
      indigo: { bg: "bg-indigo-50 dark:bg-indigo-950/30", text: "text-indigo-600 dark:text-indigo-400", iconBg: "bg-indigo-100 dark:bg-indigo-900/50" },
    };
    const c = colorMap[color] || colorMap.blue;

    return (
      <div
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
        className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 transition-all duration-200 ${
          onClick
            ? "cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600 hover:-translate-y-0.5 active:translate-y-0"
            : "hover:shadow-md"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${c.text}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
          </div>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              trend === "up" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
              trend === "down" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
              "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            }`}>
              {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
              {trendValue}
            </div>
          )}
          {onClick && (
            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500" />
          )}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────
  // LEAVE TYPE BADGE (dynamic — no hardcoded string matching)
  // ─────────────────────────────────────────────────────

  /** Render leave-type badge with a stable color based on the string hash */
  const LeaveTypeBadge = ({ leaveType }: { leaveType: string }) => {
    if (!leaveType) return <span className="text-xs text-gray-400">—</span>;

    // Deterministic color from the leaveType string so the same type always gets the same color
    const palettes = [
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
      "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    ];
    const hash = leaveType.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const cls = palettes[hash % palettes.length];

    // Humanize — capitalize first letter, truncate long IDs
    const label = leaveType.length > 20 ? leaveType.slice(0, 18) + "…" : leaveType;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
        {label}
      </span>
    );
  };

  // ─────────────────────────────────────────────────────
  // STATUS BADGE (dynamic — no hardcoded string matching)
  // ─────────────────────────────────────────────────────

  const StatusBadge = ({ status }: { status: string }) => {
    const upper = (status || "").toUpperCase();
    const isApproved = upper === "APPROVED";
    const cls = isApproved
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
        {status || "—"}
      </span>
    );
  };

  // ─────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          <div className="h-6 w-48 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-xl shadow-sm animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-72 bg-white dark:bg-slate-800 rounded-xl shadow-sm animate-pulse" />
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
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
            <UserCog className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teacher Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage and monitor your teaching staff</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDashboardData(true)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate("/teachers/add")}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Teacher
          </button>
        </div>
      </div>

      {/* ━━━━ Quick Actions (sidebar menu items) ━━━━ */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-1.5 sm:gap-2">
        {[
          { label: "Dashboard", icon: LayoutDashboard, route: "/teacher-dashboard", color: "bg-teal-500", lightBg: "bg-teal-50 dark:bg-teal-950/50" },
          { label: "All Teachers", icon: UserCog, route: "/teachers", color: "bg-blue-500", lightBg: "bg-blue-50 dark:bg-blue-950/50" },
          { label: "Assign Subject", icon: BookOpen, route: "/assign-subject", color: "bg-green-500", lightBg: "bg-green-50 dark:bg-green-950/50" },
          { label: "Timetable", icon: CalendarClock, route: "/teacher-timetable", color: "bg-purple-500", lightBg: "bg-purple-50 dark:bg-purple-950/50" },
          { label: "Attendance", icon: ClipboardCheck, route: "/teacher-attendance", color: "bg-amber-500", lightBg: "bg-amber-50 dark:bg-amber-950/50" },
          { label: "Leave", icon: Clock, route: "/teacher-leave", color: "bg-cyan-500", lightBg: "bg-cyan-50 dark:bg-cyan-950/50" },
          { label: "Salary", icon: Wallet, route: "/teacher-salary", color: "bg-emerald-500", lightBg: "bg-emerald-50 dark:bg-emerald-950/50" },
          { label: "Performance", icon: Star, route: "/teacher-performance", color: "bg-orange-500", lightBg: "bg-orange-50 dark:bg-orange-950/50" },
          { label: "Documents", icon: FolderOpen, route: "/teacher-documents", color: "bg-rose-500", lightBg: "bg-rose-50 dark:bg-rose-950/50" },
          { label: "Teacher Reports", icon: BarChart3, route: "/teacher-reports", color: "bg-indigo-500", lightBg: "bg-indigo-50 dark:bg-indigo-950/50" },
          { label: "ID Card", icon: IdCard, route: "/teacher-id-card", color: "bg-red-500", lightBg: "bg-red-50 dark:bg-red-950/50" },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.route)}
            className={`flex flex-col items-center gap-1 py-2 sm:py-2.5 px-1 rounded-lg ${action.lightBg} hover:scale-105 transition-all duration-200 group active:scale-95`}
          >
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md ${action.color} flex items-center justify-center`}>
              <action.icon size={14} className="text-white" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate w-full text-center">{action.label}</span>
          </button>
        ))}
      </div>

      {/* ━━━━ Stat Cards (ALL CLICKABLE — navigate to relevant pages) ━━━━ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Teachers"
          value={stats.totalTeachers}
          icon={Users}
          color="blue"
          onClick={() => navigate("/teachers")}
        />
        <StatCard
          title="Active"
          value={stats.activeTeachers}
          icon={UserCheck}
          color="green"
          /* Dynamic: show active percentage only when there are teachers */
          trend={activePercent !== null ? "up" : undefined}
          trendValue={activePercent !== null ? `${activePercent}%` : undefined}
          onClick={() => navigate("/teachers")}
        />
        <StatCard
          title="On Leave"
          value={stats.onLeave}
          icon={Clock}
          color="amber"
          onClick={() => navigate("/teacher-leave")}
        />
        <StatCard
          title="New Joinings"
          value={stats.newJoinings}
          icon={UserCog}
          color="purple"
          trend={stats.newJoinings > 0 ? "up" : undefined}
          trendValue={stats.newJoinings > 0 ? "This month" : undefined}
          onClick={() => navigate("/teachers")}
        />
        <StatCard
          title="Departments"
          value={stats.departments}
          icon={Building2}
          color="cyan"
          onClick={() => {
            /* Scroll to department chart on same page */
            document.getElementById("dept-chart")?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </div>

      {/* ━━━━ Charts Row 1 ━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution - Donut */}
        <div id="dept-chart" className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Department Distribution</h3>
          {departmentData.length === 0 ? (
            <EmptyChartPlaceholder message="No department data available" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {departmentData.map((_, index) => (
                    <Cell key={`dept-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
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
          )}
        </div>

        {/* Experience Distribution - Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Experience Distribution</h3>
          {experienceData.length === 0 || experienceData.every((d) => d.count === 0) ? (
            <EmptyChartPlaceholder message="No experience data available" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={experienceData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ━━━━ Charts Row 2 ━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Attendance - Area Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Attendance Trend</h3>
          {attendanceData.length === 0 ? (
            <EmptyChartPlaceholder message="No attendance trend data available" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="attendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  domain={[80, 100]}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                  formatter={(val: any) => [`${val}%`, "Attendance"]}
                />
                <Area
                  type="monotone"
                  dataKey="percentage"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#attendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gender Distribution - Donut (built from API stats) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gender Distribution</h3>
          {genderData.length === 0 ? (
            <EmptyChartPlaceholder message="No gender data available" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {genderData.map((_, index) => (
                    <Cell key={`gender-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                  formatter={(val: any, name: string) => [`${val} teachers`, name]}
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
          )}
        </div>
      </div>

      {/* ━━━━ Charts Row 3 (Qualification — only if API returns data) ━━━━ */}
      {qualificationData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Qualification Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={qualificationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {qualificationData.map((_, index) => (
                    <Cell key={`qual-${index}`} fill={QUALIFICATION_COLORS[index % QUALIFICATION_COLORS.length]} />
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
      )}

      {/* ━━━━ Tables + Quick Actions Row ━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teachers on Leave */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Teachers on Leave</h3>
            <button
              onClick={() => navigate("/teacher-leave")}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Department</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Duration</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {teachersOnLeave.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 dark:text-gray-500 py-8">
                      No teachers on leave today
                    </td>
                  </tr>
                ) : (
                  teachersOnLeave.map((teacher) => (
                    <tr key={teacher.id} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {teacher.name?.charAt(0) || "?"}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{teacher.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{teacher.department || "—"}</td>
                      <td className="px-5 py-3">
                        <LeaveTypeBadge leaveType={teacher.leaveType} />
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {formatDateShort(teacher.fromDate)} – {formatDateShort(teacher.toDate)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={teacher.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Add Teacher", icon: Plus, color: "blue", path: "/teachers/add" },
              { label: "Mark Attendance", icon: ClipboardCheck, color: "green", path: "/teacher-attendance" },
              { label: "Process Salary", icon: Wallet, color: "purple", path: "/teacher-salary" },
              { label: "Assign Subject", icon: BookOpen, color: "amber", path: "/assign-subject" },
              { label: "Leave Requests", icon: Clock, color: "red", path: "/teacher-leave" },
              { label: "View Reports", icon: Award, color: "cyan", path: "/teacher-reports" },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:border-gray-200 dark:hover:border-slate-500 transition-all group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  action.color === "blue" ? "bg-blue-100 dark:bg-blue-900/30" :
                  action.color === "green" ? "bg-green-100 dark:bg-green-900/30" :
                  action.color === "purple" ? "bg-purple-100 dark:bg-purple-900/30" :
                  action.color === "amber" ? "bg-amber-100 dark:bg-amber-900/30" :
                  action.color === "red" ? "bg-red-100 dark:bg-red-900/30" :
                  "bg-cyan-100 dark:bg-cyan-900/30"
                }`}>
                  <action.icon className={`w-5 h-5 ${
                    action.color === "blue" ? "text-blue-600 dark:text-blue-400" :
                    action.color === "green" ? "text-green-600 dark:text-green-400" :
                    action.color === "purple" ? "text-purple-600 dark:text-purple-400" :
                    action.color === "amber" ? "text-amber-600 dark:text-amber-400" :
                    action.color === "red" ? "text-red-600 dark:text-red-400" :
                    "text-cyan-600 dark:text-cyan-400"
                  }`} />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ━━━━ Upcoming Salary Table ━━━━ */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Salary Processing</h3>
          <button
            onClick={() => navigate("/teacher-salary")}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Process All <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700">
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Department</th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Gross</th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Deductions</th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Net Salary</th>
              </tr>
            </thead>
            <tbody>
              {salaryData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                      <Wallet className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-sm font-medium">No salary data available</p>
                      <p className="text-xs mt-1">Salary records will appear here once processed</p>
                    </div>
                  </td>
                </tr>
              ) : (
                salaryData.map((teacher) => (
                  <tr key={teacher.id} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-sm font-medium text-green-600 dark:text-green-400">
                          {teacher.name?.charAt(0) || "?"}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{teacher.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{teacher.department || "—"}</td>
                    <td className="px-5 py-3 text-sm text-gray-900 dark:text-white text-right font-medium">{formatINR(teacher.gross)}</td>
                    <td className="px-5 py-3 text-sm text-red-600 dark:text-red-400 text-right">-{formatINR(teacher.deductions)}</td>
                    <td className="px-5 py-3 text-sm text-green-600 dark:text-green-400 text-right font-bold">{formatINR(teacher.net)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
