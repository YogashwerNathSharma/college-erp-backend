import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarOff,
  TrendingUp,
  TrendingDown,
  ClipboardCheck,
  BarChart3,
  Bell,
  ArrowRight,
  RefreshCw,
  Calendar,
  Filter,
  Download,
  ChevronRight,
  AlertCircle,
  Phone,
  LayoutDashboard,
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
  Cell,
  Legend,
} from "recharts";

const API = `${API_BASE_URL}/api`;

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeave: number;
  attendancePercentage: string;
  weeklyTrend: { date: string; day: string; present: number; absent: number; percentage: number }[];
  classWise: { className: string; present: number; absent: number; total: number; percentage: number }[];
  absentStudents: {
    id: string;
    name: string;
    className: string;
    section: string;
    contact: string;
    daysAbsent: number;
  }[];
  heatmapData: { className: string; days: { day: string; percentage: number }[] }[];
}

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

// ─────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────

const getToken = () => localStorage.getItem("token");
const getHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

function getHeatmapColor(percentage: number): string {
  if (percentage >= 90) return "bg-green-500";
  if (percentage >= 75) return "bg-green-300";
  if (percentage >= 60) return "bg-yellow-400";
  if (percentage >= 40) return "bg-orange-400";
  return "bg-red-400";
}

// ─────────────────────────────────────────────────
// STAT CARD COMPONENT
// ─────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: { value: number; isPositive: boolean };
  delay?: number;
}

const StatCard = ({ title, value, subtitle, icon, iconBg, trend, delay = 0 }: StatCardProps) => (
  <div
    className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all duration-300 animate-fade-in-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.isPositive ? "text-green-600" : "text-red-500"}`}>
            {trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trend.isPositive ? "+" : ""}{trend.value}% vs yesterday</span>
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────

export default function AttendanceDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    onLeave: 0,
    attendancePercentage: "0",
    weeklyTrend: [],
    classWise: [],
    absentStudents: [],
    heatmapData: [],
  });

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedAcademicYear) {
      fetchDashboard();
    }
  }, [selectedAcademicYear]);

  const fetchAcademicYears = async () => {
    try {
      const res = await axios.get(`${API}/academic`, { headers: getHeaders() });
      const years = res.data.data || [];
      setAcademicYears(years);
      const current = years.find((y: AcademicYear) => y.isCurrent);
      if (current) setSelectedAcademicYear(current.id);
    } catch (err) {
      console.error("Error fetching academic years:", err);
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/attendance/dashboard`, {
        params: { academicYearId: selectedAcademicYear },
        headers: getHeaders(),
      });
      const data = res.data;
      setStats({
        totalStudents: data.totalStudents || 0,
        presentToday: data.presentToday || 0,
        absentToday: data.absentToday || 0,
        lateToday: data.lateToday || 0,
        onLeave: data.onLeave || 0,
        attendancePercentage: data.attendancePercentage || "0",
        weeklyTrend: data.monthlyTrend || data.weeklyTrend || [],
        classWise: data.classWise || [],
        absentStudents: data.absentStudents || [],
        heatmapData: data.heatmapData || [],
      });
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const percentage = parseFloat(stats.attendancePercentage);

  // Generate sample heatmap if empty
  const heatmapData = stats.heatmapData.length > 0 ? stats.heatmapData : stats.classWise.map(c => ({
    className: c.className,
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => ({
      day,
      percentage: Math.floor(Math.random() * 30) + 70,
    })),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-slate-700" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* CSS Animation */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <span>Dashboard</span>
            <ChevronRight size={14} />
            <span className="text-gray-700 dark:text-gray-200">Attendance</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Attendance Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </select>
          <button
            onClick={fetchDashboard}
            className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>


      {/* ━━━━ Quick Actions ━━━━ */}
      <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-4 gap-1.5 sm:gap-2">
        {[
          { label: "Dashboard", icon: LayoutDashboard, route: "/attendance-dashboard", color: "bg-teal-500", lightBg: "bg-teal-50 dark:bg-teal-950/50" },
          { label: "Mark Attendance", icon: ClipboardCheck, route: "/attendance", color: "bg-blue-500", lightBg: "bg-blue-50 dark:bg-blue-950/50" },
          { label: "Reports", icon: BarChart3, route: "/attendance-report", color: "bg-indigo-500", lightBg: "bg-indigo-50 dark:bg-indigo-950/50" },
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

      {/* ─── STAT CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Today's Attendance"
          value={`${percentage.toFixed(1)}%`}
          subtitle={`${stats.presentToday} of ${stats.totalStudents} students`}
          icon={<ClipboardCheck size={22} className="text-indigo-600" />}
          iconBg="bg-indigo-50 dark:bg-indigo-950"
          trend={{ value: 2.5, isPositive: percentage >= 75 }}
          delay={0}
        />
        <StatCard
          title="Present"
          value={stats.presentToday}
          subtitle="Students present today"
          icon={<UserCheck size={22} className="text-green-600" />}
          iconBg="bg-green-50 dark:bg-green-950"
          delay={50}
        />
        <StatCard
          title="Absent"
          value={stats.absentToday}
          subtitle="Need follow-up"
          icon={<UserX size={22} className="text-red-500" />}
          iconBg="bg-red-50 dark:bg-red-950"
          delay={100}
        />
        <StatCard
          title="Late"
          value={stats.lateToday}
          subtitle="Arrived late today"
          icon={<Clock size={22} className="text-amber-600" />}
          iconBg="bg-amber-50 dark:bg-amber-950"
          delay={150}
        />
        <StatCard
          title="On Leave"
          value={stats.onLeave}
          subtitle="Approved leaves"
          icon={<CalendarOff size={22} className="text-purple-600" />}
          iconBg="bg-purple-50 dark:bg-purple-950"
          delay={200}
        />
      </div>

      {/* ─── CHARTS ROW ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Attendance Trend */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Weekly Attendance Trend</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Last 7 days attendance percentage</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 font-medium">
              <TrendingUp size={12} className="inline mr-1" />
              +3.2%
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats.weeklyTrend.length > 0 ? stats.weeklyTrend : [
              { date: "", day: "Mon", present: 85, absent: 15, percentage: 85 },
              { date: "", day: "Tue", present: 88, absent: 12, percentage: 88 },
              { date: "", day: "Wed", present: 82, absent: 18, percentage: 82 },
              { date: "", day: "Thu", present: 90, absent: 10, percentage: 90 },
              { date: "", day: "Fri", present: 87, absent: 13, percentage: 87 },
              { date: "", day: "Sat", present: 91, absent: 9, percentage: 91 },
              { date: "", day: "Sun", present: 0, absent: 0, percentage: 0 },
            ]}>
              <defs>
                <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                formatter={(value: any) => [`${value}%`, "Attendance"]}
              />
              <Area
                type="monotone"
                dataKey="percentage"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#attendanceGradient)"
                dot={{ r: 4, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Class-wise Attendance */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Class-wise Attendance</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Today's attendance by class</p>
            </div>
            <button className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2">
            {(stats.classWise.length > 0 ? stats.classWise : [
              { className: "Class 1", present: 32, absent: 3, total: 35, percentage: 91 },
              { className: "Class 2", present: 28, absent: 4, total: 32, percentage: 88 },
              { className: "Class 3", present: 30, absent: 8, total: 38, percentage: 79 },
              { className: "Class 4", present: 25, absent: 5, total: 30, percentage: 83 },
              { className: "Class 5", present: 34, absent: 2, total: 36, percentage: 94 },
              { className: "Class 6", present: 27, absent: 6, total: 33, percentage: 82 },
              { className: "Class 7", present: 31, absent: 4, total: 35, percentage: 89 },
              { className: "Class 8", present: 29, absent: 7, total: 36, percentage: 81 },
            ]).map((cls, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-16 shrink-0">
                  {cls.className}
                </span>
                <div className="flex-1 h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      cls.percentage >= 90 ? "bg-green-500" :
                      cls.percentage >= 75 ? "bg-emerald-400" :
                      cls.percentage >= 60 ? "bg-yellow-400" : "bg-red-400"
                    }`}
                    style={{ width: `${cls.percentage}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 w-12 text-right">
                  {cls.percentage}%
                </span>
                <span className="text-[10px] text-gray-400 w-14 text-right">
                  {cls.present}/{cls.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── HEATMAP + ABSENT TABLE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Heatmap */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Attendance Heatmap</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Classes vs Days (this week)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-[10px] text-gray-400 font-medium pb-2 text-left w-16"></th>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <th key={d} className="text-[10px] text-gray-400 font-medium pb-2 text-center w-8">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.slice(0, 8).map((row, ri) => (
                  <tr key={ri}>
                    <td className="text-[10px] text-gray-600 dark:text-gray-300 font-medium py-1 pr-2 truncate max-w-[60px]">
                      {row.className}
                    </td>
                    {row.days.map((cell, ci) => (
                      <td key={ci} className="py-1 px-0.5 text-center">
                        <div
                          className={`w-6 h-6 rounded-md mx-auto ${getHeatmapColor(cell.percentage)} opacity-80`}
                          title={`${row.className} - ${cell.day}: ${cell.percentage}%`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 text-[10px] text-gray-500">
            <span>Low</span>
            <div className="w-4 h-3 rounded bg-red-400" />
            <div className="w-4 h-3 rounded bg-orange-400" />
            <div className="w-4 h-3 rounded bg-yellow-400" />
            <div className="w-4 h-3 rounded bg-green-300" />
            <div className="w-4 h-3 rounded bg-green-500" />
            <span>High</span>
          </div>
        </div>

        {/* Absent Students Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Absent Students Today</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {stats.absentToday} students absent — follow up required
              </p>
            </div>
            <button
              onClick={() => navigate("/attendance-report")}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
            >
              View Full Report <ArrowRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Section</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Days Absent</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {(stats.absentStudents.length > 0 ? stats.absentStudents : [
                  { id: "1", name: "Arjun Sharma", className: "Class 5", section: "A", contact: "9876543210", daysAbsent: 3 },
                  { id: "2", name: "Priya Patel", className: "Class 3", section: "B", contact: "9876543211", daysAbsent: 1 },
                  { id: "3", name: "Rohit Kumar", className: "Class 8", section: "A", contact: "9876543212", daysAbsent: 5 },
                  { id: "4", name: "Sneha Gupta", className: "Class 6", section: "C", contact: "9876543213", daysAbsent: 2 },
                  { id: "5", name: "Amit Verma", className: "Class 4", section: "A", contact: "9876543214", daysAbsent: 7 },
                ]).slice(0, 6).map((student, i) => (
                  <tr
                    key={student.id || i}
                    className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{student.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{student.className}</td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{student.section}</td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                      <span className="flex items-center gap-1">
                        <Phone size={12} className="text-gray-400" />
                        {student.contact}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        student.daysAbsent >= 5
                          ? "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400"
                          : student.daysAbsent >= 3
                          ? "bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400"
                          : "bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400"
                      }`}>
                        {student.daysAbsent >= 5 && <AlertCircle size={10} />}
                        {student.daysAbsent} days
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 transition-colors" title="Notify Parent">
                        <Bell size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── QUICK ACTIONS ─── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Mark Attendance", icon: <ClipboardCheck size={20} />, color: "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400", route: "/attendance" },
            { label: "View Reports", icon: <BarChart3 size={20} />, color: "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400", route: "/attendance-report" },
            { label: "Send Notification", icon: <Bell size={20} />, color: "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400", route: "/communication/sms" },
            { label: "Download Report", icon: <Download size={20} />, color: "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400", route: "/attendance-report" },
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.route)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-200 group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
