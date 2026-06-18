import { useEffect, useState } from "react";
import axios from "axios";
import { CreditCard, Crown, Clock, Gift, GraduationCap, Users, ShieldCheck, HardDrive } from "lucide-react";

export default function SubscriptionSettings() {
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [showPlans, setShowPlans] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [subRes, usageRes] = await Promise.all([
        axios.get("http://localhost:5000/api/tenant/my-subscription", { headers }),
        axios.get("http://localhost:5000/api/tenant/usage", { headers }),
      ]);

      setSubscriptionInfo(subRes.data.data);
      setUsage(usageRes.data.data);
    } catch (err) {
      console.log("Settings fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/tenant/plans", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlans(res.data.data || []);
      setShowPlans(true);
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
        prefill: { name: user?.name || "User", email: user?.email || "" },
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
            setShowPlans(false);
            fetchData();
          } catch (err) {
            alert("❌ Payment verification failed");
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      alert("❌ " + (error.response?.data?.message || "Payment failed"));
    } finally {
      setPaymentLoading(false);
    }
  };

  const isFreePlan = subscriptionInfo?.amount === 0;

  if (loading) return <div className="p-6 text-gray-500">Loading...</div>;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-800">Subscription & Billing</h1>

      {/* ━━━━━ CURRENT PLAN CARD ━━━━━ */}
      <div className={`rounded-2xl border p-6 shadow-sm ${
        isFreePlan
          ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
          : "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200"
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <CreditCard size={22} /> Current Plan
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
            {isFreePlan && (
              <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-xl flex items-center gap-3">
                <Gift className="text-green-600" size={20} />
                <div>
                  <p className="text-green-800 font-bold text-sm">🎉 Free Trial Active</p>
                  <p className="text-green-600 text-xs">{subscriptionInfo.daysRemaining} days remaining</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">Plan</p>
                <p className="text-lg font-bold text-slate-800">{subscriptionInfo.planName}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-lg font-bold text-green-600">
                  {subscriptionInfo.amount === 0 ? "Free" : `₹${subscriptionInfo.amount}`}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500 flex items-center gap-1"><Clock size={14} /> Days Left</p>
                <p className={`text-lg font-bold ${subscriptionInfo.daysRemaining <= 5 ? "text-red-500" : "text-indigo-600"}`}>
                  {subscriptionInfo.daysRemaining}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">Valid Till</p>
                <p className="text-lg font-bold text-slate-800">
                  {new Date(subscriptionInfo.endDate).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>

            {/* Limits */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
              <span>👨‍🎓 Students: <b>{subscriptionInfo.maxStudents}</b></span>
              <span>👨‍🏫 Teachers: <b>{subscriptionInfo.maxTeachers}</b></span>
              <span>👨‍💼 Admins: <b>{subscriptionInfo.maxAdmins}</b></span>
              <span>💾 Storage: <b>{subscriptionInfo.maxStorageInGB} GB</b></span>
            </div>
          </>
        ) : (
          <p className="text-slate-500">No active subscription. Choose a plan to get started.</p>
        )}
      </div>

      {/* ━━━━━ USAGE CARD ━━━━━ */}
      {usage && (
        <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
          <h3 className="text-lg font-bold text-slate-800 mb-4">📊 Resource Usage</h3>
          <div className="space-y-4">
            {[
              { label: "Students", icon: <GraduationCap size={18} />, ...usage.students, suffix: "" },
              { label: "Teachers", icon: <Users size={18} />, ...usage.teachers, suffix: "" },
              { label: "Admins", icon: <ShieldCheck size={18} />, ...usage.admins, suffix: "" },
              { label: "Storage", icon: <HardDrive size={18} />, ...usage.storage, suffix: "GB" },
            ].map((item) => {
              const pct = item.max > 0 ? Math.min(100, Math.round((item.current / item.max) * 100)) : 0;
              const barColor = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-indigo-500";

              return (
                <div key={item.label}>
                  <div className="flex justify-between mb-1">
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      {item.icon} {item.label}
                    </span>
                    <span className={`text-sm font-semibold ${pct >= 100 ? "text-red-600" : "text-slate-600"}`}>
                      {item.current}{item.suffix} / {item.max}{item.suffix}
                      {pct >= 100 && " ⚠️"}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ━━━━━ PLANS MODAL ━━━━━ */}
      {showPlans && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Choose a Plan</h2>
              <button onClick={() => setShowPlans(false)} className="text-slate-400 hover:text-slate-700 text-2xl">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isCurrent = subscriptionInfo?.planName === plan.name;
                return (
                  <div key={plan.id} className={`border rounded-2xl p-6 relative ${
                    isCurrent ? "border-green-400 bg-green-50" : "border-slate-200"
                  }`}>
                    {isCurrent && (
                      <span className="absolute -top-3 left-4 bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                        ✅ Current Plan
                      </span>
                    )}
                    {plan.isPopular && !isCurrent && (
                      <span className="absolute -top-3 left-4 bg-amber-500 text-white text-xs px-3 py-1 rounded-full">
                        ⭐ Popular
                      </span>
                    )}

                    <h3 className="text-lg font-bold mt-2">{plan.name}</h3>
                    <p className="text-sm text-slate-500">{plan.description}</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-3">
                      {plan.price === 0 ? "Free" : `₹${plan.price}`}
                    </p>
                    <p className="text-sm text-slate-400">{plan.durationInDays} Days</p>

                    <div className="mt-4 space-y-1 text-sm text-slate-600">
                      <p>👨‍🎓 Students: {plan.maxStudents}</p>
                      <p>👨‍🏫 Teachers: {plan.maxTeachers}</p>
                      <p>👨‍💼 Admins: {plan.maxAdmins}</p>
                      <p>💾 Storage: {plan.maxStorageInGB} GB</p>
                    </div>

                    {plan.features?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {plan.features.map((f: string, i: number) => (
                          <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}

                    {!isCurrent && (
                      <button
                        onClick={() => buyPlan(plan.id)}
                        disabled={paymentLoading}
                        className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold text-sm"
                      >
                        ⚡ Buy & Activate
                      </button>
                    )}
                    {isCurrent && (
                      <p className="mt-4 text-center text-green-600 font-semibold text-sm">✅ Active Plan</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}