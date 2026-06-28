import { useEffect, useState } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  Award,
  FileText,
  FilePlus,
  Printer,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  ArrowRight,
  Plus,
  Download,
  Send,
  Eye,
} from "lucide-react";
import {
  BarChart,
  Bar,
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

// ───────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────

interface RecentCertificate {
  id: string;
  studentName: string;
  type: "TC" | "Character" | "Migration" | "Bonafide" | "Other";
  date: string;
  status: "Generated" | "Pending" | "Printed" | "Delivered";
}

interface CertificateData {
  totalGenerated: number;
  tcIssued: number;
  characterCert: number;
  migrationCert: number;
  pendingRequests: number;
  monthlyCertificates: { month: string; tc: number; character: number; migration: number; bonafide: number }[];
  statusDistribution: { name: string; value: number; color: string }[];
  recentCertificates: RecentCertificate[];
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

export default function CertificateDashboard() {
  const [data, setData] = useState<CertificateData>({
    totalGenerated: 0,
    tcIssued: 0,
    characterCert: 0,
    migrationCert: 0,
    pendingRequests: 0,
    monthlyCertificates: [],
    statusDistribution: [],
    recentCertificates: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(getFullUrl("/api/certificates/dashboard"), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.data) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch certificate dashboard:", error);
      // Demo data
      setData({
        totalGenerated: 256,
        tcIssued: 89,
        characterCert: 104,
        migrationCert: 42,
        pendingRequests: 8,
        monthlyCertificates: [
          { month: "Jan", tc: 12, character: 15, migration: 5, bonafide: 8 },
          { month: "Feb", tc: 8, character: 18, migration: 7, bonafide: 12 },
          { month: "Mar", tc: 15, character: 22, migration: 9, bonafide: 10 },
          { month: "Apr", tc: 10, character: 14, migration: 4, bonafide: 6 },
          { month: "May", tc: 20, character: 16, migration: 8, bonafide: 9 },
          { month: "Jun", tc: 14, character: 19, migration: 6, bonafide: 11 },
        ],
        statusDistribution: [
          { name: "Generated", value: 180, color: "#6366f1" },
          { name: "Pending", value: 32, color: "#f59e0b" },
          { name: "Printed", value: 28, color: "#06b6d4" },
          { name: "Delivered", value: 16, color: "#10b981" },
        ],
        recentCertificates: [
          { id: "1", studentName: "Aarav Patel", type: "TC", date: "2026-06-27", status: "Generated" },
          { id: "2", studentName: "Diya Sharma", type: "Character", date: "2026-06-26", status: "Printed" },
          { id: "3", studentName: "Rohan Gupta", type: "Migration", date: "2026-06-26", status: "Delivered" },
          { id: "4", studentName: "Ananya Singh", type: "TC", date: "2026-06-25", status: "Pending" },
          { id: "5", studentName: "Kabir Joshi", type: "Character", date: "2026-06-25", status: "Generated" },
          { id: "6", studentName: "Meera Reddy", type: "Bonafide", date: "2026-06-24", status: "Printed" },
          { id: "7", studentName: "Vivaan Kumar", type: "Migration", date: "2026-06-24", status: "Pending" },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      TC: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      Character: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      Migration: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
      Bonafide: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      Other: "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors[type] || colors.Other}`}>
        {type}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; icon: any }> = {
      Generated: { bg: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", icon: FileText },
      Pending: { bg: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
      Printed: { bg: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400", icon: Printer },
      Delivered: { bg: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
    };
    const c = config[status] || config.Pending;
    const StatusIcon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${c.bg}`}>
        <StatusIcon size={10} />
        {status}
      </span>
    );
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Certificates</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Generate and manage Transfer, Character & Migration certificates
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus size={16} />
          Generate Certificate
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Award}
          label="Total Generated"
          value={data.totalGenerated}
          trend="+18 this month"
          trendUp={true}
          iconBg="bg-indigo-50 dark:bg-indigo-900/30"
          iconColor="text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          icon={FileText}
          label="TC Issued"
          value={data.tcIssued}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={Award}
          label="Character Cert"
          value={data.characterCert}
          iconBg="bg-purple-50 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
        />
        <StatCard
          icon={Send}
          label="Migration Cert"
          value={data.migrationCert}
          iconBg="bg-cyan-50 dark:bg-cyan-900/30"
          iconColor="text-cyan-600 dark:text-cyan-400"
        />
        <StatCard
          icon={Clock}
          label="Pending Requests"
          value={data.pendingRequests}
          trend="Needs action"
          trendUp={false}
          iconBg="bg-amber-50 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Certificates Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Monthly Certificates</h3>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-gray-500 dark:text-gray-400">TC</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-purple-500" />
                <span className="text-gray-500 dark:text-gray-400">Character</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-cyan-500" />
                <span className="text-gray-500 dark:text-gray-400">Migration</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span className="text-gray-500 dark:text-gray-400">Bonafide</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.monthlyCertificates}>
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
              <Bar dataKey="tc" name="TC" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={14} />
              <Bar dataKey="character" name="Character" fill="#8b5cf6" radius={[0, 0, 0, 0]} barSize={14} />
              <Bar dataKey="migration" name="Migration" fill="#06b6d4" radius={[0, 0, 0, 0]} barSize={14} />
              <Bar dataKey="bonafide" name="Bonafide" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution Donut */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {data.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [value, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2.5 mt-2">
            {data.statusDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Certificates Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Certificates</h3>
          <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1">
            View All <ArrowRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700">
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pb-3">Student</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pb-3">Type</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pb-3">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pb-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {data.recentCertificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {cert.studentName.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{cert.studentName}</span>
                    </div>
                  </td>
                  <td className="py-3">{getTypeBadge(cert.type)}</td>
                  <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(cert.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-3">{getStatusBadge(cert.status)}</td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 hover:text-indigo-600 transition-colors" title="View">
                        <Eye size={15} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 hover:text-green-600 transition-colors" title="Download">
                        <Download size={15} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 hover:text-blue-600 transition-colors" title="Print">
                        <Printer size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: FileText, label: "Generate TC", color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", path: "/certificates/tc" },
            { icon: Award, label: "Character Cert", color: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400", path: "/certificates/character" },
            { icon: Send, label: "Migration Cert", color: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400", path: "/certificates/migration" },
            { icon: FilePlus, label: "Bulk Generate", color: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400", path: "/certificates/tc" },
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
