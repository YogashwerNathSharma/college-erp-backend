import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getFullUrl } from "../../utils/url";
import {
  IndianRupee,
  TrendingUp,
  Users,
  Clock,
  FileText,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ═══════════════════════════════════════════════════════════════
// ACCOUNTANT DASHBOARD — Fee collection overview
// ═══════════════════════════════════════════════════════════════

interface DashboardStats {
  todayCollection: number;
  weekCollection: number;
  monthCollection: number;
  totalDues: number;
  totalStudents: number;
  pendingReceipts: number;
}

interface RecentCollection {
  id: string;
  studentName: string;
  className: string;
  amount: number;
  method: string;
  receiptNo: string;
  createdAt: string;
}

export default function AccountantDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todayCollection: 0,
    weekCollection: 0,
    monthCollection: 0,
    totalDues: 0,
    totalStudents: 0,
    pendingReceipts: 0,
  });
  const [recentCollections, setRecentCollections] = useState<RecentCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Try to fetch fee dashboard data
      const [dashRes, collectRes] = await Promise.allSettled([
        axios.get(getFullUrl("/api/fees/dashboard")),
        axios.get(getFullUrl("/api/fees/collection?limit=10&sort=latest")),
      ]);

      // Parse dashboard stats
      if (dashRes.status === "fulfilled" && dashRes.value.data?.success) {
        const d = dashRes.value.data.data;
        setStats({
          todayCollection: d.todayCollection || d.todaysCollection || 0,
          weekCollection: d.weekCollection || d.thisWeekCollection || 0,
          monthCollection: d.monthCollection || d.thisMonthCollection || 0,
          totalDues: d.totalDues || d.totalPending || 0,
          totalStudents: d.totalStudents || 0,
          pendingReceipts: d.pendingReceipts || 0,
        });
      }

      // Parse recent collections
      if (collectRes.status === "fulfilled" && collectRes.value.data?.success) {
        const payments = collectRes.value.data.data?.payments ||
          collectRes.value.data.data?.collections ||
          collectRes.value.data.data ||
          [];
        setRecentCollections(
          (Array.isArray(payments) ? payments : []).slice(0, 8).map((p: any) => ({
            id: p.id || p._id,
            studentName: p.student?.firstName
              ? `${p.student.firstName} ${p.student.lastName || ""}`
              : p.studentName || "—",
            className: p.student?.class?.name || p.className || "—",
            amount: p.amount || p.paidAmount || 0,
            method: p.paymentMethod || p.method || "CASH",
            receiptNo: p.receiptNumber || p.receiptNo || "—",
            createdAt: p.createdAt || p.paidAt || "",
          }))
        );
      }
    } catch (error) {
      console.warn("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Accounts Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Fee collection overview and quick actions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Collection */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Today's Collection</p>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <IndianRupee className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.todayCollection)}</p>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <TrendingUp size={12} /> Today
          </p>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">This Month</p>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <BarChart3 className="text-amber-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.monthCollection)}</p>
          <p className="text-xs text-amber-600 mt-1">Monthly total</p>
        </div>

        {/* Total Dues */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Total Pending Dues</p>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalDues)}</p>
          <p className="text-xs text-red-600 mt-1">Outstanding amount</p>
        </div>

        {/* Pending Receipts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Receipts Generated</p>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.pendingReceipts}</p>
          <p className="text-xs text-blue-600 mt-1">This month</p>
        </div>
      </div>

      {/* Quick Actions + Recent Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: "Collect Fee", path: "/fees/collection", icon: <IndianRupee size={16} />, color: "bg-green-50 text-green-700 hover:bg-green-100" },
              { label: "View Receipts", path: "/fees/receipts", icon: <FileText size={16} />, color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
              { label: "Student Ledger", path: "/fees/ledger", icon: <Users size={16} />, color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
              { label: "Fee Reports", path: "/fees/reports", icon: <BarChart3 size={16} />, color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
              { label: "Send Reminders", path: "/fees/reminders", icon: <Clock size={16} />, color: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
            ].map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${action.color}`}
              >
                {action.icon}
                <span>{action.label}</span>
                <ArrowRight size={14} className="ml-auto opacity-50" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Collections */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800">Recent Collections</h3>
            <button
              onClick={() => navigate("/fees/collection")}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              View All →
            </button>
          </div>

          {recentCollections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <IndianRupee size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No recent collections</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Student</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Class</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Amount</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Method</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Receipt</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCollections.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-2.5 px-2 text-gray-800 font-medium">{c.studentName}</td>
                      <td className="py-2.5 px-2 text-gray-600">{c.className}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-green-700">
                        {formatCurrency(c.amount)}
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            c.method === "CASH"
                              ? "bg-green-50 text-green-700"
                              : c.method === "UPI"
                              ? "bg-purple-50 text-purple-700"
                              : c.method === "ONLINE"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-50 text-gray-700"
                          }`}
                        >
                          {c.method}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-gray-500 font-mono text-xs">{c.receiptNo}</td>
                      <td className="py-2.5 px-2 text-gray-500 text-xs">{formatDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
