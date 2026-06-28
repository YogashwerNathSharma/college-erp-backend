import { useState, useEffect } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  CreditCard,
  IndianRupee,
  CheckCircle,
  XCircle,
  Clock,
  Link2,
  Settings,
  RefreshCw,
  ArrowUpRight,
  Download,
  Send,
  Shield,
  TrendingUp,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Filter,
  Search,
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
} from "recharts";

// ══════════════════════════════════════════════════
// PAYMENT GATEWAY DASHBOARD
// ══════════════════════════════════════════════════

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  FAILED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
  PENDING: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  CREATED: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  REFUNDED: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
};

const DONUT_COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"];

function formatINR(amount: number): string {
  if (!amount && amount !== 0) return "₹0";
  return "₹" + amount.toLocaleString("en-IN");
}

export default function PaymentGatewayDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "transactions" | "links" | "config">("dashboard");
  const [stats, setStats] = useState<any>({
    totalPayments: 0,
    successPayments: 0,
    todayCollection: 0,
    monthCollection: 0,
    failedCount: 0,
    pendingLinks: 0,
    successRate: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Config form
  const [configForm, setConfigForm] = useState({
    provider: "RAZORPAY",
    merchantId: "",
    apiKey: "",
    apiSecret: "",
    webhookSecret: "",
    isActive: true,
    isTest: true,
  });

  // Payment link form
  const [linkForm, setLinkForm] = useState({
    studentId: "",
    studentName: "",
    parentPhone: "",
    parentEmail: "",
    amount: "",
    purpose: "FEE_PAYMENT",
    description: "",
    expiryHours: 72,
    sendSMS: false,
    sendWhatsApp: false,
  });

  useEffect(() => {
    fetchStats();
    fetchTransactions();
    fetchConfigs();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/payment-gateway/stats"));
      if (res.data.success) setStats(res.data.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/payment-gateway/transactions?limit=25"));
      if (res.data.success) setTransactions(res.data.data.transactions);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  const fetchConfigs = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/payment-gateway/config"));
      if (res.data.success) setConfigs(res.data.data);
    } catch (err) {
      console.error("Failed to fetch configs:", err);
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const res = await axios.put(getFullUrl("/api/payment-gateway/config"), configForm);
      if (res.data.success) {
        fetchConfigs();
        setShowConfigModal(false);
        setConfigForm({ provider: "RAZORPAY", merchantId: "", apiKey: "", apiSecret: "", webhookSecret: "", isActive: true, isTest: true });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save config");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!linkForm.studentId || !linkForm.amount || !linkForm.purpose) return;
    setLoading(true);
    try {
      const res = await axios.post(getFullUrl("/api/payment-gateway/link"), {
        ...linkForm,
        amount: parseFloat(linkForm.amount),
      });
      if (res.data.success) {
        alert(`Payment link generated: ${res.data.data.linkUrl}`);
        setShowLinkModal(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to generate link");
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (paymentId: string) => {
    if (!confirm("Are you sure you want to initiate a full refund?")) return;
    try {
      const res = await axios.post(getFullUrl(`/api/payment-gateway/refund/${paymentId}`), { reason: "Admin initiated" });
      if (res.data.success) {
        alert("Refund initiated successfully");
        fetchTransactions();
        fetchStats();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Refund failed");
    }
  };

  // Mock chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      amount: Math.floor(Math.random() * 50000) + 10000,
    };
  });

  const statusData = [
    { name: "Success", value: stats.successPayments },
    { name: "Failed", value: stats.failedCount },
    { name: "Pending", value: stats.totalPayments - stats.successPayments - stats.failedCount },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Gateway</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage online payments, refunds, and payment links</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm"
          >
            <Link2 size={18} />
            Generate Link
          </button>
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
          >
            <Settings size={18} />
            Configure
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Collection" value={formatINR(stats.todayCollection)} icon={<IndianRupee size={24} />} color="emerald" trend="+12%" />
        <StatCard title="Monthly Collection" value={formatINR(stats.monthCollection)} icon={<TrendingUp size={24} />} color="blue" />
        <StatCard title="Success Rate" value={`${stats.successRate}%`} icon={<CheckCircle size={24} />} color="green" />
        <StatCard title="Pending Links" value={stats.pendingLinks.toString()} icon={<Link2 size={24} />} color="amber" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Collection Trend (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="paymentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => formatINR(v)} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#paymentGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Payment Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {statusData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT_COLORS[i] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gateway Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {configs.length > 0 ? (
          configs.map((cfg) => (
            <div key={cfg.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
                    <Shield size={20} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{cfg.provider}</p>
                    <p className="text-xs text-gray-500">{cfg.merchantId || "No Merchant ID"}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                  {cfg.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs ${cfg.isTest ? "bg-yellow-50 text-yellow-600" : "bg-green-50 text-green-600"}`}>
                  {cfg.isTest ? "🧪 Test Mode" : "🔴 Live Mode"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-5 flex items-center gap-4">
            <AlertCircle size={24} className="text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-300">No Payment Gateway Configured</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Click "Configure" to add Razorpay, Paytm, or PhonePe credentials.</p>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-white">Recent Transactions</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-700/50">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Order ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Student</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Purpose</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                  <td className="py-3 px-4 font-mono text-xs text-gray-700 dark:text-gray-300">{txn.orderId}</td>
                  <td className="py-3 px-4 font-medium text-gray-800 dark:text-white">{txn.studentName || "-"}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{formatINR(txn.amount)}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{txn.purpose?.replace("_", " ")}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[txn.status] || ""}`}>
                      {txn.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {new Date(txn.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-3 px-4">
                    {txn.status === "SUCCESS" && (
                      <button
                        onClick={() => handleRefund(txn.id)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">No transactions yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configure Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Configure Payment Gateway</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider</label>
                <select
                  value={configForm.provider}
                  onChange={(e) => setConfigForm({ ...configForm, provider: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                >
                  <option value="RAZORPAY">Razorpay</option>
                  <option value="PAYTM">Paytm</option>
                  <option value="PHONEPE">PhonePe</option>
                  <option value="CCAVENUE">CCAvenue</option>
                  <option value="STRIPE">Stripe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Merchant ID</label>
                <input
                  type="text"
                  value={configForm.merchantId}
                  onChange={(e) => setConfigForm({ ...configForm, merchantId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key (Public)</label>
                <input
                  type="text"
                  value={configForm.apiKey}
                  onChange={(e) => setConfigForm({ ...configForm, apiKey: e.target.value })}
                  placeholder="rzp_test_..."
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Secret</label>
                <input
                  type="password"
                  value={configForm.apiSecret}
                  onChange={(e) => setConfigForm({ ...configForm, apiSecret: e.target.value })}
                  placeholder="••••••••••"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook Secret</label>
                <input
                  type="password"
                  value={configForm.webhookSecret}
                  onChange={(e) => setConfigForm({ ...configForm, webhookSecret: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configForm.isActive}
                    onChange={(e) => setConfigForm({ ...configForm, isActive: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configForm.isTest}
                    onChange={(e) => setConfigForm({ ...configForm, isTest: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Test Mode</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Config"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Payment Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Generate Payment Link</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student ID *</label>
                  <input
                    type="text"
                    value={linkForm.studentId}
                    onChange={(e) => setLinkForm({ ...linkForm, studentId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student Name</label>
                  <input
                    type="text"
                    value={linkForm.studentName}
                    onChange={(e) => setLinkForm({ ...linkForm, studentName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={linkForm.amount}
                    onChange={(e) => setLinkForm({ ...linkForm, amount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose *</label>
                  <select
                    value={linkForm.purpose}
                    onChange={(e) => setLinkForm({ ...linkForm, purpose: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  >
                    <option value="FEE_PAYMENT">Fee Payment</option>
                    <option value="ADMISSION_FEE">Admission Fee</option>
                    <option value="TRANSPORT_FEE">Transport Fee</option>
                    <option value="HOSTEL_FEE">Hostel Fee</option>
                    <option value="MISC">Miscellaneous</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parent Phone</label>
                  <input
                    type="tel"
                    value={linkForm.parentPhone}
                    onChange={(e) => setLinkForm({ ...linkForm, parentPhone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expires In (hours)</label>
                  <input
                    type="number"
                    value={linkForm.expiryHours}
                    onChange={(e) => setLinkForm({ ...linkForm, expiryHours: parseInt(e.target.value) || 72 })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={linkForm.description}
                  onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkForm.sendSMS}
                    onChange={(e) => setLinkForm({ ...linkForm, sendSMS: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Send SMS</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkForm.sendWhatsApp}
                    onChange={(e) => setLinkForm({ ...linkForm, sendWhatsApp: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Send WhatsApp</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLinkModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateLink}
                disabled={loading || !linkForm.studentId || !linkForm.amount}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stat Card ──
function StatCard({ title, value, icon, color, trend }: { title: string; value: string; icon: React.ReactNode; color: string; trend?: string }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
      {trend && (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400">
          {trend}
        </span>
      )}
    </div>
  );
}
