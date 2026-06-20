
import { useEffect, useState } from "react";
import axios from "axios";
import { Users, GraduationCap, ShieldCheck, HardDrive } from "lucide-react";

interface UsageData {
  students: { current: number; max: number };
  teachers: { current: number; max: number };
  admins: { current: number; max: number };
  storage: { current: number; max: number };
}

export default function UsageCard() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/tenant/usage", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsage(res.data.data);
      } catch (err) {
        console.log("Usage fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-100 rounded"></div>
          <div className="h-4 bg-slate-100 rounded"></div>
          <div className="h-4 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!usage) return null;

  const items = [
    {
      label: "Students",
      icon: <GraduationCap size={18} />,
      current: usage.students.current,
      max: usage.students.max,
      color: "indigo",
    },
    {
      label: "Teachers",
      icon: <Users size={18} />,
      current: usage.teachers.current,
      max: usage.teachers.max,
      color: "emerald",
    },
    {
      label: "Admins",
      icon: <ShieldCheck size={18} />,
      current: usage.admins.current,
      max: usage.admins.max,
      color: "amber",
    },
    {
      label: "Storage",
      icon: <HardDrive size={18} />,
      current: usage.storage.current,
      max: usage.storage.max,
      color: "purple",
      suffix: "GB",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        📊 Plan Usage
      </h3>

      <div className="space-y-4">
        {items.map((item) => {
          const percentage = item.max > 0
            ? Math.min(100, Math.round((item.current / item.max) * 100))
            : 0;

          const isNearLimit = percentage >= 80;
          const isAtLimit = percentage >= 100;

          // Color based on usage level
          let barColor = "bg-primary-500";
          if (isAtLimit) barColor = "bg-red-500";
          else if (isNearLimit) barColor = "bg-amber-500";
          else if (item.color === "emerald") barColor = "bg-emerald-500";
          else if (item.color === "amber") barColor = "bg-amber-500";
          else if (item.color === "purple") barColor = "bg-purple-500";

          return (
            <div key={item.label}>
              {/* Label + Count */}
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  {item.icon} {item.label}
                </span>
                <span className={`text-sm font-semibold ${
                  isAtLimit ? "text-red-600" : isNearLimit ? "text-amber-600" : "text-slate-600"
                }`}>
                  {item.current}{item.suffix || ""} / {item.max}{item.suffix || ""}
                  {isAtLimit && " ⚠️"}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

              {/* Warning Messages */}
              {isAtLimit && (
                <p className="text-xs text-red-500 mt-1 font-medium">
                  ⚠️ Limit reached! Upgrade to add more.
                </p>
              )}
              {isNearLimit && !isAtLimit && (
                <p className="text-xs text-amber-500 mt-1">
                  ⚡ Almost at limit ({100 - percentage}% remaining)
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">
          Limits are based on your current subscription plan
        </p>
      </div>
    </div>
  );
}

