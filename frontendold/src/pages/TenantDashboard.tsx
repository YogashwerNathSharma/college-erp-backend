
import { getFullUrl } from "../utils/url";
import { useEffect, useState } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import {
  Users, School, IndianRupee, AlertCircle, FileText,
   Zap, CheckCircle, Receipt,
} from "lucide-react";
//import UsageCard from "../components/dashboard/UsageCard";
import StatsCard from "../components/dashboard/StatsCard";
import DashboardDetailModal from "../components/dashboard/DashboardDetailModal";
import RevenueChart from "../components/dashboard/RevenueChart";
import RecentPayments from "../components/dashboard/RecentPayments";
import DefaultersList from "../components/dashboard/DefaultersList";
import Insights from "../components/dashboard/Insights";

//////////////////////////////////////////////////////
// HELPER — Full URL for logo
//////////////////////////////////////////////////////

export default function Dashboard() {
  console.log("TENANT DASHBOARD RENDERED");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { setTenant }: any = useOutletContext();

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
  const [detailModal, setDetailModal] = useState<{ open: boolean; type: "students" | "classes" | "fees_collected" | "fees_pending" | "receipts" | "recent_payments" }>({ open: false, type: "students" });

  // Separate subscription fetch - runs independently of dashboard data
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    // Load Razorpay checkout script
    if (!document.getElementById("razorpay-script")) {
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
    axios.get("/api/tenant/my-subscription", { headers })
      .then((res) => setSubscriptionInfo(res.data?.data || res.data))
      .catch(() => console.log("No active subscription"));
  }, []);

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

        // Tenant data — LOGO FIXED ✅
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

      const res = await axios.post(
        "/api/tenant/self-subscribe",
        { planId },
        { headers }
      );

      const { order, subscriptionId } = res.data.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SufLEYxZg1RUP2",
        amount: order.amount,
        currency: order.currency,
        name: "College ERP",
        description: "Subscription Plan",
        order_id: order.id,
        prefill: {
          name: user?.name || "User",
          email: user?.email || "",
          contact: "9999999999",
        },
        theme: { color: "#4f46e5" },
        handler: async function (response: any) {
          try {
            await axios.post(
              "/api/subscription-payments/verify",
              {
                subscriptionId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers }
            );
            alert("✅ Payment Successful! Plan Activated.");
            setShowPlansModal(false);
            window.location.reload();
          } catch (err) {
            alert("❌ Payment verification failed");
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (res: any) => {
        alert(res?.error?.description || "Payment Failed");
      });
      rzp.open();

    } catch (error: any) {
      alert("❌ " + (error.response?.data?.message || " This is not valid plan, You alredy use free trial plan , Now purchase a valid paid plan to continue "));
    } finally {
      setPaymentLoading(false);
    }
  };

  // 🔥 Helper: Check if current plan is free
  const isFreePlan = subscriptionInfo?.amount === 0 || subscriptionInfo?.planName?.toLowerCase().includes("free");

  if (loading) {
    return <div className="p-6 text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden">

     

{/* 🔥 COMPACT SUBSCRIPTION — 1 LINE */}
{subscriptionInfo && (
  <div className={`flex items-center justify-between rounded-xl px-5 py-3 border shadow-sm ${
    subscriptionInfo.daysRemaining <= 5
      ? "bg-red-50 border-red-200"
      : isFreePlan
        ? "bg-green-50 border-green-200"
        : "bg-white border-slate-200"
  }`}>
    <div className="flex items-center gap-3 flex-wrap">
      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
        isFreePlan ? "bg-green-100 text-green-700" : "bg-primary-100 text-primary-700"
      }`}>
        {subscriptionInfo.planName}
      </span>
      <span className={`text-sm font-medium ${
        subscriptionInfo.daysRemaining <= 5 ? "text-red-600" : "text-slate-600"
      }`}>
        ⏱ {subscriptionInfo.daysRemaining} days left
      </span>
      <span className="text-slate-300 hidden md:inline">|</span>
      <span className="text-sm text-slate-500 hidden md:inline">
        Till {new Date(subscriptionInfo.endDate).toLocaleDateString("en-IN")}
      </span>
      <span className="text-slate-300 hidden lg:inline">|</span>
      <span className="text-sm text-slate-500 hidden lg:inline">
        👨🎓{subscriptionInfo.maxStudents} 👨🏫{subscriptionInfo.maxTeachers} 💾{subscriptionInfo.maxStorageInGB}GB
      </span>
      {subscriptionInfo.daysRemaining <= 5 && (
        <span className="text-xs text-red-600 font-semibold">⚠️ Expiring soon!</span>
      )}
    </div>
    <button
      onClick={fetchPlans}
      className="text-sm bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-lg font-semibold whitespace-nowrap"
    >
      Upgrade
    </button>
  </div>
)}

    {/* STATS — Compact + Clickable */}
<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
  <div onClick={() => setDetailModal({ open: true, type: "students" })}><StatsCard title="Students" value={data.totalStudents} icon={<Users size={18} />} color="from-primary-500 to-purple-600" /></div>
  <div onClick={() => setDetailModal({ open: true, type: "classes" })}><StatsCard title="Classes" value={data.totalClasses} icon={<School size={18} />} color="from-teal-500 to-cyan-600" /></div>
  <div onClick={() => setDetailModal({ open: true, type: "fees_collected" })}><StatsCard title="Fees Collected" value={`₹ ${data.totalPaid}`} icon={<IndianRupee size={18} />} color="from-yellow-500 to-orange-500" growth={data?.insights?.growth} /></div>
  <div onClick={() => setDetailModal({ open: true, type: "fees_pending" })}><StatsCard title="Pending Fees" value={`₹ ${data.totalPending}`} icon={<AlertCircle size={18} />} color="from-red-500 to-pink-600" /></div>
  <div onClick={() => setDetailModal({ open: true, type: "receipts" })}><StatsCard title="Print Receipts" value="🖨️" icon={<Receipt size={18} />} color="from-emerald-500 to-green-600" /></div>
</div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* LEFT — Insights (half width) */}
  <Insights data={data.insights} />

  {/* RIGHT — Today's Summary */}
  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
    <h3 className="text-lg font-bold text-slate-800 mb-3">📅 Today's Summary</h3>
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600">Total Students</span>
        <span className="text-sm font-bold text-slate-800">{data.totalStudents}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600">Total Classes</span>
        <span className="text-sm font-bold text-slate-800">{data.totalClasses}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600">Fees Collected</span>
        <span className="text-sm font-bold text-green-600">₹{data.totalPaid}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600">Pending Fees</span>
        <span className="text-sm font-bold text-red-500">₹{data.totalPending}</span>
      </div>
    </div>
  </div>
</div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={data.monthlyData} />
        <RecentPayments data={data.recentPayments} onViewAll={() => setDetailModal({ open: true, type: "recent_payments" })} />
      </div>

      <DefaultersList data={data.defaulters} onViewAll={() => setDetailModal({ open: true, type: "fees_pending" })} />

      {data.totalPending > 0 && (
        <div className="p-4 bg-red-100 text-red-600 rounded-xl shadow">
          ⚠️ Pending Fees: ₹ {data.totalPending}
        </div>
      )}

      {/* PLANS MODAL */}
      {showPlansModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Choose a Plan</h2>
              <button onClick={() => setShowPlansModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isFree = plan.price === 0;
                const isCurrentPlan = subscriptionInfo?.planName === plan.name;

                return (
                  <div key={plan.id} className={`rounded-2xl border-2 p-6 relative ${
                    isCurrentPlan
                      ? "border-green-500 bg-green-50"
                      : plan.isPopular
                      ? "border-primary-500 shadow-lg"
                      : "border-gray-200"
                  }`}>
                    {isCurrentPlan && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle size={12} /> Current Plan
                      </span>
                    )}
                    {!isCurrentPlan && plan.isPopular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs px-3 py-1 rounded-full">⭐ Popular</span>
                    )}
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    {plan.description && <p className="text-gray-500 text-sm mt-1">{plan.description}</p>}
                    <p className="text-3xl font-bold text-primary-600 mt-4">
                      {isFree ? "Free" : `₹${plan.price}`}
                    </p>
                    <p className="text-gray-500 text-sm">{plan.durationInDays} Days</p>
                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      <p>👨‍🎓 Students: <b>{plan.maxStudents}</b></p>
                      <p>👨‍🏫 Teachers: <b>{plan.maxTeachers}</b></p>
                      <p>👨‍💼 Admins: <b>{plan.maxAdmins}</b></p>
                      <p>💾 Storage: <b>{plan.maxStorageInGB} GB</b></p>
                    </div>
                    {plan.features?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {plan.features.map((f: string, i: number) => (
                          <span key={i} className="bg-primary-50 text-primary-600 text-xs px-2 py-0.5 rounded-full">{f}</span>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => !isCurrentPlan && buyPlan(plan.id)}
                      disabled={paymentLoading || isCurrentPlan}
                      className={`w-full mt-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                        isCurrentPlan
                          ? "bg-green-100 text-green-700 cursor-not-allowed"
                          : "bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50"
                      }`}
                    >
                      {isCurrentPlan ? (
                        <><CheckCircle size={16} /> Active Plan</>
                      ) : (
                        <><Zap size={16} /> {paymentLoading ? "Processing..." : "Buy & Activate"}</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 📋 DETAIL MODAL — shows list with print options */}
      <DashboardDetailModal
        isOpen={detailModal.open}
        type={detailModal.type}
        onClose={() => setDetailModal({ ...detailModal, open: false })}
      />

    </div>
  );
}

