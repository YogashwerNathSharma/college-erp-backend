import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, X, Clock, ShieldAlert } from "lucide-react";
import { getFullUrl } from "../../utils/url";

/**
 * 🔔 Grace Period Warning Banner
 *
 * Shows a top-of-page warning when the tenant's subscription is about
 * to expire (≤7 days) or is already in the 7-day grace period.
 *
 * Behaviour:
 *  - > 7 days remaining  → hidden
 *  - 1-7 days remaining  → yellow "Expiring soon" banner
 *  - In grace period     → red "Expired — read-only" banner
 *  - Dismissible (session-scoped — comes back on next session)
 *  - Super Admin never sees it
 */

export default function GracePeriodBanner() {
  const [banner, setBanner] = useState<{
    show: boolean;
    type: "warning" | "danger";
    daysLeft: number;
    message: string;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem("grace_banner_dismissed")) {
      setDismissed(true);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    // Super Admin doesn't need this
    if (user?.role === "SUPER_ADMIN") return;

    fetchSubscriptionStatus(token);
  }, []);

  const fetchSubscriptionStatus = async (token: string) => {
    try {
      const res = await axios.get(getFullUrl("/api/tenant/my-subscription"), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });

      const sub = res.data?.data;
      if (!sub || !sub.endDate) return;

      const endDate = new Date(sub.endDate);
      const now = new Date();
      const diffMs = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 7) {
        // More than 7 days — no banner
        return;
      }

      if (diffDays > 0 && diffDays <= 7) {
        // Expiring soon
        setBanner({
          show: true,
          type: "warning",
          daysLeft: diffDays,
          message: `Your subscription expires in ${diffDays} day${diffDays === 1 ? "" : "s"}. Renew now to avoid interruption.`,
        });
      } else if (diffDays <= 0) {
        // Expired — check grace period (7 days after end)
        const graceDaysLeft = 7 + diffDays; // diffDays is negative
        if (graceDaysLeft > 0) {
          setBanner({
            show: true,
            type: "danger",
            daysLeft: graceDaysLeft,
            message: `Your subscription has expired. You have ${graceDaysLeft} day${graceDaysLeft === 1 ? "" : "s"} of grace period remaining. Read-only access only.`,
          });
        }
        // If graceDaysLeft <= 0, the subscriptionCheckMiddleware will redirect to /subscription-expired
      }
    } catch {
      // Fail silently — don't break the app for a banner
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("grace_banner_dismissed", "1");
  };

  if (!banner || !banner.show || dismissed) return null;

  const isWarning = banner.type === "warning";

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-medium shadow-md transition-all ${
        isWarning
          ? "bg-amber-50 dark:bg-amber-900/80 text-amber-800 dark:text-amber-100 border-b border-amber-200 dark:border-amber-700"
          : "bg-red-50 dark:bg-red-900/80 text-red-800 dark:text-red-100 border-b border-red-200 dark:border-red-700"
      }`}
      role="alert"
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {isWarning ? (
          <Clock size={18} className="text-amber-500 dark:text-amber-300 shrink-0" />
        ) : (
          <ShieldAlert size={18} className="text-red-500 dark:text-red-300 shrink-0" />
        )}
        <span className="truncate">{banner.message}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate("/subscriptions")}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
            isWarning
              ? "bg-amber-600 hover:bg-amber-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          Renew Now
        </button>
        <button
          onClick={handleDismiss}
          className={`p-1 rounded-md transition-colors ${
            isWarning
              ? "hover:bg-amber-200 dark:hover:bg-amber-800"
              : "hover:bg-red-200 dark:hover:bg-red-800"
          }`}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
