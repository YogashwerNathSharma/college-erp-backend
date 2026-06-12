

import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CreditCard, CheckCircle, Clock, Crown, Ban } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Plan {
  id: string;
  name: string;
  price: number;
  durationInDays: number;
  maxStudents: number;
  maxTeachers: number;
  maxAdmins: number;
  maxStorageInGB: number;
  features: string[];
  isActive: boolean;
}

// 🔥 Device Fingerprint Generator
const getDeviceFingerprint = (): string => {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx?.fillText("fingerprint", 10, 10);
    const canvasData = canvas.toDataURL();

    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || "unknown",
      canvasData.slice(0, 50),
    ].join("|");

    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return "FP-" + Math.abs(hash).toString(36);
  } catch {
    return "FP-unknown";
  }
};

export default function SubscriptionExpired() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [usedFreeTrial, setUsedFreeTrial] = useState(false);
  const navigate = useNavigate();

  const tenant = JSON.parse(localStorage.getItem("tenant") || "{}");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // 🔥 FIX: Auth headers — har API call me token bhejna zaroori
  const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "X-Device-Fingerprint": getDeviceFingerprint(),
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchPlans();
    checkFreeTrialUsed();
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = () => {
    if (document.getElementById("razorpay-script")) return;
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  };

  // 🔥 FIX: Better free trial check — check via tenant subscription API
  const checkFreeTrialUsed = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/subscriptions/tenant/${tenant.id}`,
        { headers: getHeaders() }
      );
      const subscription = res.data?.data;

      // If any subscription exists (active or expired), free trial was used
      if (subscription) {
        setUsedFreeTrial(true);
      }
    } catch (error) {
      // If 404 = no subscription, free trial NOT used
      // If other error = assume used (safer)
      const status = (error as any)?.response?.status;
      if (status !== 404) {
        setUsedFreeTrial(true);
      }
    }
  };

  // 🔥 FIX: Token included in fetchPlans
  const fetchPlans = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/subscriptions/plans",
        { headers: getHeaders() }
      );
      setPlans(res.data?.data || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FIX: Complete subscribe flow with auth + fraud data
  const handleSubscribe = async (planId: string) => {
    try {
      setPaying(true);
      setSelectedPlan(planId);

      const selectedPlanData = plans.find((p) => p.id === planId);

      // Client-side check (backend will also verify)
      if (selectedPlanData && selectedPlanData.price === 0 && usedFreeTrial) {
        toast.error("You have already used your Free Trial. Please choose a paid plan.");
        return;
      }

      if (selectedPlanData && selectedPlanData.price === 0) {
        //////////////////////////////////////////////////
        // 🔥 FREE PLAN — Use self-subscribe endpoint
        // Backend will do STRICT fraud check (email, phone, IP, device, name+address)
        //////////////////////////////////////////////////

        const res = await axios.post(
          "http://localhost:5000/api/tenant/self-subscribe",
          {
            planId,
            deviceFingerprint: getDeviceFingerprint(),
          },
          { headers: getHeaders() }
        );

        if (res.data.success) {
          toast.success("Free Trial activated! 🎉 Redirecting...");
          localStorage.removeItem("subscriptionExpired");
          setTimeout(() => {
            navigate("/dashboard");
          }, 1500);
        }

      } else {
        //////////////////////////////////////////////////
        // 💰 PAID PLAN — Razorpay flow via self-subscribe
        //////////////////////////////////////////////////

        const res = await axios.post(
          "http://localhost:5000/api/tenant/self-subscribe",
          { planId },
          { headers: getHeaders() }
        );

        const { order, subscriptionId } = res.data.data;

        if (!order) {
          toast.error("Failed to create payment order");
          return;
        }

        // Open Razorpay checkout
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SufLEYxZg1RUP2",
          amount: order.amount,
          currency: order.currency,
          name: tenant.name || "School ERP",
          description: `${selectedPlanData?.name || "Plan"} - ${selectedPlanData?.durationInDays || ""} Days`,
          order_id: order.id,
          handler: async (response: any) => {
            try {
              await axios.post(
                "http://localhost:5000/api/subscription-payments/verify",
                {
                  subscriptionId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                },
                { headers: getHeaders() }
              );

              toast.success("Payment successful! 🎉 Redirecting...");
              localStorage.removeItem("subscriptionExpired");

              setTimeout(() => {
                navigate("/dashboard");
              }, 1500);

            } catch (verifyErr: any) {
              toast.error(verifyErr?.response?.data?.message || "Payment verification failed");
            }
          },
          prefill: {
            email: user?.email || "",
            name: user?.name || "",
          },
          theme: {
            color: "#4F46E5",
          },
          modal: {
            ondismiss: () => {
              setPaying(false);
              setSelectedPlan("");
              toast.error("Payment cancelled");
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }

    } catch (error: any) {
      console.error("Subscribe error:", error);
      toast.error(
        error?.response?.data?.message ||
        "Something went wrong. Please try a paid plan."
      );
    } finally {
      setPaying(false);
      setSelectedPlan("");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Check if a plan is free
  const isFreePlan = (plan: Plan) => plan.price === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">
      <Toaster position="top-right" />

      {/* Top Bar */}
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Crown className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">{tenant.name || "School ERP"}</h1>
            <p className="text-xs text-gray-500">Subscription Management</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-500 font-medium transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">

        {/* Warning Banner */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-lg w-full text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-red-700 mb-2">Subscription Expired</h2>
          <p className="text-red-600 text-sm">
            Your school's subscription has expired. Please renew to continue using the ERP system.
            All your data is safe and will be accessible after renewal.
          </p>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3"></div>
            <p className="text-gray-500">Loading plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">No plans available. Contact support.</p>
            <p className="text-gray-400 text-sm mt-2">Email: support@schoolerp.com</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
            {plans.map((plan, index) => {
              const isFree = isFreePlan(plan);
              const isDisabled = isFree && usedFreeTrial;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl shadow-lg border-2 p-6 transition-all ${
                    isDisabled
                      ? "opacity-60 border-gray-200"
                      : "hover:shadow-xl hover:-translate-y-1"
                  } ${
                    !isDisabled && index === 1
                      ? "border-indigo-500 ring-2 ring-indigo-200"
                      : !isDisabled
                      ? "border-gray-100"
                      : ""
                  }`}
                >
                  {/* Popular badge */}
                  {index === 1 && !isDisabled && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-4 py-1 rounded-full font-medium">
                      Most Popular
                    </div>
                  )}

                  {/* 🔥 Not eligible badge for free plan */}
                  {isDisabled && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-4 py-1 rounded-full font-medium">
                      Not Eligible
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-gray-800 mb-1">{plan.name}</h3>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold text-indigo-600">
                      {plan.price === 0 ? "Free" : `₹${plan.price}`}
                    </span>
                    <span className="text-gray-400 text-sm">/ {plan.durationInDays} days</span>
                  </div>

                  {/* 🔥 Not eligible message */}
                  {isDisabled && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                      <Ban size={16} className="text-red-500 shrink-0" />
                      <p className="text-red-600 text-xs font-medium">
                        You have already used your Free Trial. Please choose a paid plan.
                      </p>
                    </div>
                  )}

                  {/* Limits */}
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 shrink-0" />
                      <span>{plan.maxStudents} Students</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 shrink-0" />
                      <span>{plan.maxTeachers} Teachers</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 shrink-0" />
                      <span>{plan.maxAdmins} Admins</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 shrink-0" />
                      <span>{plan.maxStorageInGB} GB Storage</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} className="text-blue-500 shrink-0" />
                      <span>{plan.durationInDays} Days Validity</span>
                    </div>
                  </div>

                  {/* Features */}
                  {plan.features && plan.features.length > 0 && (
                    <div className="border-t pt-3 mb-5">
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Features</p>
                      <div className="flex flex-wrap gap-1.5">
                        {plan.features.map((f, i) => (
                          <span
                            key={i}
                            className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subscribe Button */}
                  <button
                    onClick={() => !isDisabled && handleSubscribe(plan.id)}
                    disabled={paying || isDisabled}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      isDisabled
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : index === 1
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-gray-100 text-gray-700 hover:bg-indigo-600 hover:text-white"
                    } ${paying && selectedPlan === plan.id ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isDisabled ? (
                      <>
                        <Ban size={16} />
                        Not Applicable
                      </>
                    ) : (
                      <>
                        <CreditCard size={16} />
                        {paying && selectedPlan === plan.id ? "Processing..." : "Subscribe Now"}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-10 text-center">
          <p className="text-gray-400 text-sm">
            Need help? Contact us at{" "}
            <a href="mailto:support@schoolerp.com" className="text-indigo-600 font-medium">
              support@schoolerp.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

