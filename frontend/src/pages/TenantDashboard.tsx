import { getFullUrl } from "../utils/url";
import { useEffect, useState } from "react";
import axios from "axios";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Users, UserCog, IndianRupee, AlertCircle, GraduationCap,
  CalendarCheck, ClipboardList, Bus, BookOpen, BarChart3,
  Clock, Zap, CheckCircle, TrendingUp, TrendingDown,
  Calendar, Bell, UserPlus, Receipt, ArrowRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import DashboardDetailModal from "../components/dashboard/DashboardDetailModal";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Format number in Indian locale: ₹1,23,456 */
function formatINR(amount: number): string {
  if (!amount && amount !== 0) return "₹0";
  return "₹" + amount.toLocaleString("en-IN");
}

/** Get greeting based on time of day */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

/** Format date as readable string */
function formatDate(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────
// ANIMATION STYLES (injected inline for self-containment)
// ─────────────────────────────────────────────────────────────

const animationCSS = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;
}
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.2s; }
.stagger-5 { animation-delay: 0.25s; }
.stagger-6 { animation-delay: 0.3s; }
.stagger-7 { animation-delay: 0.35s; }
.stagger-8 { animation-delay: 0.4s; }
.stagger-9 { animation-delay: 0.45s; }
`;

// ─────────────────────────────────────────────────────────────
// MODULE NAVIGATION CONFIG
// ─────────────────────────────────────────────────────────────

const modules = [
  { label: "Students", icon: GraduationCap, route: "/students", color: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400", ring: "hover:ring-blue-200 dark:hover:ring-blue-800" },
  { label: "Teachers", icon: UserCog, route: "/teachers", color: "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400", ring: "hover:ring-green-200 dark:hover:ring-green-800" },
  { label: "Fees", icon: IndianRupee, route: "/fees", color: "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400", ring: "hover:ring-emerald-200 dark:hover:ring-emerald-800" },
  { label: "Attendance", icon: CalendarCheck, route: "/attendance", color: "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400", ring: "hover:ring-purple-200 dark:hover:ring-purple-800" },
  { label: "Exams", icon: ClipboardList, route: "/exams", color: "bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400", ring: "hover:ring-orange-200 dark:hover:ring-orange-800" },
  { label: "Timetable", icon: Clock, route: "/timetable", color: "bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400", ring: "hover:ring-cyan-200 dark:hover:ring-cyan-800" },
  { label: "Transport", icon: Bus, route: "/transport", color: "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400", ring: "hover:ring-amber-200 dark:hover:ring-amber-800" },
  { label: "Library", icon: BookOpen, route: "/library", color: "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400", ring: "hover:ring-rose-200 dark:hover:ring-rose-800" },
  { label: "Reports", icon: BarChart3, route: "/reports", color: "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400", ring: "hover:ring-indigo-200 dark:hover:ring-indigo-800" },
];

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { setTenant }: any = useOutletContext();
  const navigate = useNavigate();

  const [data, setData] = useState<any>({
    totalStudents: 0, totalClasses: 0, totalPaid: 0,
    totalPending: 0, monthlyData: [], recentPayments: [],
    defaulters: [], insights: {},
  });

  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    type: "students" | "classes" | "fees_collected" | "fees_pending" | "receipts" | "recent_payments";
  }>({ open: false, type: "students" });

  // ─── Subscription fetch ──────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    if (!document.getElementById("razorpay-script")) {
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
    axios.get("/api/tenant/my-subscription", { headers })
      .then((res) => setSubscriptionInfo(res.data?.data || res.data))
      .catch(() => { });
  }, []);

  // ─── Dashboard data fetch ────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get("/api/dashboard", { headers });
        const d = res.data?.data;

        setData({
          totalStudents: d?.totalStudents ?? 0,
          totalClasses: d?.totalClasses ?? 0,
          totalPaid: d?.totalPaid ?? 0,
          totalPending: d?.totalPending ?? 0,
          monthlyData: d?.monthlyData ?? [],
          recentPayments: d?.recentPayments ?? [],
          defaulters: d?.defaulters ?? [],
          insights: d?.insights ?? {},
        });

        const tenantData = {
          name: d?.tenant?.name || "",
          schoolName: d?.tenant?.schoolName || d?.tenant?.name || "",
          type: d?.tenant?.type || "",
          logoUrl: getFullUrl(d?.tenant?.logoUrl || d?.tenant?.logo),
          backgroundUrl: d?.tenant?.backgroundUrl || null,
          address: d?.tenant?.address || "",
          phone: d?.tenant?.phone || "",
          email: d?.tenant?.email || "",
        };
        setTenant(tenantData);
        localStorage.setItem("tenant", JSON.stringify(tenantData));
      } catch (err) {
        console.log("Dashboard error:", err);
        const savedTenant = localStorage.getItem("tenant");
        if (savedTenant) setTenant(JSON.parse(savedTenant));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ─── Plan + Payment handlers ─────────────────────────────
  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/tenant/plans", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlans(res.data.data || []);
      setShowPlansModal(true);
    } catch (err) {
      console.error("Fetch plans error:", err);
    }
  };

  const buyPlan = async (planId: string) => {
    try {
      setPaymentLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post("/api/tenant/self-subscribe", { planId }, { headers });
      const { order, subscriptionId } = res.data.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SufLEYxZg1RUP2",
        amount: order.amount,
        currency: order.currency,
        name: "College ERP",
        description: "Subscription Plan",
        order_id: order.id,
        prefill: { name: user?.name || "User", email: user?.email || "", contact: "9999999999" },
        theme: { color: "#4f46e5" },
        handler: async function (response: any) {
          try {
            await axios.post("/api/subscription-payments/verify", {
              subscriptionId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }, { headers });
            alert("✅ Payment Successful! Plan Activated.");
            setShowPlansModal(false);
            window.location.reload();
          } catch { alert("❌ Payment verification failed"); }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (r: any) => alert(r?.error?.description || "Payment Failed"));
      rzp.open();
    } catch (error: any) {
      alert("❌ " + (error.response?.data?.message || "Invalid plan. Purchase a valid paid plan to continue."));
    } finally {
      setPaymentLoading(false);
    }
  };

  const isFreePlan = subscriptionInfo?.amount === 0 || subscriptionInfo?.planName?.toLowerCase().includes("free");

  // ─── Loading state ───────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <>
      <style>{animationCSS}</style>
      <div className="p-2 sm:p-3 lg:p-4 space-y-2 lg:space-y-3 max-w-[1600px] mx-auto overflow-x-hidden h-[calc(100vh-60px)] overflow-y-auto lg:overflow-y-hidden">

        {/* ═══ GREETING HEADER ═══ */}
        <div className="animate-fade-in-up stagger-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {getGreeting()}, {user?.name?.split(" ")[0] || "Admin"} 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1">
              <Calendar size={12} /> {formatDate()}
            </p>
          </div>
          {subscriptionInfo && (
            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-sm ${
              subscriptionInfo.daysRemaining <= 5
                ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            }`}>
              <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                isFreePlan ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
              }`}>{subscriptionInfo.planName}</span>
              <span className={`font-medium ${subscriptionInfo.daysRemaining <= 5 ? "text-red-600" : "text-slate-600 dark:text-slate-300"}`}>
                {subscriptionInfo.daysRemaining} days left
              </span>
              <button onClick={fetchPlans} className="ml-2 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all">
                Upgrade
              </button>
            </div>
          )}
        </div>

        {/* ═══ SECTION 1: QUICK STATS ROW ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <StatCard
            title="Total Students"
            value={data.totalStudents}
            icon={<Users size={16} />}
            gradient="from-blue-500 to-blue-600"
            bgLight="bg-blue-50 dark:bg-blue-950"
            iconColor="text-blue-600 dark:text-blue-400"
            change={data.insights?.studentGrowth}
            delay="stagger-2"
            onClick={() => setDetailModal({ open: true, type: "students" })}
          />
          <StatCard
            title="Total Teachers"
            value={data.totalClasses}
            icon={<UserCog size={16} />}
            gradient="from-green-500 to-green-600"
            bgLight="bg-green-50 dark:bg-green-950"
            iconColor="text-green-600 dark:text-green-400"
            delay="stagger-3"
            onClick={() => setDetailModal({ open: true, type: "classes" })}
          />
          <StatCard
            title="Fee Collected"
            value={formatINR(data.totalPaid)}
            icon={<IndianRupee size={16} />}
            gradient="from-emerald-500 to-teal-600"
            bgLight="bg-emerald-50 dark:bg-emerald-950"
            iconColor="text-emerald-600 dark:text-emerald-400"
            change={data.insights?.growth}
            delay="stagger-4"
            onClick={() => setDetailModal({ open: true, type: "fees_collected" })}
          />
          <StatCard
            title="Fee Pending"
            value={formatINR(data.totalPending)}
            icon={<AlertCircle size={16} />}
            gradient="from-red-500 to-rose-600"
            bgLight="bg-red-50 dark:bg-red-950"
            iconColor="text-red-600 dark:text-red-400"
            isNegative
            delay="stagger-5"
            onClick={() => setDetailModal({ open: true, type: "fees_pending" })}
          />
        </div>

        {/* ═══ SECTION 2: MODULE QUICK ACCESS GRID ═══ */}
        <div className="animate-fade-in-up stagger-6">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Quick Access</h2>
          <div className="grid grid-cols-5 sm:grid-cols-9 lg:grid-cols-9 gap-1.5">
            {modules.map((mod) => (
              <button
                key={mod.label}
                onClick={() => navigate(mod.route)}
                className={`group flex flex-col items-center gap-1 p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:shadow-md ring-2 ring-transparent ${mod.ring} transition-all duration-200 hover:-translate-y-0.5`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${mod.color} transition-transform group-hover:scale-110`}>
                  <mod.icon size={14} />
                </div>
                <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 leading-tight">{mod.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 3: CHART + TODAY'S HIGHLIGHTS ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 animate-fade-in-up stagger-7">
          {/* LEFT — Revenue Chart (60%) */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Fee Collection</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Monthly revenue</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" /> Collected</span>
              </div>
            </div>
            <div className="h-36 lg:h-40">
              {data.monthlyData && data.monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      formatter={(value: any) => [formatINR(value), "Amount"]}
                    />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                      {data.monthlyData.map((_: any, idx: number) => (
                        <Cell key={idx} fill={`url(#barGradient)`} />
                      ))}
                    </Bar>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
                  <p className="text-sm">No monthly data available yet</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Today's Highlights (40%) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-1.5">
              <Bell size={14} className="text-indigo-500" /> Today's Highlights
            </h3>
            <div className="space-y-1.5">
              <HighlightItem
                icon={<CalendarCheck size={13} className="text-purple-500" />}
                label="Attendance"
                value={data.insights?.attendanceToday ? `${data.insights.attendanceToday}%` : "—"}
                sub="Today's average"
              />
              <HighlightItem
                icon={<ClipboardList size={13} className="text-orange-500" />}
                label="Upcoming Exams"
                value={data.insights?.upcomingExams ?? "—"}
                sub="This week"
              />
              <HighlightItem
                icon={<AlertCircle size={13} className="text-red-500" />}
                label="Fee Dues"
                value={data.defaulters?.length ?? 0}
                sub="Pending reminders"
              />
              <HighlightItem
                icon={<UserPlus size={13} className="text-blue-500" />}
                label="New Admissions"
                value={data.insights?.newAdmissions ?? "—"}
                sub="This week"
              />
              <HighlightItem
                icon={<IndianRupee size={13} className="text-emerald-500" />}
                label="Today's Collection"
                value={data.insights?.todayCollection ? formatINR(data.insights.todayCollection) : "—"}
                sub="Received today"
              />
            </div>
          </div>
        </div>

        {/* ═══ SECTION 4: RECENT ACTIVITY FEED ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 animate-fade-in-up stagger-8">
          {/* Recent Fee Payments */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Receipt size={14} className="text-emerald-500" /> Recent Payments
              </h3>
              <button
                onClick={() => setDetailModal({ open: true, type: "recent_payments" })}
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-0.5"
              >
                View All <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-1">
              {data.recentPayments.length > 0 ? data.recentPayments.slice(0, 4).map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                      <IndianRupee size={11} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{p.studentName || p.name || "Student"}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{p.date || p.paidAt || "—"}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatINR(p.amount)}</span>
                </div>
              )) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No recent payments</p>
              )}
            </div>
          </div>

          {/* Fee Defaulters */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <AlertCircle size={14} className="text-red-500" /> Fee Defaulters
              </h3>
              <button
                onClick={() => setDetailModal({ open: true, type: "fees_pending" })}
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-0.5"
              >
                View All <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-1">
              {data.defaulters.length > 0 ? data.defaulters.slice(0, 4).map((d: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                      <Users size={11} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{d.studentName || d.name || "Student"}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{d.className || d.class || "—"}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">{formatINR(d.pendingAmount || d.amount || 0)}</span>
                </div>
              )) : (
                <div className="text-center py-8">
                  <CheckCircle size={24} className="mx-auto text-green-400 mb-1" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">No defaulters! 🎉</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ PLANS MODAL ═══ */}
        {showPlansModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Choose a Plan</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select the best plan for your institution</p>
                </div>
                <button onClick={() => setShowPlansModal(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const isFree = plan.price === 0;
                  const isCurrentPlan = subscriptionInfo?.planName === plan.name;
                  return (
                    <div key={plan.id} className={`rounded-2xl border-2 p-6 relative transition-all hover:shadow-lg ${
                      isCurrentPlan ? "border-green-500 bg-green-50 dark:bg-green-950" : plan.isPopular ? "border-blue-500 shadow-lg shadow-blue-500/10" : "border-slate-200 dark:border-slate-700"
                    }`}>
                      {isCurrentPlan && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle size={12} /> Current
                        </span>
                      )}
                      {!isCurrentPlan && plan.isPopular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs px-3 py-1 rounded-full">⭐ Popular</span>
                      )}
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                      {plan.description && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{plan.description}</p>}
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-4">
                        {isFree ? "Free" : formatINR(plan.price)}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{plan.durationInDays} Days</p>
                      <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        <p>👨‍🎓 Students: <b>{plan.maxStudents}</b></p>
                        <p>👨‍🏫 Teachers: <b>{plan.maxTeachers}</b></p>
                        <p>👨‍💼 Admins: <b>{plan.maxAdmins}</b></p>
                        <p>💾 Storage: <b>{plan.maxStorageInGB} GB</b></p>
                      </div>
                      {plan.features?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {plan.features.map((f: string, i: number) => (
                            <span key={i} className="bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full">{f}</span>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => !isCurrentPlan && buyPlan(plan.id)}
                        disabled={paymentLoading || isCurrentPlan}
                        className={`w-full mt-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                          isCurrentPlan ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50"
                        }`}
                      >
                        {isCurrentPlan ? (<><CheckCircle size={16} /> Active</>) : (<><Zap size={16} /> {paymentLoading ? "Processing..." : "Buy & Activate"}</>)}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        <DashboardDetailModal
          isOpen={detailModal.open}
          type={detailModal.type}
          onClose={() => setDetailModal({ ...detailModal, open: false })}
        />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

/** Glass-morphism stat card */
function StatCard({ title, value, icon, gradient, bgLight, iconColor, change, isNegative, delay, onClick }: {
  title: string; value: string | number; icon: React.ReactNode;
  gradient: string; bgLight: string; iconColor: string;
  change?: number; isNegative?: boolean; delay?: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`animate-fade-in-up ${delay || ""} group cursor-pointer relative overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-2.5 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}
    >
      {/* Subtle gradient accent */}
      <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${gradient} opacity-10 rounded-full -translate-y-6 translate-x-6 group-hover:scale-150 transition-transform duration-500`} />

      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{title}</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
          {change !== undefined && change !== null && (
            <div className={`flex items-center gap-0.5 mt-0.5 text-[10px] font-medium ${
              isNegative ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
            }`}>
              {isNegative ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgLight} ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/** Highlight list item */
function HighlightItem({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string | number; sub: string;
}) {
  return (
    <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{label}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">{sub}</p>
        </div>
      </div>
      <span className="text-xs font-bold text-slate-800 dark:text-white">{value}</span>
    </div>
  );
}
