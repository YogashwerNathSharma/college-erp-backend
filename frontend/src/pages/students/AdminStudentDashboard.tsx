// ══════════════════════════════════════════════════════════════════════════════
// ENTERPRISE ADMIN STUDENT DASHBOARD
// Complete rewrite with full chart suite and stat widgets
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Users, UserCheck, UserX, UserPlus, UserMinus,
  GraduationCap, Bus, Building, Award, CreditCard,
  Cake, TrendingUp, RefreshCw, Download, Filter,
  ChevronRight, BarChart3, PieChart, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer,
  LineChart, Line, AreaChart, Area,
} from "recharts";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Types ────────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  newAdmissions: number;
  leavingStudents: number;
  boysCount: number;
  girlsCount: number;
  transportStudents: number;
  hostelStudents: number;
  scholarshipStudents: number;
  feeDefaulters: number;
  birthdayToday: number;
}

interface DashboardData {
  stats: DashboardStats;
  classStrength: Array<{ class: string; count: number }>;
  sectionStrength: Array<{ class: string; section: string; count: number }>;
  categoryDistribution: Array<{ category: string; count: number; percentage: number }>;
  genderRatio: { male: number; female: number; other: number };
  monthlyAdmission: Array<{ month: string; count: number }>;
  studentGrowth: Array<{ year: string; count: number }>;
  recentAdmissions: Array<{ id: string; name: string; admNo: string; class: string; date: string }>;
  birthdayStudents: Array<{ id: string; name: string; class: string; photoUrl?: string; dob: string }>;
  feeDefaultersList: Array<{ id: string; name: string; class: string; pendingAmount: number }>;
}

// ── Color Palette ────────────────────────────────────────────────────────────
const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];
const CHART_GRADIENT_FROM = "#4f46e5";
const CHART_GRADIENT_TO = "#818cf8";

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminStudentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [academicYearId, setAcademicYearId] = useState<string>("");
  const [academicYears, setAcademicYears] = useState<Array<{ id: string; name: string }>>([]);

  const token = localStorage.getItem("token");
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = academicYearId ? { academicYearId } : {};
      const res = await api.get("/students/dashboard/full", { params });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      // Fallback: fetch individual endpoints if /full doesn't exist yet
      try {
        const [statsRes, classRes, catRes, recentRes] = await Promise.all([
          api.get("/students/stats", { params: { academicYearId } }),
          api.get("/students/class-strength", { params: { academicYearId } }),
          api.get("/students/category-distribution", { params: { academicYearId } }),
          api.get("/students/recent-admissions", { params: { limit: 10 } }),
        ]);

        setData({
          stats: statsRes.data.data || {} as DashboardStats,
          classStrength: classRes.data.data || [],
          sectionStrength: [],
          categoryDistribution: catRes.data.data || [],
          genderRatio: { male: 0, female: 0, other: 0 },
          monthlyAdmission: [],
          studentGrowth: [],
          recentAdmissions: recentRes.data.data || [],
          birthdayStudents: [],
          feeDefaultersList: [],
        });
      } catch {
        toast.error("Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
    }
  }, [academicYearId]);

  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/academic");
      if (res.data.success) setAcademicYears(res.data.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchAcademicYears(); }, []);
  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchDashboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const stats = data?.stats;

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Overview of student information and analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="">All Academic Years</option>
            {academicYears.map((ay) => (
              <option key={ay.id} value={ay.id}>{ay.name}</option>
            ))}
          </select>
          <button onClick={fetchDashboard} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && !data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {data && (
        <>
          {/* ═══ ROW 1: Primary Stats ═══ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            <StatCard icon={Users} label="Total" value={stats?.totalStudents || 0} color="indigo" onClick={() => navigate("/students")} />
            <StatCard icon={UserCheck} label="Active" value={stats?.activeStudents || 0} color="green" onClick={() => navigate("/students?status=active")} />
            <StatCard icon={UserX} label="Inactive" value={stats?.inactiveStudents || 0} color="gray" onClick={() => navigate("/students?status=inactive")} />
            <StatCard icon={UserPlus} label="New (30d)" value={stats?.newAdmissions || 0} color="blue" />
            <StatCard icon={UserMinus} label="Leaving" value={stats?.leavingStudents || 0} color="amber" />
            <StatCard icon={Users} label="Boys" value={stats?.boysCount || 0} color="sky" onClick={() => navigate("/students?gender=Male")} />
            <StatCard icon={Users} label="Girls" value={stats?.girlsCount || 0} color="pink" onClick={() => navigate("/students?gender=Female")} />
          </div>

          {/* ═══ ROW 2: Secondary Stats ═══ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard icon={Bus} label="Transport" value={stats?.transportStudents || 0} color="emerald" />
            <StatCard icon={Building} label="Hostel" value={stats?.hostelStudents || 0} color="violet" />
            <StatCard icon={Award} label="Scholarship" value={stats?.scholarshipStudents || 0} color="amber" />
            <StatCard icon={CreditCard} label="Fee Defaulters" value={stats?.feeDefaulters || 0} color="red" />
            <StatCard icon={Cake} label="Birthday Today" value={stats?.birthdayToday || 0} color="pink" highlight />
            <StatCard icon={TrendingUp} label="Categories" value={data.categoryDistribution?.length || 0} color="indigo" />
          </div>

          {/* ═══ ROW 3: Main Charts ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Admission Trend */}
            <ChartCard title="Admission Trend" subtitle="Monthly admissions this year">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.monthlyAdmission}>
                  <defs>
                    <linearGradient id="admGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_GRADIENT_FROM} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_GRADIENT_TO} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,.1)" }} />
                  <Area type="monotone" dataKey="count" stroke="#4f46e5" fill="url(#admGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Gender Ratio */}
            <ChartCard title="Gender Ratio" subtitle="Distribution by gender">
              <ResponsiveContainer width="100%" height={280}>
                <RechartsPie>
                  <Pie
                    data={[
                      { name: "Boys", value: data.genderRatio.male },
                      { name: "Girls", value: data.genderRatio.female },
                      { name: "Other", value: data.genderRatio.other },
                    ].filter(d => d.value > 0)}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    paddingAngle={3} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#4f46e5" /><Cell fill="#ec4899" /><Cell fill="#8b5cf6" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            </ChartCard>

            {/* Class Strength */}
            <ChartCard title="Class Strength" subtitle="Students per class">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.classStrength}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="class" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Category Distribution */}
            <ChartCard title="Category Distribution" subtitle="Students by category">
              <ResponsiveContainer width="100%" height={280}>
                <RechartsPie>
                  <Pie
                    data={data.categoryDistribution}
                    cx="50%" cy="50%" outerRadius={100}
                    dataKey="count" nameKey="category"
                    label={({ category, percentage }) => `${category} (${percentage}%)`}
                  >
                    {data.categoryDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* ═══ ROW 4: Growth Charts ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Growth */}
            <ChartCard title="Student Growth" subtitle="Year-over-year enrollment">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.studentGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Section Strength */}
            <ChartCard title="Section Strength" subtitle="Students per section">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.sectionStrength?.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="section" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* ═══ ROW 5: Tables & Widgets ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Admissions */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recently Added Students</h3>
                <button onClick={() => navigate("/students")} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                      <th className="text-left py-2 font-medium">Name</th>
                      <th className="text-left py-2 font-medium">Adm No</th>
                      <th className="text-left py-2 font-medium">Class</th>
                      <th className="text-left py-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentAdmissions?.map((s) => (
                      <tr key={s.id} className="border-b dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer" onClick={() => navigate(`/students/${s.id}`)}>
                        <td className="py-2 font-medium text-gray-900 dark:text-white">{s.name}</td>
                        <td className="py-2 text-gray-600 dark:text-gray-400">{s.admNo}</td>
                        <td className="py-2 text-gray-600 dark:text-gray-400">{s.class}</td>
                        <td className="py-2 text-gray-500">{new Date(s.date).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}
                    {(!data.recentAdmissions || data.recentAdmissions.length === 0) && (
                      <tr><td colSpan={4} className="py-4 text-center text-gray-400">No recent admissions</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Birthday Today */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <Cake className="w-4 h-4 text-pink-500" /> Birthday Today
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {data.birthdayStudents?.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer" onClick={() => navigate(`/students/${s.id}`)}>
                    <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 text-xs font-bold">
                      {s.photoUrl ? <img src={s.photoUrl} className="w-8 h-8 rounded-full object-cover" /> : s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{s.name}</p>
                      <p className="text-[10px] text-gray-500">{s.class}</p>
                    </div>
                    <span className="ml-auto text-lg">🎂</span>
                  </div>
                ))}
                {(!data.birthdayStudents || data.birthdayStudents.length === 0) && (
                  <p className="text-xs text-gray-400 text-center py-4">No birthdays today</p>
                )}
              </div>
            </div>
          </div>

          {/* ═══ QUICK ACTIONS ═══ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <QuickAction label="Add Student" onClick={() => navigate("/students/admission")} color="indigo" />
            <QuickAction label="Bulk Import" onClick={() => navigate("/students/bulk-admission")} color="green" />
            <QuickAction label="Print List" onClick={() => navigate("/students/print")} color="blue" />
            <QuickAction label="Export Excel" onClick={() => navigate("/students/bulk-export")} color="amber" />
            <QuickAction label="ID Cards" onClick={() => navigate("/students/id-card")} color="violet" />
            <QuickAction label="Reports" onClick={() => navigate("/students/reports")} color="pink" />
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function StatCard({ icon: Icon, label, value, color, highlight, onClick }: {
  icon: any; label: string; value: number; color: string; highlight?: boolean; onClick?: () => void;
}) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    gray: "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
    pink: "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    red: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  };

  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-xl border transition-all duration-200 ${
        highlight ? "border-pink-300 dark:border-pink-700 ring-1 ring-pink-200" : "border-gray-200 dark:border-gray-700"
      } bg-white dark:bg-gray-800 hover:shadow-md ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colorMap[color] || colorMap.indigo}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function QuickAction({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: "hover:bg-indigo-50 hover:border-indigo-300 dark:hover:bg-indigo-900/20",
    green: "hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-900/20",
    blue: "hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20",
    amber: "hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-900/20",
    violet: "hover:bg-violet-50 hover:border-violet-300 dark:hover:bg-violet-900/20",
    pink: "hover:bg-pink-50 hover:border-pink-300 dark:hover:bg-pink-900/20",
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 transition-all ${colorMap[color] || ""}`}
    >
      {label}
    </button>
  );
}
