import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

// ═══════════════════════════════════════════════════
// PAGE HEADER WITH BREADCRUMBS
// ═══════════════════════════════════════════════════

type Breadcrumb = {
  label: string;
  path?: string;
};

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: { label: string; color?: "green" | "amber" | "red" | "blue" | "purple" };
};

export default function PageHeader({ title, subtitle, breadcrumbs = [], actions, icon, badge }: PageHeaderProps) {
  const badgeColors = {
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  };

  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm mb-3">
          <Link to="/super-admin" className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <Home className="w-4 h-4" />
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
              {crumb.path ? (
                <Link to={crumb.path} className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-700 dark:text-slate-200 font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
              {badge && (
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badgeColors[badge.color || "blue"]}`}>
                  {badge.label}
                </span>
              )}
            </div>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
