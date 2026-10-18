import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  Bell,
  MessageSquare,
  Send,
  Mail,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  ArrowRight,
  Plus,
  FileText,
  Smartphone,
  Megaphone,
  LayoutDashboard,
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

interface RecentMessage {
  id: string;
  type: "SMS" | "WhatsApp" | "Email" | "Notice";
  to: string;
  subject: string;
  date: string;
  status: "Delivered" | "Pending" | "Failed";
}

interface CommunicationData {
  noticesSent: number;
  smsSent: number;
  whatsappSent: number;
  pending: number;
  deliveryRate: number;
  monthlyCommunication: { month: string; sms: number; whatsapp: number; email: number }[];
  deliveryStatus: { name: string; value: number; color: string }[];
  communicationByModule: { module: string; count: number }[];
  recentMessages: RecentMessage[];
}

// ───────────────────────────────────────────────
// STAT CARD
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

export default function CommunicationDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<CommunicationData>({
    noticesSent: 0,
    smsSent: 0,
    whatsappSent: 0,
    pending: 0,
    deliveryRate: 0,
    monthlyCommunication: [],
    deliveryStatus: [],
    communicationByModule: [],
    recentMessages: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(getFullUrl("/api/communication/dashboard"), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.data) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch communication dashboard:", error);
      // Demo data
      setData({
        noticesSent: 124,
        smsSent: 3450,
        whatsappSent: 2180,
        pending: 45,
        deliveryRate: 94.5,
        monthlyCommunication: [
          { month: "Jan", sms: 520, whatsapp: 340, email: 120 },
          { month: "Feb", sms: 480, whatsapp: 380, email: 95 },
          { month: "Mar", sms: 610, whatsapp: 420, email: 140 },
          { month: "Apr", sms: 550, whatsapp: 390, email: 110 },
          { month: "May", sms: 680, whatsapp: 450, email: 155 },
          { month: "Jun", sms: 610, whatsapp: 400, email: 130 },
        ],
        deliveryStatus: [
          { name: "Delivered", value: 85, color: "#10b981" },
          { name: "Pending", value: 8, color: "#f59e0b" },
          { name: "Failed", value: 7, color: "#ef4444" },
        ],
        communicationByModule: [
          { module: "Fees", count: 1250 },
          { module: "Attendance", count: 890 },
          { module: "Exams", count: 720 },
          { module: "Notices", count: 450 },
          { module: "Transport", count: 340 },
          { module: "Admissions", count: 280 },
        ],
        recentMessages: [
          { id: "1", type: "SMS", to: "All Parents (Class 10)", subject: "Fee Reminder - June 2026", date: "2026-06-27", status: "Delivered" },
          { id: "2", type: "WhatsApp", to: "Teachers Group", subject: "Staff Meeting Tomorrow", date: "2026-06-27", status: "Delivered" },
          { id: "3", type: "Notice", to: "All Students", subject: "Summer Vacation Notice", date: "2026-06-26", status: "Delivered" },
          { id: "4", type: "SMS", to: "Defaulters List", subject: "Fee Overdue Warning", date: "2026-06-26", status: "Pending" },
          { id: "5", type: "Email", to: "Admin Staff", subject: "Monthly Report Ready", date: "2026-06-25", status: "Failed" },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SMS": return <Smartphone size={14} className="text-blue-500" />;
      case "WhatsApp": return <MessageSquare size={14} className="text-green-500" />;
      case "Email": return <Mail size={14} className="text-purple-500" />;
      case "Notice": return <FileText size={14} className="text-amber-500" />;
      default: return <Send size={14} className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Delivered":
        return <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium"><CheckCircle size={10} /> Delivered</span>;
      case "Pending":
        return <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium"><Clock size={10} /> Pending</span>;
      case "Failed":
        return <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium"><AlertCircle size={10} /> Failed</span>;
      default:
        return null;
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Communication Center</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage notices, SMS, WhatsApp & email communications
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus size={16} />
          New Message
        </button>
      </div>


      {/* ━━━━ Quick Actions ━━━━ */}
      <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-4 gap-1.5 sm:gap-2">
        {[
          { label: "Notice Board", icon: FileText, route: "/communication/notices", color: "bg-blue-500", lightBg: "bg-blue-50 dark:bg-blue-950/50" },
          { label: "Send SMS", icon: Send, route: "/communication/sms", color: "bg-green-500", lightBg: "bg-green-50 dark:bg-green-950/50" },
          { label: "WhatsApp", icon: MessageSquare, route: "/communication/whatsapp", color: "bg-emerald-500", lightBg: "bg-emerald-50 dark:bg-emerald-950/50" },
          { label: "Circular", icon: FileText, route: "/communication/circular", color: "bg-purple-500", lightBg: "bg-purple-50 dark:bg-purple-950/50" },
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Bell}
          label="Notices Sent"
          value={data.noticesSent}
          trend="+12 this week"
          trendUp={true}
          iconBg="bg-indigo-50 dark:bg-indigo-900/30"
          iconColor="text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          icon={Smartphone}
          label="SMS Sent"
          value={data.smsSent.toLocaleString("en-IN")}
          trend="+180"
          trendUp={true}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={MessageSquare}
          label="WhatsApp Sent"
          value={data.whatsappSent.toLocaleString("en-IN")}
          trend="+95"
          trendUp={true}
          iconBg="bg-green-50 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={data.pending}
          iconBg="bg-amber-50 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={CheckCircle}
          label="Delivery Rate"
          value={`${data.deliveryRate}%`}
          trend="+1.2%"
          trendUp={true}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Communication Stacked Area */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Monthly Communication</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-gray-500 dark:text-gray-400">SMS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-500 dark:text-gray-400">WhatsApp</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-gray-500 dark:text-gray-400">Email</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.monthlyCommunication}>
              <defs>
                <linearGradient id="commSmsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="commWaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="commEmailGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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
              <Area type="monotone" dataKey="sms" stroke="#3b82f6" strokeWidth={2} fill="url(#commSmsGrad)" name="SMS" />
              <Area type="monotone" dataKey="whatsapp" stroke="#10b981" strokeWidth={2} fill="url(#commWaGrad)" name="WhatsApp" />
              <Area type="monotone" dataKey="email" stroke="#8b5cf6" strokeWidth={2} fill="url(#commEmailGrad)" name="Email" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Delivery Status Donut */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Delivery Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.deliveryStatus}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {data.deliveryStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [`${value}%`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3 mt-2">
            {data.deliveryStatus.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Communication by Module + Recent Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Communication by Module Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">Communication by Module</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.communicationByModule} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis type="category" dataKey="module" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} width={80} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  fontSize: "13px",
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={24} name="Messages" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Messages Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Messages</h3>
            <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1">
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {data.recentMessages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center mt-0.5">
                  {getTypeIcon(msg.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{msg.type}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(msg.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate mt-0.5">{msg.subject}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{msg.to}</p>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(msg.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
