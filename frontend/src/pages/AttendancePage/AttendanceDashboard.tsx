import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import {
  Users, UserCheck, UserX, Clock, TrendingUp, ClipboardCheck,
  BarChart3, Bell, ArrowRight, RefreshCw, ChevronRight, AlertCircle, Phone, Download,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const API = `${API_BASE_URL}/api`;

interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeave: number;
  attendancePercentage: string;
  weeklyTrend: { date: string; day: string; present: number; absent: number; percentage: number }[];
  classWise: { className: string; present: number; absent: number; total: number; percentage: number }[];
  absentStudents: { id: string; name: string; className: string; section: string; contact: string; daysAbsent: number }[];
  heatmapData: { className: string; days: { day: string; percentage: number }[] }[];
}
interface AcademicYear { id: string; name: string; isCurrent: boolean; }

const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

function heatmapClass(percentage: number) {
  if (percentage >= 90) return "bg-green-500";
  if (percentage >= 80) return "bg-green-300";
  if (percentage >= 70) return "bg-yellow-400";
  if (percentage >= 60) return "bg-orange-400";
  return "bg-red-400";
}

function MiniStat({ label, value, icon, color, bg }: { label: string; value: string | number; icon: React.ReactNode; color: string; bg: string }) {
  return <div className={`${bg} rounded-lg p-2 sm:p-2.5 border border-slate-100 dark:border-slate-700/50`}>
    <div className="flex items-center gap-1.5"><span className={color}>{icon}</span><span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{label}</span></div>
    <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-white mt-0.5">{value}</p>
  </div>;
}

const emptyStats: DashboardStats = {
  totalStudents: 0, presentToday: 0, absentToday: 0, lateToday: 0, onLeave: 0,
  attendancePercentage: "0", weeklyTrend: [], classWise: [], absentStudents: [], heatmapData: [],
};

export default function AttendanceDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [stats, setStats] = useState<DashboardStats>(emptyStats);

  useEffect(() => { void loadAcademicYears(); }, []);
  useEffect(() => {
    if (selectedAcademicYear) void fetchDashboard(false);
  }, [selectedAcademicYear]);

  async function loadAcademicYears() {
    try {
      const res = await axios.get(`${API}/academic`, { headers: getHeaders(), timeout: 15000 });
      const years: AcademicYear[] = Array.isArray(res.data?.data) ? res.data.data : [];
      setAcademicYears(years);
      const current = years.find(y => y.isCurrent) || years[0];
      if (current) setSelectedAcademicYear(current.id);
      else { setError("No academic year is available for this tenant."); setLoading(false); }
    } catch (err) {
      console.error("Attendance academic year error:", err);
      setError("Unable to load academic year. Please try again.");
      setLoading(false);
    }
  }

  async function fetchDashboard(forceRefresh: boolean) {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API}/attendance/dashboard`, {
        params: { academicYearId: selectedAcademicYear, ...(forceRefresh ? { refresh: "true" } : {}) },
        headers: getHeaders(),
        timeout: 20000,
      });
      const data = res.data || {};
      setStats({
        totalStudents: Number(data.totalStudents) || 0,
        presentToday: Number(data.presentToday) || 0,
        absentToday: Number(data.absentToday) || 0,
        lateToday: Number(data.lateToday) || 0,
        onLeave: Number(data.onLeave) || 0,
        attendancePercentage: String(data.attendancePercentage ?? "0"),
        weeklyTrend: Array.isArray(data.weeklyTrend) ? data.weeklyTrend : (Array.isArray(data.monthlyTrend) ? data.monthlyTrend : []),
        classWise: Array.isArray(data.classWise) ? data.classWise : [],
        absentStudents: Array.isArray(data.absentStudents) ? data.absentStudents : [],
        heatmapData: Array.isArray(data.heatmapData) ? data.heatmapData : [],
      });
    } catch (err) {
      console.error("Attendance dashboard error:", err);
      setStats(emptyStats);
      setError("Attendance data could not be loaded. No sample/demo data is shown.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[70vh]"><div className="flex flex-col items-center gap-4"><div className="relative"><div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700" /><div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" /></div><p className="text-slate-700 dark:text-slate-300 font-medium text-sm">Loading Dashboard...</p></div></div>;

  const percentage = Number.parseFloat(stats.attendancePercentage) || 0;
  const hasTrend = stats.weeklyTrend.length > 0;
  const hasClasses = stats.classWise.length > 0;
  const hasHeatmap = stats.heatmapData.length > 0;
  const hasAbsent = stats.absentStudents.length > 0;

  return <>
    <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-3 max-w-[1600px] mx-auto overflow-x-hidden pb-24 sm:pb-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5"><span>Dashboard</span><ChevronRight size={10} /><span className="text-slate-600 dark:text-slate-300">Attendance</span></div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">📋 Attendance Dashboard</h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedAcademicYear} onChange={e => setSelectedAcademicYear(e.target.value)} className="px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}{y.isCurrent ? " (Current)" : ""}</option>)}
          </select>
          <button onClick={() => void fetchDashboard(true)} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600" title="Refresh"><RefreshCw size={14} className="text-slate-500" /></button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">{error}</div>}

      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {[
          { label: "Mark Attendance", icon: ClipboardCheck, route: "/attendance" },
          { label: "Reports", icon: BarChart3, route: "/attendance-report" },
          { label: "Notify Parents", icon: Bell, route: "/communication/sms" },
          { label: "Download", icon: Download, route: "/attendance-report" },
        ].map(a => <button key={a.label} onClick={() => navigate(a.route)} className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40"><a.icon size={18} className="text-indigo-600" /><span className="text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate w-full text-center">{a.label}</span></button>)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <MiniStat label="Total Students" value={stats.totalStudents} icon={<Users size={14} />} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-950/50" />
        <MiniStat label="Present" value={stats.presentToday} icon={<UserCheck size={14} />} color="text-green-600" bg="bg-green-50 dark:bg-green-950/50" />
        <MiniStat label="Absent" value={stats.absentToday} icon={<UserX size={14} />} color="text-red-600" bg="bg-red-50 dark:bg-red-950/50" />
        <MiniStat label="Late" value={stats.lateToday} icon={<Clock size={14} />} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-950/50" />
        <MiniStat label="Attendance %" value={`${percentage.toFixed(1)}%`} icon={<TrendingUp size={14} />} color="text-purple-600" bg="bg-purple-50 dark:bg-purple-950/50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 sm:p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-slate-700 dark:text-white">Weekly Trend</span><span className="text-[10px] text-slate-500">Last 7 days</span></div>
          {hasTrend ? <ResponsiveContainer width="100%" height={180}><AreaChart data={stats.weeklyTrend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" /><YAxis domain={[0, 100]} /><Tooltip formatter={(v: number) => [`${v}%`, "Attendance"]} /><Area type="monotone" dataKey="percentage" stroke="#10b981" fill="#10b981" fillOpacity={0.15} /></AreaChart></ResponsiveContainer> : <div className="h-[180px] flex items-center justify-center text-xs text-slate-400">No attendance records for this tenant/year.</div>}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 sm:p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-slate-700 dark:text-white">Class-wise</span><button onClick={() => navigate("/attendance-report")} className="text-[10px] text-indigo-600">View All</button></div>
          {hasClasses ? <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">{stats.classWise.map((cls, i) => <div key={`${cls.className}-${i}`} className="flex items-center gap-2"><span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 w-16 shrink-0 truncate">{cls.className}</span><div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.max(0, Math.min(100, cls.percentage))}%` }} /></div><span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 w-9 text-right">{cls.percentage}%</span></div>)}</div> : <div className="h-[180px] flex items-center justify-center text-xs text-slate-400">No class attendance data.</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 sm:p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold text-slate-700 dark:text-white">📊 Heatmap</span><span className="text-[9px] text-slate-400">This Week</span></div>
          {hasHeatmap ? <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="text-[9px] text-slate-400 text-left w-14" />{["M","T","W","T","F","S"].map((d,i)=><th key={i} className="text-[9px] text-slate-400 text-center w-6">{d}</th>)}</tr></thead><tbody>{stats.heatmapData.slice(0,8).map((row,ri)=><tr key={`${row.className}-${ri}`}><td className="text-[9px] text-slate-600 dark:text-slate-300 font-medium py-0.5 pr-1 truncate max-w-[56px]">{row.className}</td>{row.days.map((cell,ci)=><td key={ci} className="py-0.5 px-0.5"><div className={`w-5 h-5 rounded mx-auto ${heatmapClass(cell.percentage)}`} title={`${cell.percentage}%`} /></td>)}</tr>)}</tbody></table></div> : <div className="h-[100px] flex items-center justify-center text-xs text-slate-400">No weekly attendance data.</div>}
          <div className="text-[9px] text-slate-400 mt-2">Only real attendance records are displayed.</div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 sm:p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-700 dark:text-white">⚠️ Absent Today</span><span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950 text-red-600 font-semibold">{stats.absentToday}</span></div><button onClick={() => navigate("/attendance-report")} className="text-[10px] text-indigo-600 flex items-center gap-0.5">Full Report <ArrowRight size={10} /></button></div>
          {hasAbsent ? <div className="overflow-x-auto"><table className="w-full text-[11px]"><thead><tr className="border-b border-slate-100 dark:border-slate-700"><th className="text-left py-1.5 px-2 text-[10px] text-slate-400 uppercase">Student</th><th className="text-left py-1.5 px-2 text-[10px] text-slate-400 uppercase">Class</th><th className="text-center py-1.5 px-2 text-[10px] text-slate-400 uppercase">Days</th><th className="text-center py-1.5 px-2 text-[10px] text-slate-400 uppercase">Action</th></tr></thead><tbody>{stats.absentStudents.slice(0,5).map(student=><tr key={student.id} className="border-b border-slate-50 dark:border-slate-700/50"><td className="py-1.5 px-2"><div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[9px]">{student.name.charAt(0)}</div><span className="font-medium text-slate-800 dark:text-slate-200">{student.name}</span></div></td><td className="py-1.5 px-2 text-slate-600 dark:text-slate-300">{student.className} {student.section}</td><td className="py-1.5 px-2 text-center"><span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-950 text-yellow-600 text-[10px] font-semibold">{student.daysAbsent}d</span></td><td className="py-1.5 px-2 text-center"><button className="p-1 rounded-md text-indigo-600" title="Notify"><Bell size={12} /></button></td></tr>)}</tbody></table></div> : <div className="py-10 text-center text-xs text-slate-400">No students are marked absent today.</div>}
        </div>
      </div>
    </div>
  </>;
}
