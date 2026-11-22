import { useEffect, useState } from "react";
import { Wrench, X } from "lucide-react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";

interface MaintenanceStatus {
  enabled: boolean;
  message: string;
  scheduledEnd: string | null;
  blockApp: boolean;
}

// Soft-maintenance banner: shown at the top of the app for ALL users while
// maintenance is enabled but NOT blocking (blockApp = false). The app keeps
// working; this is just a heads-up notice.
//
// When blockApp = true, App-level routing shows the full MaintenancePage
// instead, so this banner intentionally renders nothing in that case.
export default function MaintenanceBanner() {
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data } = await axios.get(getFullUrl("/api/maintenance-status"));
        if (active) setStatus(data || null);
      } catch {
        if (active) setStatus(null);
      }
    };
    load();
    const timer = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  // Only show in SOFT mode (enabled + not blocking).
  if (!status || !status.enabled || status.blockApp || dismissed) return null;

  const endText = status.scheduledEnd
    ? new Date(status.scheduledEnd).toLocaleString()
    : null;

  return (
    <div className="w-full bg-amber-500 text-white text-sm px-4 py-2 flex items-center justify-center gap-3 relative">
      <Wrench className="w-4 h-4 flex-shrink-0" />
      <span className="font-medium">
        {status.message || "System is under maintenance"}
        {endText ? ` — expected back by ${endText}` : ""}. Sorry for the inconvenience.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-amber-600/60"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
