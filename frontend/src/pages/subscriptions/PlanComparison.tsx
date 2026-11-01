import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle, XCircle, Crown, Zap, Star, Rocket,
  ArrowLeft, Users, UserCog, Database, Clock, Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { getFullUrl } from "../../utils/url";

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

// Static feature comparison matrix
const FEATURE_MATRIX: { label: string; free: boolean; basic: boolean; pro: boolean; enterprise: boolean }[] = [
  { label: "Student Management", free: true, basic: true, pro: true, enterprise: true },
  { label: "Teacher Management", free: true, basic: true, pro: true, enterprise: true },
  { label: "Attendance Tracking", free: true, basic: true, pro: true, enterprise: true },
  { label: "Fee Collection", free: false, basic: true, pro: true, enterprise: true },
  { label: "Exam & Report Cards", free: false, basic: true, pro: true, enterprise: true },
  { label: "Transport Module", free: false, basic: false, pro: true, enterprise: true },
  { label: "Library Module", free: false, basic: false, pro: true, enterprise: true },
  { label: "Hostel Module", free: false, basic: false, pro: true, enterprise: true },
  { label: "HR & Payroll", free: false, basic: false, pro: true, enterprise: true },
  { label: "Communication (SMS/Email)", free: false, basic: false, pro: true, enterprise: true },
  { label: "Certificate Generator", free: false, basic: true, pro: true, enterprise: true },
  { label: "Custom Reports", free: false, basic: false, pro: true, enterprise: true },
  { label: "Inventory Management", free: false, basic: false, pro: false, enterprise: true },
  { label: "Workflow Engine", free: false, basic: false, pro: false, enterprise: true },
  { label: "API Access", free: false, basic: false, pro: false, enterprise: true },
  { label: "Priority Support", free: false, basic: false, pro: true, enterprise: true },
  { label: "White-label Branding", free: false, basic: false, pro: false, enterprise: true },
];

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Shield size={24} />,
  basic: <Star size={24} />,
  pro: <Zap size={24} />,
  enterprise: <Rocket size={24} />,
};

const PLAN_GRADIENTS: Record<string, string> = {
  free: "from-gray-500 to-gray-600",
  basic: "from-blue-500 to-indigo-600",
  pro: "from-purple-500 to-pink-600",
  enterprise: "from-amber-500 to-orange-600",
};

function getPlanTier(plan: Plan): string {
  const name = plan.name.toLowerCase();
  if (name.includes("free") || name.includes("trial")) return "free";
  if (name.includes("basic") || name.includes("starter")) return "basic";
  if (name.includes("pro") || name.includes("premium") || name.includes("standard")) return "pro";
  return "enterprise";
}

export default function PlanComparison() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const tenant = JSON.parse(localStorage.getItem("tenant") || "{}");

  useEffect(() => {
    fetchPlans();
    fetchCurrentPlan();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/subscriptions/plans"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlans(res.data?.data || []);
    } catch {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPlan = async () => {
    try {
      if (!tenant?.id) return;
      const res = await axios.get(
        getFullUrl(`/api/subscriptions/tenant/${tenant.id}`),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const sub = res.data?.data;
      if (sub?.planId) setCurrentPlanId(sub.planId);
    } catch {
      // No active subscription
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Crown size={24} className="text-amber-500" /> Choose Your Plan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Compare features and pick the best plan for your institution
          </p>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {plans.map((plan) => {
          const tier = getPlanTier(plan);
          const isCurrent = plan.id === currentPlanId;
          const gradient = PLAN_GRADIENTS[tier] || PLAN_GRADIENTS.basic;
          const icon = PLAN_ICONS[tier] || PLAN_ICONS.basic;

          return (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-slate-800 rounded-2xl border-2 overflow-hidden transition-all hover:shadow-xl ${
                isCurrent
                  ? "border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800"
                  : "border-gray-100 dark:border-slate-700"
              }`}
            >
              {isCurrent && (
                <div className="absolute top-3 right-3 bg-indigo-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase">
                  Current Plan
                </div>
              )}

              {/* Gradient Header */}
              <div className={`bg-gradient-to-r ${gradient} p-5 text-white`}>
                <div className="flex items-center gap-2 mb-2">
                  {icon}
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">
                    {plan.price === 0 ? "Free" : `₹${plan.price.toLocaleString("en-IN")}`}
                  </span>
                  <span className="text-sm opacity-80">/ {plan.durationInDays} days</span>
                </div>
              </div>

              {/* Limits */}
              <div className="p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Users size={14} className="text-blue-500 shrink-0" />
                  <span>{plan.maxStudents.toLocaleString()} Students</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <UserCog size={14} className="text-green-500 shrink-0" />
                  <span>{plan.maxTeachers} Teachers</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Database size={14} className="text-purple-500 shrink-0" />
                  <span>{plan.maxStorageInGB} GB Storage</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Clock size={14} className="text-amber-500 shrink-0" />
                  <span>{plan.durationInDays} Days Validity</span>
                </div>

                {/* Features */}
                {plan.features && plan.features.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex flex-wrap gap-1">
                      {plan.features.slice(0, 5).map((f, i) => (
                        <span
                          key={i}
                          className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-[10px] px-2 py-0.5 rounded-full"
                        >
                          {f}
                        </span>
                      ))}
                      {plan.features.length > 5 && (
                        <span className="text-[10px] text-gray-400">+{plan.features.length - 5} more</span>
                      )}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={() => navigate(isCurrent ? "/subscriptions" : "/subscription-expired")}
                  className={`w-full mt-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    isCurrent
                      ? "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {isCurrent ? "Current Plan" : plan.price === 0 ? "Start Free Trial" : "Upgrade Now"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Feature Comparison</h2>
          <p className="text-xs text-gray-400 mt-0.5">See what's included in each plan</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-700/50">
                <th className="text-left px-6 py-3 font-semibold text-gray-600 dark:text-gray-300">Feature</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500">Free</th>
                <th className="text-center px-4 py-3 font-semibold text-blue-600">Basic</th>
                <th className="text-center px-4 py-3 font-semibold text-purple-600">Pro</th>
                <th className="text-center px-4 py-3 font-semibold text-amber-600">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_MATRIX.map((row, i) => (
                <tr
                  key={i}
                  className={`border-t border-gray-100 dark:border-slate-700 ${
                    i % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-slate-700/20"
                  }`}
                >
                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{row.label}</td>
                  {(["free", "basic", "pro", "enterprise"] as const).map((tier) => (
                    <td key={tier} className="text-center px-4 py-3">
                      {row[tier] ? (
                        <CheckCircle size={18} className="text-green-500 mx-auto" />
                      ) : (
                        <XCircle size={18} className="text-gray-300 dark:text-gray-600 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 text-center pb-6">
        <p className="text-gray-400 text-sm mb-3">
          Need a custom plan for your institution? Contact us.
        </p>
        <a
          href="mailto:support@rmsacademy.in"
          className="text-indigo-600 dark:text-indigo-400 font-medium text-sm hover:underline"
        >
          support@rmsacademy.in
        </a>
      </div>
    </div>
  );
}
