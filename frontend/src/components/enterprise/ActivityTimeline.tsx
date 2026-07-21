// ═══════════════════════════════════════════════════
// ACTIVITY TIMELINE - Enterprise
// ═══════════════════════════════════════════════════

type TimelineItem = {
  id: string;
  action: string;
  description?: string;
  user?: string;
  timestamp: string;
  type?: "create" | "update" | "delete" | "login" | "system" | "payment";
  icon?: React.ReactNode;
};

type ActivityTimelineProps = {
  items: TimelineItem[];
  title?: string;
  maxItems?: number;
  loading?: boolean;
};

const typeColors: Record<string, string> = {
  create: "bg-emerald-500",
  update: "bg-blue-500",
  delete: "bg-red-500",
  login: "bg-purple-500",
  system: "bg-slate-500",
  payment: "bg-amber-500",
};

export default function ActivityTimeline({ items, title = "Recent Activity", maxItems = 10, loading = false }: ActivityTimelineProps) {
  const displayed = items.slice(0, maxItems);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-6 animate-pulse" />
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-48" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-5">{title}</h3>

      {displayed.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No recent activity</p>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="space-y-4">
            {displayed.map((item) => (
              <div key={item.id} className="flex gap-3 relative">
                {/* Dot */}
                <div className={`w-2.5 h-2.5 mt-1.5 rounded-full flex-shrink-0 ${typeColors[item.type || "system"]} ring-2 ring-white dark:ring-slate-900`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">{item.action}</span>
                    {item.description && <span className="text-slate-500 dark:text-slate-400"> — {item.description}</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.user && <span className="text-xs text-slate-500 dark:text-slate-400">{item.user}</span>}
                    <span className="text-xs text-slate-400 dark:text-slate-500">{item.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
