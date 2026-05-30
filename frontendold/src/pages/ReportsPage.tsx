import { useEffect, useState } from "react";
import axios from "axios";
import {
  IndianRupee, Users, CreditCard, Clock,
  TrendingUp, Search,
} from "lucide-react";

//////////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////////

interface Stats {
  totalRevenue: number;
  totalTenants: number;
  activeSubscriptions: number;
  pendingPayments: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
}

interface Payment {
  id: string;
  tenantName: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  gateway: string;
  paidAt: string | null;
  createdAt: string;
  razorpayPaymentId: string | null;
}

interface TenantRevenue {
  tenantName: string;
  totalPaid: number;
}

//////////////////////////////////////////////////////
// COMPONENT
//////////////////////////////////////////////////////

export default function ReportsPage() {

  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0, totalTenants: 0,
    activeSubscriptions: 0, pendingPayments: 0,
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyData[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenantRevenue, setTenantRevenue] = useState<TenantRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  //////////////////////////////////////////////////////
  // FETCH
  //////////////////////////////////////////////////////

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/reports", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const d = res.data.data;
        setStats(d.stats);
        setMonthlyRevenue(d.monthlyRevenue);
        setPayments(d.paymentHistory || []);
        setTenantRevenue(d.tenantRevenue);
      } catch (err) {
        console.error("Reports error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  //////////////////////////////////////////////////////
  // FILTERS
  //////////////////////////////////////////////////////

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.tenantName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.planName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  //////////////////////////////////////////////////////
  // LOADING
  //////////////////////////////////////////////////////

  if (loading) {
    return <div className="p-6 text-gray-500">Loading reports...</div>;
  }

  //////////////////////////////////////////////////////
  // MAX REVENUE (for chart bar heights)
  //////////////////////////////////////////////////////

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 1);

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Reports</h1>
        <p className="text-slate-500 mt-1">Subscription revenue analytics</p>
      </div>

      {/* ============================================ */}
      {/* 📊 STATS CARDS */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm opacity-80">Total Revenue</p>
            <IndianRupee size={20} />
          </div>
          <p className="text-3xl font-bold mt-2">₹{stats.totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm opacity-80">Total Tenants</p>
            <Users size={20} />
          </div>
          <p className="text-3xl font-bold mt-2">{stats.totalTenants}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm opacity-80">Active Subscriptions</p>
            <CreditCard size={20} />
          </div>
          <p className="text-3xl font-bold mt-2">{stats.activeSubscriptions}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm opacity-80">Pending Payments</p>
            <Clock size={20} />
          </div>
          <p className="text-3xl font-bold mt-2">{stats.pendingPayments}</p>
        </div>

      </div>

      {/* ============================================ */}
      {/* 📈 MONTHLY REVENUE CHART */}
      {/* ============================================ */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={20} className="text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-800">Monthly Revenue</h2>
        </div>

        <div className="flex items-end gap-2 h-64">
          {monthlyRevenue.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
              <div className="relative w-full flex justify-center">
                {item.revenue > 0 && (
                  <span className="absolute -top-6 text-xs font-semibold text-slate-600">
                    ₹{item.revenue >= 1000 ? `${(item.revenue / 1000).toFixed(1)}k` : item.revenue}
                  </span>
                )}
                <div
                  className="w-8 md:w-10 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all duration-300 hover:from-indigo-600 hover:to-purple-600"
                  style={{
                    height: `${Math.max((item.revenue / maxRevenue) * 200, item.revenue > 0 ? 20 : 4)}px`,
                  }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 truncate w-full text-center">
                {item.month.split(" ")[0]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================ */}
      {/* 🏢 TENANT-WISE REVENUE */}
      {/* ============================================ */}
      {tenantRevenue.length > 0 && (
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-4">🏢 Tenant-wise Revenue</h2>
          <div className="space-y-3">
            {tenantRevenue
              .sort((a, b) => b.totalPaid - a.totalPaid)
              .map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </span>
                    <span className="font-medium text-slate-700">{t.tenantName}</span>
                  </div>
                  <span className="font-bold text-green-600">₹{t.totalPaid.toLocaleString()}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* 📋 PAYMENT HISTORY TABLE */}
      {/* ============================================ */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-4">📋 Payment History</h2>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search tenant or plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left p-3 rounded-l-xl">#</th>
                <th className="text-left p-3">Tenant</th>
                <th className="text-left p-3">Plan</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3 rounded-r-xl">Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p, i) => (
                  <tr key={p.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 text-slate-500">{i + 1}</td>
                    <td className="p-3 font-medium">{p.tenantName}</td>
                    <td className="p-3">{p.planName || "—"}</td>
                    <td className="p-3 font-semibold">₹{p.amount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        p.status === "PAID"
                          ? "bg-green-100 text-green-700"
                          : p.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleDateString("en-IN")
                        : p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td className="p-3 text-xs text-slate-400 font-mono">
                      {p.razorpayPaymentId || "—"}
                    </td>
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