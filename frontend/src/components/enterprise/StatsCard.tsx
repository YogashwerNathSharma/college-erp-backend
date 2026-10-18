import { TrendingUp, TrendingDown } from "lucide-react";

// ═══════════════════════════════════════════════════
// STATS CARD - Enterprise Dashboard
// ═══════════════════════════════════════════════════

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number; // percentage change
  trendLabel?: string;
  color?: "indigo" | "emerald" | "amber" | "rose" | "cyan" | "purple" | "orange" | "blue";
  loading?: boolean;
  subtitle?: string;
  onClick?: () => void;
};

const colorMap = {
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    icon: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-100 dark:border-indigo-800/50",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    icon: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-100 dark:border-emerald-800/50",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    icon: "text-amber-600 dark:text-amber-400",
    border: "border-amber-100 dark:border-amber-800/50",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-900/20",
    icon: "text-rose-600 dark:text-rose-400",
    border: "border-rose-100 dark:border-rose-800/50",
  },
  cyan: {
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
    icon: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-100 dark:border-cyan-800/50",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    icon: "text-purple-600 dark:text-purple-400",
    border: "border-purple-100 dark:border-purple-800/50",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    icon: "text-orange-600 dark:text-orange-400",
    border: "border-orange-100 dark:border-orange-800/50",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    icon: "text-blue-600 dark:text-blue-400",
    border: "border-blue-100 dark:border-blue-800/50",
  },
};

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color = "indigo",
  loading = false,
  subtitle,
  onClick,
}: StatsCardProps) {
  const colors = colorMap[color];

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
            <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-16" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />
          </div>
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl border ${colors.border} p-5 hover:shadow-md transition-all duration-200 ${
        onClick ? "cursor-pointer hover:scale-[1.02]" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mt-1">
              {trend >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              )}
              <span className={`text-xs font-medium ${trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {trend > 0 ? "+" : ""}{trend}%
              </span>
              {trendLabel && <span className="text-xs text-slate-400 dark:text-slate-500">{trendLabel}</span>}
            </div>
          )}
          {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center ${colors.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MINI STAT CARD (for inline grids)
// ═══════════════════════════════════════════════════

export function MiniStat({ label, value, icon, color = "indigo" }: { label: string; value: string | number; icon: React.ReactNode; color?: keyof typeof colorMap }) {
  const colors = colorMap[color];
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center ${colors.icon}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
