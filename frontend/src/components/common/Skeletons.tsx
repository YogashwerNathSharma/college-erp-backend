/**
 * 🦴 Reusable Skeleton Loaders
 *
 * All components use Tailwind `animate-pulse` and are dark-mode compatible.
 * Import individually:
 *   import { TableSkeleton, CardSkeleton } from "../components/common/Skeletons";
 */

// ── tiny helpers ─────────────────────────────────────────────
const Bar = ({ className = "" }: { className?: string }) => (
  <div className={`rounded bg-slate-200 dark:bg-slate-700 animate-pulse ${className}`} />
);

const Circle = ({ size = "w-10 h-10" }: { size?: string }) => (
  <div className={`rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse ${size}`} />
);

// ── TableSkeleton ────────────────────────────────────────────
export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      {/* header */}
      <div className="grid gap-4 px-4 py-3 bg-slate-100 dark:bg-slate-800" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Bar key={i} className="h-3 w-3/4" />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-4 px-4 py-3 border-t border-slate-100 dark:border-slate-800"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Bar key={c} className={`h-3 ${c === 0 ? "w-full" : "w-2/3"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── CardSkeleton ─────────────────────────────────────────────
export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <Circle size="w-9 h-9" />
            <Bar className="h-3 w-20" />
          </div>
          <Bar className="h-7 w-1/2" />
          <Bar className="h-2 w-3/4" />
        </div>
      ))}
    </div>
  );
}

// ── ListSkeleton ─────────────────────────────────────────────
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
        >
          <Circle size="w-8 h-8" />
          <div className="flex-1 space-y-1.5">
            <Bar className="h-3 w-2/3" />
            <Bar className="h-2 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── FormSkeleton ─────────────────────────────────────────────
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-5 max-w-xl">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Bar className="h-3 w-24" />
          <Bar className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Bar className="h-10 w-32 rounded-lg mt-4" />
    </div>
  );
}

// ── ChartSkeleton ────────────────────────────────────────────
export function ChartSkeleton({ height = "h-48" }: { height?: string }) {
  return (
    <div
      className={`w-full ${height} rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 flex items-end gap-2 overflow-hidden`}
    >
      {[40, 65, 50, 80, 55, 70, 45, 60, 75, 50, 85, 55].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-slate-200 dark:bg-slate-700 animate-pulse"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

// ── ProfileSkeleton ──────────────────────────────────────────
export function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <Circle size="w-20 h-20" />
      <Bar className="h-4 w-40" />
      <Bar className="h-3 w-28" />
      <div className="w-full max-w-sm space-y-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Bar className="h-3 w-24" />
            <Bar className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── DashboardSkeleton (composite) ────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <Bar className="h-6 w-56 mb-2" />
      <CardSkeleton count={6} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <TableSkeleton rows={4} cols={5} />
    </div>
  );
}
