// ═══════════════════════════════════════════════════
// LOADING SKELETON - Enterprise
// ═══════════════════════════════════════════════════

type LoadingSkeletonProps = {
  variant?: "card" | "table" | "chart" | "stats" | "list";
  count?: number;
};

function SkeletonCard() {
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

function SkeletonChart() {
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

function SkeletonTable() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32" />
          <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded w-64" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 py-4 px-6 border-b border-slate-100 dark:border-slate-700/50">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-10" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32" />
          </div>
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

export default function LoadingSkeleton({ variant = "card", count = 4 }: LoadingSkeletonProps) {
  switch (variant) {
    case "stats":
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      );
    case "chart":
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: count }).map((_, i) => <SkeletonChart key={i} />)}
        </div>
      );
    case "table":
      return <SkeletonTable />;
    case "list":
      return <SkeletonList />;
    default:
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      );
  }
}
