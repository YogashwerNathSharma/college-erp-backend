// ═══════════════════════════════════════════════════
// STATUS BADGE - Enterprise
// ═══════════════════════════════════════════════════

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "purple";

type StatusBadgeProps = {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
  size?: "sm" | "md";
};

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  neutral: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

const dotStyles: Record<BadgeVariant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-slate-400",
  purple: "bg-purple-500",
};

export default function StatusBadge({ label, variant = "neutral", dot = true, size = "sm" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${variantStyles[variant]} ${
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />}
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════
// HELPER: Map common statuses to badge variants
// ═══════════════════════════════════════════════════

export function getStatusVariant(status: string): BadgeVariant {
  const s = status.toLowerCase();
  if (["active", "online", "healthy", "paid", "completed", "enabled", "success"].includes(s)) return "success";
  if (["pending", "trial", "expiring", "warning", "processing"].includes(s)) return "warning";
  if (["inactive", "expired", "suspended", "failed", "error", "disabled", "offline"].includes(s)) return "danger";
  if (["new", "processing", "in_progress"].includes(s)) return "info";
  if (["premium", "enterprise", "pro"].includes(s)) return "purple";
  return "neutral";
}
