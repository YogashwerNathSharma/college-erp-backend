// ═══════════════════════════════════════════════════
// CHART CARD - Enterprise wrapper for Recharts
// ═══════════════════════════════════════════════════

type ChartCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  height?: string;
  loading?: boolean;
};

export default function ChartCard({ title, subtitle, children, actions, height = "h-72", loading = false }: ChartCardProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-6" />
        <div className="flex items-end gap-2 h-48">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t"
              style={{ height: `${Math.random() * 80 + 20}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className={height}>{children}</div>
    </div>
  );
}
