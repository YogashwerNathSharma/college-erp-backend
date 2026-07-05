import { useEffect, useState } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  Headphones,
  AlertCircle,
  Clock,
  CheckCircle2,
  Timer,
  Plus,
  UserPlus,
  Eye,
  BarChart3,
  X,
  Search,
  Filter,
  MessageSquare,
  ArrowUpRight,
  Loader2,
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
  BarChart,
  Bar,
} from "recharts";

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  raisedBy: string;
  raisedByRole?: string;
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  comments?: any[];
}

interface DashboardData {
  stats: {
    openTickets: number;
    inProgress: number;
    resolvedToday: number;
    totalTickets: number;
    avgResolutionHours: number;
  };
  recentTickets: Ticket[];
  ticketTrend: { date: string; day: string; opened: number; resolved: number }[];
  priorityDistribution: { name: string; value: number }[];
  categoryBreakdown: { name: string; count: number }[];
  statusDistribution: { name: string; value: number }[];
}

// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════

const CHART_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6"];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  LOW: { label: "Low", color: "text-green-700", bg: "bg-green-100" },
  MEDIUM: { label: "Medium", color: "text-amber-700", bg: "bg-amber-100" },
  HIGH: { label: "High", color: "text-orange-700", bg: "bg-orange-100" },
  CRITICAL: { label: "Critical", color: "text-red-700", bg: "bg-red-100" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: "Open", color: "text-blue-700", bg: "bg-blue-100" },
  IN_PROGRESS: { label: "In Progress", color: "text-amber-700", bg: "bg-amber-100" },
  RESOLVED: { label: "Resolved", color: "text-green-700", bg: "bg-green-100" },
  CLOSED: { label: "Closed", color: "text-gray-700", bg: "bg-gray-100" },
};

// ══════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════

export default function HelpDeskDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: "MEDIUM",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(getFullUrl("/api/helpdesk/dashboard")!, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch helpdesk dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    try {
      if (!form.title || !form.description || !form.category) {
        alert("Please fill title, description, and category");
        return;
      }
      setSubmitting(true);
      const token = localStorage.getItem("token");
      await axios.post(getFullUrl("/api/helpdesk/tickets")!, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowAddModal(false);
      setForm({ title: "", description: "", category: "", priority: "MEDIUM" });
      fetchDashboard();
    } catch (error) {
      console.error("Failed to create ticket:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        getFullUrl(`/api/helpdesk/tickets/${id}`)!,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboard();
    } catch (error) {
      console.error("Failed to update ticket:", error);
    }
  };

  const filteredTickets = data?.recentTickets.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "ALL" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

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
            <Headphones className="w-7 h-7 text-indigo-600" />
            Help Desk
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track and manage support tickets
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          <Plus className="w-4 h-4" />
          Raise Ticket
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<AlertCircle className="w-6 h-6" />}
          label="Open Tickets"
          value={data?.stats.openTickets || 0}
          color="blue"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="In Progress"
          value={data?.stats.inProgress || 0}
          color="amber"
        />
        <StatCard
          icon={<CheckCircle2 className="w-6 h-6" />}
          label="Resolved Today"
          value={data?.stats.resolvedToday || 0}
          color="green"
        />
        <StatCard
          icon={<Timer className="w-6 h-6" />}
          label="Avg Resolution"
          value={`${data?.stats.avgResolutionHours || 0}h`}
          color="purple"
          isText
        />
        <StatCard
          icon={<MessageSquare className="w-6 h-6" />}
          label="Total Tickets"
          value={data?.stats.totalTickets || 0}
          color="indigo"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Ticket Trend (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data?.ticketTrend || []}>
              <defs>
                <linearGradient id="hdOpen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hdResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
              <Area type="monotone" dataKey="opened" stroke="#ef4444" strokeWidth={2} fill="url(#hdOpen)" name="Opened" />
              <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} fill="url(#hdResolved)" name="Resolved" />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Priority Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data?.priorityDistribution || []}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {(data?.priorityDistribution || []).map((entry, i) => {
                  const colors: Record<string, string> = {
                    LOW: "#10b981",
                    MEDIUM: "#f59e0b",
                    HIGH: "#f97316",
                    CRITICAL: "#ef4444",
                  };
                  return <Cell key={i} fill={colors[entry.name] || CHART_COLORS[i]} />;
                })}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>

          {/* Category Breakdown */}
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mt-4 mb-3">
            By Category
          </h3>
          <div className="space-y-2">
            {(data?.categoryBreakdown || []).slice(0, 5).map((cat, i) => {
              const maxCount = Math.max(...(data?.categoryBreakdown || []).map((c) => c.count), 1);
              const percentage = (cat.count / maxCount) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{cat.name}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{cat.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <QuickAction icon={<Plus className="w-5 h-5" />} label="New Ticket" color="indigo" onClick={() => setShowAddModal(true)} />
        <QuickAction icon={<UserPlus className="w-5 h-5" />} label="Assign" color="blue" onClick={() => navigate("/helpdesk")} />
        <QuickAction icon={<Eye className="w-5 h-5" />} label="View All" color="green" onClick={() => navigate("/helpdesk")} />
        <QuickAction icon={<BarChart3 className="w-5 h-5" />} label="Reports" color="purple" onClick={() => navigate("/helpdesk")} />
      </div>

      {/* Recent Tickets Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Tickets</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-48"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-700/50">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Ticket #</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Title</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Priority</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Raised By</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {(filteredTickets || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Headphones className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    No tickets found
                  </td>
                </tr>
              ) : (
                (filteredTickets || []).map((ticket) => {
                  const priorityConf = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM;
                  const statusConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          {ticket.ticketNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                          {ticket.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          {ticket.category}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityConf.bg} ${priorityConf.color}`}>
                          {priorityConf.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConf.bg} ${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300 text-xs">
                        {ticket.raisedBy}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-xs">
                        {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {ticket.status === "OPEN" && (
                            <button
                              onClick={() => handleStatusUpdate(ticket.id, "IN_PROGRESS")}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Start Working"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                          )}
                          {ticket.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => handleStatusUpdate(ticket.id, "RESOLVED")}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Mark Resolved"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Raise New Ticket</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Brief description of the issue"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                  rows={4}
                  placeholder="Detailed description of the issue..."
                />
              </div>

              {/* Category + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">Select Category</option>
                    <option value="Technical">Technical</option>
                    <option value="Academic">Academic</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Fee Related">Fee Related</option>
                    <option value="Transport">Transport</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Library">Library</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
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
                onClick={handleCreateTicket}
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Raise Ticket
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
  isText = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  isText?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
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
          <p className={`${isText ? "text-xl" : "text-2xl"} font-bold text-gray-900 dark:text-white`}>
            {value}
          </p>
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
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900",
    green: "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-400 dark:hover:bg-purple-900",
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
