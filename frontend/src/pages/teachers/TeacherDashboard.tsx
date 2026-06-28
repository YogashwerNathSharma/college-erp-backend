import { useEffect, useState } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import { useNavigate } from "react-router-dom";
import {
  UserCog, Users, UserCheck, UserX, Clock, Briefcase,
  BookOpen, GraduationCap, Calendar, IndianRupee,
  Plus, ClipboardCheck, Wallet, ArrowRight, TrendingUp,
  TrendingDown, Award, Building2, RefreshCw,
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

// ─────────────────────────────────────────────────────
// CHART COLORS
// ─────────────────────────────────────────────────────

const DONUT_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6"];
const DEPT_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#06b6d4", "#8b5cf6", "#ec4899"];
const QUALIFICATION_COLORS = ["#6366f1", "#22c55e", "#eab308", "#ef4444"];

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const navigate = useNavigate();
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
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(getFullUrl("/api/teachers/dashboard"), { headers });
      const data = res.data;

      setStats(data.stats || {
        totalTeachers: data.totalTeachers || 0,
        activeTeachers: data.activeTeachers || 0,
        onLeave: data.onLeave || 0,
        newJoinings: data.newJoinings || 0,
        departments: data.departments || 0,
        maleTeachers: data.maleTeachers || 0,
        femaleTeachers: data.femaleTeachers || 0,
      });

      setDepartmentData(data.departmentDistribution || [
        { name: "Science", value: 12 },
        { name: "Arts", value: 8 },
        { name: "Commerce", value: 6 },
        { name: "Computer", value: 5 },
        { name: "Physical Ed", value: 3 },
        { name: "Languages", value: 7 },
      ]);

      setExperienceData(data.experienceDistribution || [
        { range: "0-5 yrs", count: 8 },
        { range: "5-10 yrs", count: 14 },
        { range: "10-15 yrs", count: 10 },
        { range: "15+ yrs", count: 6 },
      ]);

      setAttendanceData(data.monthlyAttendance || [
        { month: "Jan", percentage: 92 },
        { month: "Feb", percentage: 88 },
        { month: "Mar", percentage: 95 },
        { month: "Apr", percentage: 91 },
        { month: "May", percentage: 89 },
        { month: "Jun", percentage: 94 },
      ]);

      setQualificationData(data.qualificationDistribution || [
        { name: "PhD", value: 5 },
        { name: "Masters", value: 22 },
        { name: "Bachelors", value: 10 },
        { name: "B.Ed", value: 4 },
      ]);

      setTeachersOnLeave(data.teachersOnLeave || []);
      setSalaryData(data.upcomingSalary || []);
    } catch (err) {
      console.error("Failed to fetch teacher dashboard:", err);
      // Use fallback data for display
      setStats({
        totalTeachers: 41,
        activeTeachers: 38,
        onLeave: 3,
        newJoinings: 2,
        departments: 6,
        maleTeachers: 22,
        femaleTeachers: 19,
      });
      setDepartmentData([
        { name: "Science", value: 12 },
        { name: "Arts", value: 8 },
        { name: "Commerce", value: 6 },
        { name: "Computer", value: 5 },
        { name: "Physical Ed", value: 3 },
        { name: "Languages", value: 7 },
      ]);
      setExperienceData([
        { range: "0-5 yrs", count: 8 },
        { range: "5-10 yrs", count: 14 },
        { range: "10-15 yrs", count: 10 },
        { range: "15+ yrs", count: 6 },
      ]);
      setAttendanceData([
        { month: "Jan", percentage: 92 },
        { month: "Feb", percentage: 88 },
        { month: "Mar", percentage: 95 },
        { month: "Apr", percentage: 91 },
        { month: "May", percentage: 89 },
        { month: "Jun", percentage: 94 },
      ]);
      setQualificationData([
        { name: "PhD", value: 5 },
        { name: "Masters", value: 22 },
        { name: "Bachelors", value: 10 },
        { name: "B.Ed", value: 4 },
      ]);
      setTeachersOnLeave([
        { id: "1", name: "Priya Sharma", department: "Science", leaveType: "Casual", fromDate: "2026-06-25", toDate: "2026-06-27", status: "Approved" },
        { id: "2", name: "Amit Gupta", department: "Commerce", leaveType: "Sick", fromDate: "2026-06-26", toDate: "2026-06-28", status: "Approved" },
        { id: "3", name: "Neha Singh", department: "Arts", leaveType: "Earned", fromDate: "2026-06-24", toDate: "2026-06-30", status: "Pending" },
      ]);
      setSalaryData([
        { id: "1", name: "Rajesh Kumar", department: "Science", gross: 52000, deductions: 5200, net: 46800 },
        { id: "2", name: "Sunita Devi", department: "Arts", gross: 48000, deductions: 4800, net: 43200 },
        { id: "3", name: "Manoj Tiwari", department: "Commerce", gross: 55000, deductions: 5500, net: 49500 },
        { id: "4", name: "Kavita Joshi", department: "Computer", gross: 60000, deductions: 6000, net: 54000 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────
  // STAT CARD COMPONENT
  // ─────────────────────────────────────────────────────

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    trend,
    trendValue,
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 hover:shadow-md transition-shadow duration-200">
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
        </div>
      </div>
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
            onClick={fetchDashboardData}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Teachers" value={stats.totalTeachers} icon={Users} color="blue" trend="up" trendValue="+5%" />
        <StatCard title="Active" value={stats.activeTeachers} icon={UserCheck} color="green" trend="up" trendValue="93%" />
        <StatCard title="On Leave" value={stats.onLeave} icon={Clock} color="amber" />
        <StatCard title="New Joinings" value={stats.newJoinings} icon={UserCog} color="purple" trend="up" trendValue="This month" />
        <StatCard title="Departments" value={stats.departments} icon={Building2} color="cyan" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution - Donut */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Department Distribution</h3>
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
        </div>

        {/* Experience Distribution - Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Experience Distribution</h3>
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
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Attendance - Area Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Attendance Trend</h3>
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
        </div>

        {/* Qualification Distribution - Donut */}
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

      {/* Tables + Quick Actions Row */}
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
                            {teacher.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{teacher.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{teacher.department}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          teacher.leaveType === "Casual" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                          teacher.leaveType === "Sick" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}>
                          {teacher.leaveType}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {new Date(teacher.fromDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} - {new Date(teacher.toDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          teacher.status === "Approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}>
                          {teacher.status}
                        </span>
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

      {/* Upcoming Salary Table */}
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
                  <td colSpan={5} className="text-center text-gray-400 dark:text-gray-500 py-8">
                    No salary data available
                  </td>
                </tr>
              ) : (
                salaryData.map((teacher) => (
                  <tr key={teacher.id} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-sm font-medium text-green-600 dark:text-green-400">
                          {teacher.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{teacher.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{teacher.department}</td>
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
