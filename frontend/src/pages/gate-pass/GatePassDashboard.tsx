import { useEffect, useState } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  Users,
  UserCheck,
  Clock,
  CalendarDays,
  Plus,
  CheckCircle,
  BarChart3,
  LogIn,
  LogOut,
  Shield,
  X,
  Search,
  Filter,
  Phone,
  Car,
  Building2,
  AlertCircle,
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
  Legend,
} from "recharts";

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

interface GatePass {
  id: string;
  visitorName: string;
  visitorPhone: string;
  purpose: string;
  visitingPerson: string;
  department?: string;
  entryTime?: string;
  exitTime?: string;
  vehicleNumber?: string;
  idProofType?: string;
  idProofNumber?: string;
  status: string;
  notes?: string;
  createdAt: string;
}

interface DashboardData {
  stats: {
    todayVisitors: number;
    currentlyInside: number;
    pendingApproval: number;
    totalThisMonth: number;
  };
  todayVisitorList: GatePass[];
  dailyTrend: { date: string; day: string; visitors: number }[];
  purposeDistribution: { name: string; value: number }[];
}

// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════

const CHART_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6", "#ec4899"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: "text-amber-700", bg: "bg-amber-100" },
  APPROVED: { label: "Approved", color: "text-blue-700", bg: "bg-blue-100" },
  IN: { label: "Inside", color: "text-green-700", bg: "bg-green-100" },
  OUT: { label: "Left", color: "text-gray-700", bg: "bg-gray-100" },
  COMPLETED: { label: "Completed", color: "text-indigo-700", bg: "bg-indigo-100" },
  REJECTED: { label: "Rejected", color: "text-red-700", bg: "bg-red-100" },
};

// ══════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════

export default function GatePassDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [form, setForm] = useState({
    visitorName: "",
    visitorPhone: "",
    purpose: "",
    visitingPerson: "",
    department: "",
    vehicleNumber: "",
    idProofType: "",
    idProofNumber: "",
    notes: "",
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(getFullUrl("/api/gate-pass/dashboard")!, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch gate pass dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePass = async () => {
    try {
      if (!form.visitorName || !form.visitorPhone || !form.purpose || !form.visitingPerson) {
        alert("Please fill all required fields");
        return;
      }
      const token = localStorage.getItem("token");
      await axios.post(getFullUrl("/api/gate-pass")!, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowAddModal(false);
      setForm({
        visitorName: "",
        visitorPhone: "",
        purpose: "",
        visitingPerson: "",
        department: "",
        vehicleNumber: "",
        idProofType: "",
        idProofNumber: "",
        notes: "",
      });
      fetchDashboard();
    } catch (error) {
      console.error("Failed to create gate pass:", error);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        getFullUrl(`/api/gate-pass/${id}/status`)!,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboard();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const filteredVisitors = data?.todayVisitorList.filter(
    (v) =>
      v.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.visitingPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-600" />
            Gate Pass Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage visitor entries and exits
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          <Plus className="w-4 h-4" />
          New Visitor Pass
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Today's Visitors"
          value={data?.stats.todayVisitors || 0}
          color="blue"
        />
        <StatCard
          icon={<LogIn className="w-6 h-6" />}
          label="Currently Inside"
          value={data?.stats.currentlyInside || 0}
          color="green"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="Pending Approval"
          value={data?.stats.pendingApproval || 0}
          color="amber"
        />
        <StatCard
          icon={<CalendarDays className="w-6 h-6" />}
          label="Total This Month"
          value={data?.stats.totalThisMonth || 0}
          color="indigo"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Visitor Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Daily Visitor Trend
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data?.dailyTrend || []}>
              <defs>
                <linearGradient id="gpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="#4f46e5"
                strokeWidth={2}
                fill="url(#gpGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Purpose Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Purpose Distribution
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data?.purposeDistribution || []}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {(data?.purposeDistribution || []).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <QuickAction
          icon={<Plus className="w-5 h-5" />}
          label="New Pass"
          color="indigo"
          onClick={() => setShowAddModal(true)}
        />
        <QuickAction
          icon={<CheckCircle className="w-5 h-5" />}
          label="Approve Pending"
          color="green"
          onClick={() => {}}
        />
        <QuickAction
          icon={<BarChart3 className="w-5 h-5" />}
          label="View Report"
          color="blue"
          onClick={() => {}}
        />
        <QuickAction
          icon={<LogOut className="w-5 h-5" />}
          label="Mark Exit"
          color="amber"
          onClick={() => {}}
        />
      </div>

      {/* Today's Visitors Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Today's Visitors
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search visitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-700/50">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Visitor</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Purpose</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Visiting</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Entry</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Exit</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {(filteredVisitors || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    No visitors today
                  </td>
                </tr>
              ) : (
                (filteredVisitors || []).map((pass) => (
                  <tr key={pass.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">{pass.visitorName}</div>
                      <div className="text-xs text-gray-500">{pass.visitorPhone}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{pass.purpose}</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{pass.visitingPerson}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {pass.entryTime
                        ? new Date(pass.entryTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {pass.exitTime
                        ? new Date(pass.exitTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_CONFIG[pass.status]?.bg || "bg-gray-100"
                        } ${STATUS_CONFIG[pass.status]?.color || "text-gray-700"}`}
                      >
                        {STATUS_CONFIG[pass.status]?.label || pass.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {pass.status === "PENDING" && (
                          <button
                            onClick={() => handleStatusUpdate(pass.id, "APPROVED")}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {pass.status === "APPROVED" && (
                          <button
                            onClick={() => handleStatusUpdate(pass.id, "IN")}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mark Entry"
                          >
                            <LogIn className="w-4 h-4" />
                          </button>
                        )}
                        {pass.status === "IN" && (
                          <button
                            onClick={() => handleStatusUpdate(pass.id, "COMPLETED")}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Mark Exit"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Visitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New Visitor Pass</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Visitor Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visitor Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.visitorName}
                    onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Enter visitor name"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.visitorPhone}
                    onChange={(e) => setForm({ ...form, visitorPhone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Purpose <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="">Select Purpose</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Interview">Interview</option>
                  <option value="Parent Visit">Parent Visit</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Visiting Person */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visiting Person <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.visitingPerson}
                    onChange={(e) => setForm({ ...form, visitingPerson: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Person to visit"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Department (optional)"
                  />
                </div>
              </div>

              {/* Vehicle Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vehicle Number
                </label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.vehicleNumber}
                    onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Vehicle number (optional)"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 dark:border-slate-700">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePass}
                className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                Create Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SUB COMPONENTS
// ══════════════════════════════════════════════════════════════

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-900",
    green: "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900",
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900",
    amber: "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-900",
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${colorMap[color]} border border-transparent`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
