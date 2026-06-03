import { useEffect, useState } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import {
  Users, School, IndianRupee, AlertCircle,
  CreditCard, Crown, Clock, Zap,
} from "lucide-react";

import StatsCard from "../components/dashboard/StatsCard";
import RevenueChart from "../components/dashboard/RevenueChart";
import RecentPayments from "../components/dashboard/RecentPayments";
import DefaultersList from "../components/dashboard/DefaultersList";
import Insights from "../components/dashboard/Insights";

 
export default function Dashboard() {
 console.log("TENANT DASHBOARD RENDERED");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { setTenant }: any = useOutletContext();

  const [data, setData] = useState<any>({
    totalStudents: 0, totalClasses: 0, totalPaid: 0,
    totalPending: 0, monthlyData: [], recentPayments: [],
    defaulters: [], insights: {},
  });

  // 🔥 NEW — Subscription states
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Dashboard data
        const res = await axios.get("http://localhost:5000/api/dashboard", { headers });
        const d = res.data?.data;
        console.log("DASHBOARD RESPONSE =>", d);

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

        // Tenant data
console.log("FULL API RESPONSE =>", d);
console.log("TENANT FROM API =>", d?.tenant);
console.log("FULL API RESPONSE =>", d);
console.log("TENANT FROM API =>", d?.tenant);

console.log("ADDRESS =>", d?.tenant?.address);
console.log("PHONE =>", d?.tenant?.phone);
console.log("EMAIL =>", d?.tenant?.email);

const tenantData = {
  name: d?.tenant?.name || "",
  schoolName: d?.tenant?.schoolName || d?.tenant?.name || "",
  type: d?.tenant?.type || "",

  logoUrl: d?.tenant?.logoUrl
    ? d.tenant.logoUrl
    : d?.tenant?.logo
    ? d.tenant.logo.startsWith("http")
      ? d.tenant.logo
      : `http://localhost:5000/${d.tenant.logo}`
    : null,

  address: d?.tenant?.address || "",
  phone: d?.tenant?.phone || "",
  email: d?.tenant?.email || "",
};

setTenant(tenantData);

localStorage.setItem(
  "tenant",
  JSON.stringify(tenantData)
);

console.log("TENANT DATA SAVED =>", tenantData);

        // 🔥 NEW — Fetch subscription info
        try {
          const subRes = await axios.get(
            "http://localhost:5000/api/tenant/my-subscription",
            { headers }
          );
          console.log("SUBSCRIPTION INFO =>", subRes.data);
          setSubscriptionInfo(subRes.data.data);
        } catch (subErr) {
          console.log("No active subscription:", subErr);
        }

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

  // 🔥 NEW — Fetch plans for modal
  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/tenant/plans", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlans(res.data.data || []);
      setShowPlansModal(true);
    } catch (err) {
      console.error("Fetch plans error:", err);
    }
  };

  // 🔥 NEW — Buy plan
  const buyPlan = async (planId: string) => {
    try {
      setPaymentLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.post(
        "http://localhost:5000/api/tenant/self-subscribe",
        { planId },
        { headers }
      );

      const { order, subscriptionId } = res.data.data;

      const options = {
        key: "rzp_test_SufLEYxZg1RUP2",
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
              "http://localhost:5000/api/subscription-payments/verify",
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
      alert("❌ " + (error.response?.data?.message || "Something went wrong"));
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome, <b>{user?.name}</b> ({user?.role})
        </p>
      </div>

      {/* ============================================ */}
      {/* 📋 SUBSCRIPTION INFO CARD — NEW */}
      {/* ============================================ */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-indigo-800 flex items-center gap-2">
            <CreditCard size={22} />
            Subscription
          </h2>
          <button
            onClick={fetchPlans}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <Crown size={16} />
            {subscriptionInfo ? "Upgrade / Renew" : "View Plans"}
          </button>
        </div>

        {subscriptionInfo ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">Current Plan</p>
                <p className="text-lg font-bold text-slate-800">{subscriptionInfo.planName}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">Amount Paid</p>
                <p className="text-lg font-bold text-green-600">₹{subscriptionInfo.amount}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500 flex items-center gap-1"><Clock size={14} /> Days Left</p>
                <p className={`text-lg font-bold ${subscriptionInfo.daysRemaining <= 5 ? "text-red-500" : "text-indigo-600"}`}>
                  {subscriptionInfo.daysRemaining} Days
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">Valid Till</p>
                <p className="text-lg font-bold text-slate-800">
                  {new Date(subscriptionInfo.endDate).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
              <span>👨🎓 Students: <b>{subscriptionInfo.maxStudents}</b></span>
              <span>👨🏫 Teachers: <b>{subscriptionInfo.maxTeachers}</b></span>
              <span>👨💼 Admins: <b>{subscriptionInfo.maxAdmins}</b></span>
              <span>💾 Storage: <b>{subscriptionInfo.maxStorageInGB} GB</b></span>
            </div>

            {subscriptionInfo.daysRemaining <= 5 && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
                <AlertCircle size={16} />
                Your plan expires in {subscriptionInfo.daysRemaining} days! Renew now.
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 text-lg">No active subscription</p>
            <p className="text-gray-400 text-sm mt-1">Choose a plan to unlock all features</p>
          </div>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Students" value={data.totalStudents} icon={<Users />} color="from-indigo-500 to-purple-600" />
        <StatsCard title="Classes" value={data.totalClasses} icon={<School />} color="from-teal-500 to-cyan-600" />
        <StatsCard title="Fees Collected" value={`₹ ${data.totalPaid}`} icon={<IndianRupee />} color="from-yellow-500 to-orange-500" growth={data?.insights?.growth} />
        <StatsCard title="Pending Fees" value={`₹ ${data.totalPending}`} icon={<AlertCircle />} color="from-red-500 to-pink-600" />
      </div>

      <Insights data={data.insights} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={data.monthlyData} />
        <RecentPayments data={data.recentPayments} />
      </div>

      <DefaultersList data={data.defaulters} />

      {data.totalPending > 0 && (
        <div className="p-4 bg-red-100 text-red-600 rounded-xl shadow">
          ⚠️ Pending Fees: ₹ {data.totalPending}
        </div>
      )}

      {/* ============================================ */}
      {/* 🛒 PLANS MODAL — NEW */}
      {/* ============================================ */}
      {showPlansModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Choose a Plan</h2>
              <button onClick={() => setShowPlansModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className={`rounded-2xl border-2 p-6 relative ${plan.isPopular ? "border-indigo-500 shadow-lg" : "border-gray-200"}`}>
                  {plan.isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">⭐ Popular</span>
                  )}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  {plan.description && <p className="text-gray-500 text-sm mt-1">{plan.description}</p>}
                  <p className="text-3xl font-bold text-indigo-600 mt-4">₹{plan.price}</p>
                  <p className="text-gray-500 text-sm">{plan.durationInDays} Days</p>
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p>👨🎓 Students: <b>{plan.maxStudents}</b></p>
                    <p>👨🏫 Teachers: <b>{plan.maxTeachers}</b></p>
                    <p>👨💼 Admins: <b>{plan.maxAdmins}</b></p>
                    <p>💾 Storage: <b>{plan.maxStorageInGB} GB</b></p>
                  </div>
                  {plan.features?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {plan.features.map((f: string, i: number) => (
                        <span key={i} className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full">{f}</span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => buyPlan(plan.id)}
                    disabled={paymentLoading}
                    className="w-full mt-5 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Zap size={16} />
                    {paymentLoading ? "Processing..." : "Buy & Activate"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}