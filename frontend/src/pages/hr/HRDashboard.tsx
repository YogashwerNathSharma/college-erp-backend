import { useEffect, useState } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  Users,
  UserCheck,
  Clock,
  Wallet,
  UserPlus,
  CalendarCheck,
  ClipboardList,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Plus,
  DollarSign,
  Building2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

// ───────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────

interface StaffOnLeave {
  id: string;
  name: string;
  department: string;
  leaveType: string;
  from: string;
  to: string;
  status: string;
}

interface DashboardData {
  totalStaff: number;
  presentToday: number;
  onLeave: number;
  payrollPending: number;
  newJoinings: number;
  monthlyAttendance: { month: string; present: number; absent: number; leave: number }[];
  departmentWise: { name: string; value: number; color: string }[];
  leaveStats: { month: string; casual: number; sick: number; earned: number }[];
  staffOnLeave: StaffOnLeave[];
}

// ───────────────────────────────────────────────
// STAT CARD COMPONENT
// ───────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  iconBg,
  iconColor,
}: {
  icon: any;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={22} className={iconColor} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            trendUp 
              ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
              : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          }`}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// MAIN COMPONENT
// ───────────────────────────────────────────────

export default function HRDashboard() {
  const [data, setData] = useState<DashboardData>({
    totalStaff: 0,
    presentToday: 0,
    onLeave: 0,
    payrollPending: 0,
    newJoinings: 0,
    monthlyAttendance: [],
    departmentWise: [],
    leaveStats: [],
    staffOnLeave: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(getFullUrl("/api/hr/dashboard"), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.data) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch HR dashboard data:", error);
      // Set demo data for initial render
      setData({
        totalStaff: 48,
        presentToday: 42,
        onLeave: 4,
        payrollPending: 12,
        newJoinings: 3,
        monthlyAttendance: [
          { month: "Jan", present: 92, absent: 5, leave: 3 },
          { month: "Feb", present: 88, absent: 7, leave: 5 },
          { month: "Mar", present: 94, absent: 3, leave: 3 },
          { month: "Apr", present: 90, absent: 6, leave: 4 },
          { month: "May", present: 91, absent: 4, leave: 5 },
          { month: "Jun", present: 93, absent: 4, leave: 3 },
        ],
        departmentWise: [
          { name: "Science", value: 12, color: "#6366f1" },
          { name: "Arts", value: 10, color: "#8b5cf6" },
          { name: "Commerce", value: 8, color: "#06b6d4" },
          { name: "Admin", value: 6, color: "#f59e0b" },
          { name: "Sports", value: 5, color: "#10b981" },
          { name: "IT", value: 4, color: "#ef4444" },
          { name: "Other", value: 3, color: "#64748b" },
        ],
        leaveStats: [
          { month: "Jan", casual: 5, sick: 3, earned: 2 },
          { month: "Feb", casual: 7, sick: 4, earned: 1 },
          { month: "Mar", casual: 4, sick: 2, earned: 3 },
          { month: "Apr", casual: 6, sick: 5, earned: 2 },
          { month: "May", casual: 3, sick: 3, earned: 4 },
          { month: "Jun", casual: 5, sick: 2, earned: 2 },
        ],
        staffOnLeave: [
          { id: "1", name: "Rajesh Kumar", department: "Science", leaveType: "Casual", from: "2026-06-25", to: "2026-06-27", status: "Approved" },
          { id: "2", name: "Priya Sharma", department: "Arts", leaveType: "Sick", from: "2026-06-26", to: "2026-06-28", status: "Approved" },
          { id: "3", name: "Amit Verma", department: "Admin", leaveType: "Earned", from: "2026-06-27", to: "2026-07-02", status: "Approved" },
          { id: "4", name: "Sunita Devi", department: "Commerce", leaveType: "Casual", from: "2026-06-27", to: "2026-06-27", status: "Pending" },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const DONUT_COLORS = data.departmentWise.map((d) => d.color);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HR & Staff Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Overview of staff attendance, leaves, and payroll
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus size={16} />
          Add Staff
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Users}
          label="Total Staff"
          value={data.totalStaff}
          trend="+2 this month"
          trendUp={true}
          iconBg="bg-indigo-50 dark:bg-indigo-900/30"
          iconColor="text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          icon={UserCheck}
          label="Present Today"
          value={data.presentToday}
          trend={`${Math.round((data.presentToday / data.totalStaff) * 100)}%`}
          trendUp={true}
          iconBg="bg-green-50 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
        />
        <StatCard
          icon={Clock}
          label="On Leave"
          value={data.onLeave}
          iconBg="bg-amber-50 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={Wallet}
          label="Payroll Pending"
          value={data.payrollPending}
          iconBg="bg-red-50 dark:bg-red-900/30"
          iconColor="text-red-600 dark:text-red-400"
        />
        <StatCard
          icon={UserPlus}
          label="New Joinings"
          value={data.newJoinings}
          trend="This month"
          trendUp={true}
          iconBg="bg-cyan-50 dark:bg-cyan-900/30"
          iconColor="text-cyan-600 dark:text-cyan-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Attendance Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Monthly Attendance</h3>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.monthlyAttendance}>
              <defs>
                <linearGradient id="hrAttGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  fontSize: "13px",
                }}
              />
              <Area
                type="monotone"
                dataKey="present"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#hrAttGrad)"
                name="Present %"
              />
              <Area
                type="monotone"
                dataKey="leave"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="none"
                strokeDasharray="5 5"
                name="On Leave"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Department-wise Staff Donut */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Department-wise Staff</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.departmentWise}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {data.departmentWise.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [`${value} staff`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {data.departmentWise.slice(0, 6).map((dept, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dept.color }} />
                <span className="text-gray-600 dark:text-gray-400 truncate">{dept.name}</span>
                <span className="text-gray-900 dark:text-white font-medium ml-auto">{dept.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leave Statistics + Table Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Statistics Stacked Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">Leave Statistics</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.leaveStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  fontSize: "13px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="casual" name="Casual" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
              <Bar dataKey="sick" name="Sick" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="earned" name="Earned" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Staff on Leave Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Staff on Leave Today</h3>
            <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1">
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pb-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pb-3">Dept</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pb-3">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pb-3">Duration</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {data.staffOnLeave.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {staff.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{staff.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400">{staff.department}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        staff.leaveType === "Casual" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" :
                        staff.leaveType === "Sick" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}>
                        {staff.leaveType}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(staff.from).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      {" → "}
                      {new Date(staff.to).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        staff.status === "Approved" 
                          ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {staff.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: UserPlus, label: "Add Staff", color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400", path: "/hr/staff" },
            { icon: CalendarCheck, label: "Mark Attendance", color: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400", path: "/hr/attendance" },
            { icon: Wallet, label: "Process Payroll", color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", path: "/hr/payroll" },
            { icon: CheckCircle, label: "Approve Leave", color: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400", path: "/hr/leave" },
          ].map((action, idx) => (
            <button
              key={idx}
              onClick={() => window.location.href = action.path}
              className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all duration-200 group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                <action.icon size={22} />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
