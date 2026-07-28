// ══════════════════════════════════════════════════════════════════════════════
// ENTERPRISE ADMIN STUDENT DASHBOARD
// Redesigned to match Main Dashboard style — MiniStat cards, slate theme, animations
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { getFullUrl } from "../../utils/url";
import {
  Users, UserCheck, UserX, UserPlus, UserMinus,
  GraduationCap, Bus, Building, Award, CreditCard,
  Cake, TrendingUp, RefreshCw, ChevronRight,
  BarChart3, Activity, UserCog, School,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer,
  LineChart, Line, AreaChart, Area,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Color Palette ──────────────────────────────────────────────────────────────
const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];
const GENDER_COLORS = ["#3b82f6", "#ec4899", "#8b5cf6"];

// ── Animations CSS ─────────────────────────────────────────────────────────────
const animationCSS = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in-up {
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
  opacity: 0;
}
.stagger-1 { animation-delay: 0.03s; }
.stagger-2 { animation-delay: 0.06s; }
.stagger-3 { animation-delay: 0.09s; }
.stagger-4 { animation-delay: 0.12s; }
.stagger-5 { animation-delay: 0.15s; }
.stagger-6 { animation-delay: 0.18s; }
.stagger-7 { animation-delay: 0.21s; }
.stagger-8 { animation-delay: 0.24s; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

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
  const authHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = academicYearId ? { academicYearId } : {};
      const res = await axios.get(getFullUrl("/api/students/dashboard/full"), {
        params, ...authHeaders(),
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      // Fallback: fetch individual endpoints if /full doesn't exist yet
      try {
        console.error("[StudentDashboard] /full failed, trying fallback:", err.message);
        const [statsRes, classRes, catRes, recentRes] = await Promise.all([
          axios.get(getFullUrl("/api/students/stats"), { params: { academicYearId }, ...authHeaders() }),
          axios.get(getFullUrl("/api/students/class-strength"), { params: { academicYearId }, ...authHeaders() }),
          axios.get(getFullUrl("/api/students/category-distribution"), { params: { academicYearId }, ...authHeaders() }),
          axios.get(getFullUrl("/api/students/recent-admissions"), { params: { limit: 10 }, ...authHeaders() }),
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
      const res = await axios.get(getFullUrl("/api/academic"), authHeaders());
      if (res.data?.success) setAcademicYears(res.data.data || []);
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
    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4">
      <style>{animationCSS}</style>

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">Student Dashboard</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Overview of student information and analytics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Sessions</option>
            {academicYears.map((ay) => (
              <option key={ay.id} value={ay.id}>{ay.name}</option>
            ))}
          </select>
          <button onClick={fetchDashboard} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ═══ LOADING STATE ═══ */}
      {loading && !data && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Error/Empty state */}
      {!loading && !data && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-red-500 font-medium">Dashboard data load nahi hua</p>
          <p className="text-xs text-slate-400 mt-1">Backend server restart karo (Ctrl+C then npm run dev)</p>
          <button onClick={fetchDashboard} className="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">
            Retry
          </button>
        </div>
      )}

      {data && (
        <>
          {/* ═══ ROW 1: Primary Stats (MiniStat style — matching main dashboard) ═══ */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 animate-fade-in-up stagger-2">
            <MiniStat label="Total" value={stats?.totalStudents || 0} icon={<Users size={14} />} color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-950/50" onClick={() => navigate("/students")} />
            <MiniStat label="Active" value={stats?.activeStudents || 0} icon={<UserCheck size={14} />} color="text-green-600" bg="bg-green-50 dark:bg-green-950/50" onClick={() => navigate("/students?status=active")} />
            <MiniStat label="Inactive" value={stats?.inactiveStudents || 0} icon={<UserX size={14} />} color="text-slate-600" bg="bg-slate-50 dark:bg-slate-800" onClick={() => navigate("/students?status=inactive")} />
            <MiniStat label="New (30d)" value={stats?.newAdmissions || 0} icon={<UserPlus size={14} />} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-950/50" />
            <MiniStat label="Leaving" value={stats?.leavingStudents || 0} icon={<UserMinus size={14} />} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-950/50" />
            <MiniStat label="Boys" value={stats?.boysCount || 0} icon={<Users size={14} />} color="text-sky-600" bg="bg-sky-50 dark:bg-sky-950/50" onClick={() => navigate("/students?gender=Male")} />
            <MiniStat label="Girls" value={stats?.girlsCount || 0} icon={<Users size={14} />} color="text-pink-600" bg="bg-pink-50 dark:bg-pink-950/50" onClick={() => navigate("/students?gender=Female")} />
          </div>

          {/* ═══ ROW 2: Secondary Stats ═══ */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 animate-fade-in-up stagger-3">
            <MiniStat label="Transport" value={stats?.transportStudents || 0} icon={<Bus size={14} />} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-950/50" />
            <MiniStat label="Hostel" value={stats?.hostelStudents || 0} icon={<Building size={14} />} color="text-violet-600" bg="bg-violet-50 dark:bg-violet-950/50" />
            <MiniStat label="Scholarship" value={stats?.scholarshipStudents || 0} icon={<Award size={14} />} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-950/50" />
            <MiniStat label="Fee Defaulters" value={stats?.feeDefaulters || 0} icon={<CreditCard size={14} />} color="text-red-600" bg="bg-red-50 dark:bg-red-950/50" />
            <MiniStat label="Birthday Today" value={stats?.birthdayToday || 0} icon={<Cake size={14} />} color="text-pink-600" bg="bg-pink-50 dark:bg-pink-950/50" highlight />
            <MiniStat label="Categories" value={data.categoryDistribution?.length || 0} icon={<BarChart3 size={14} />} color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-950/50" />
          </div>

          {/* ═══ ROW 3: Main Charts ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 animate-fade-in-up stagger-4">
            {/* Admission Trend */}
            <ChartCard title="Admission Trend" subtitle="Monthly admissions this year">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data.monthlyAdmission}>
                  <defs>
                    <linearGradient id="admGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,.1)", fontSize: 11 }} />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#admGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Gender Ratio */}
            <ChartCard title="Gender Ratio" subtitle="Distribution by gender">
              <ResponsiveContainer width="100%" height={240}>
                <RechartsPie>
                  <Pie
                    data={[
                      { name: "Boys", value: data.genderRatio.male },
                      { name: "Girls", value: data.genderRatio.female },
                      { name: "Other", value: data.genderRatio.other },
                    ].filter(d => d.value > 0)}
                    cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                    paddingAngle={3} dataKey="value"
                    label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {GENDER_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RechartsPie>
              </ResponsiveContainer>
            </ChartCard>

            {/* Class Strength */}
            <ChartCard title="Class Strength" subtitle="Students per class">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.classStrength}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="class" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,.1)", fontSize: 11 }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Category Distribution */}
            <ChartCard title="Category Distribution" subtitle="Students by category">
              <ResponsiveContainer width="100%" height={240}>
                <RechartsPie>
                  <Pie
                    data={data.categoryDistribution}
                    cx="50%" cy="50%" outerRadius={90}
                    dataKey="count" nameKey="category"
                    label={({ name, percent }: any) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  >
                    {data.categoryDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RechartsPie>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* ═══ ROW 4: Growth Charts ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 animate-fade-in-up stagger-5">
            {/* Student Growth */}
            <ChartCard title="Student Growth" subtitle="Year-over-year enrollment">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.studentGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,.1)", fontSize: 11 }} />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Section Strength */}
            <ChartCard title="Section Strength" subtitle="Students per section">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.sectionStrength?.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="section" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,.1)", fontSize: 11 }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* ═══ ROW 5: Tables & Widgets ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 animate-fade-in-up stagger-6">
            {/* Recent Admissions */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">Recently Added Students</h3>
                <button onClick={() => navigate("/students")} className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5">
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">
                      <th className="text-left py-1.5 font-medium">Name</th>
                      <th className="text-left py-1.5 font-medium">Adm No</th>
                      <th className="text-left py-1.5 font-medium">Class</th>
                      <th className="text-left py-1.5 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentAdmissions?.map((s) => (
                      <tr key={s.id} className="border-b dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer" onClick={() => navigate(`/students/${s.id}`)}>
                        <td className="py-1.5 font-medium text-slate-800 dark:text-white">{s.name}</td>
                        <td className="py-1.5 text-slate-500 dark:text-slate-400">{s.admNo}</td>
                        <td className="py-1.5 text-slate-500 dark:text-slate-400">{s.class}</td>
                        <td className="py-1.5 text-slate-400">{new Date(s.date).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}
                    {(!data.recentAdmissions || data.recentAdmissions.length === 0) && (
                      <tr><td colSpan={4} className="py-4 text-center text-slate-400 text-[10px]">No recent admissions</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Birthday Today */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Cake className="w-3.5 h-3.5 text-pink-500" /> Birthday Today
              </h3>
              <div className="space-y-2 max-h-52 overflow-y-auto no-scrollbar">
                {data.birthdayStudents?.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer" onClick={() => navigate(`/students/${s.id}`)}>
                    <div className="w-7 h-7 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 text-[10px] font-bold flex-shrink-0">
                      {s.photoUrl ? <img src={s.photoUrl} className="w-7 h-7 rounded-full object-cover" /> : s.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-800 dark:text-white truncate">{s.name}</p>
                      <p className="text-[9px] text-slate-500">{s.class}</p>
                    </div>
                    <span className="ml-auto text-sm">🎂</span>
                  </div>
                ))}
                {(!data.birthdayStudents || data.birthdayStudents.length === 0) && (
                  <p className="text-[10px] text-slate-400 text-center py-4">No birthdays today</p>
                )}
              </div>
            </div>
          </div>

          {/* ═══ QUICK ACTIONS ═══ */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 animate-fade-in-up stagger-7">
            <QuickAction label="Add Student" onClick={() => navigate("/students/new-admission")} color="indigo" />
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
// SUB-COMPONENTS (Matching Main Dashboard style)
// ══════════════════════════════════════════════════════════════════════════════

/** MiniStat — compact stat card matching main dashboard */
function MiniStat({ label, value, icon, color, bg, highlight, onClick }: {
  label: string; value: string | number; icon: React.ReactNode;
  color: string; bg: string; highlight?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`${bg} rounded-lg p-2 ${onClick ? "cursor-pointer" : ""} hover:scale-[1.02] transition-all border ${
        highlight ? "border-pink-300 dark:border-pink-700 ring-1 ring-pink-200/50" : "border-slate-100 dark:border-slate-700/50"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`${color} dark:opacity-90`}>{icon}</span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">{label}</span>
      </div>
      <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5 truncate">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

/** ChartCard — consistent with main dashboard chart containers */
function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
      <div className="mb-3">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">{title}</h3>
        <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

/** QuickAction — compact action button */
function QuickAction({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: "hover:bg-indigo-50 hover:border-indigo-300 dark:hover:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300",
    green: "hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-950/30 text-green-700 dark:text-green-300",
    blue: "hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/30 text-blue-700 dark:text-blue-300",
    amber: "hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-300",
    violet: "hover:bg-violet-50 hover:border-violet-300 dark:hover:bg-violet-950/30 text-violet-700 dark:text-violet-300",
    pink: "hover:bg-pink-50 hover:border-pink-300 dark:hover:bg-pink-950/30 text-pink-700 dark:text-pink-300",
  };

  return (
    <button
      onClick={onClick}
      className={`px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-medium transition-all hover:scale-[1.02] ${colorMap[color] || "text-slate-700 dark:text-slate-300"}`}
    >
      {label}
    </button>
  );
}
