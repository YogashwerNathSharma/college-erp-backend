import { useEffect, useState } from "react";
import { Wrench, Clock } from "lucide-react";
import { getFullUrl } from "../utils/url";
import axios from "axios";

// Full-screen maintenance page shown when HARD maintenance (blockApp) is active
// for non super-admin users.
export default function MaintenancePage() {
  const [message, setMessage] = useState("System is under maintenance");
  const [scheduledEnd, setScheduledEnd] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data } = await axios.get(getFullUrl("/api/maintenance-status"));
        if (!active) return;
        if (data?.message) setMessage(data.message);
        setScheduledEnd(data?.scheduledEnd || null);
        // If maintenance got turned off or downgraded to soft, leave this page.
        if (data && (data.enabled !== true || data.blockApp !== true)) {
          window.location.href = "/";
        }
      } catch {
        // ignore - keep showing the page
      }
    };
    load();
    // Re-check every 30s so users return automatically once maintenance ends.
    const timer = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const endText = scheduledEnd
    ? new Date(scheduledEnd).toLocaleString()
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
        <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-5">
          <Wrench className="w-10 h-10 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          We&apos;ll be back soon
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{message}</p>
        {endText && (
          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4" />
            Expected back by: {endText}
          </div>
        )}
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-6">
          Sorry for the inconvenience. Please try again later.
        </p>
      </div>
    </div>
  );
}
