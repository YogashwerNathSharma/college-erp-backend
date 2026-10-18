// ═══════════════════════════════════════════════════════════════════════════
// ENTERPRISE STUDENT DASHBOARD - WIDGET COMPONENTS
// React 19 + TypeScript + Tailwind CSS + Lucide Icons
// ═══════════════════════════════════════════════════════════════════════════

import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  Upload,
  Printer,
  Download,
  AlertTriangle,
  Cake,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  GraduationCap,
  IdCard,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface StatCardProps {
  icon: ReactNode;
  value: number | string;
  label: string;
  trend?: number;
  trendLabel?: string;
  color: "indigo" | "emerald" | "amber" | "rose" | "cyan" | "purple" | "orange" | "blue" | "pink" | "teal";
  onClick?: () => void;
  loading?: boolean;
  subtitle?: string;
}

export interface RecentStudentItem {
  id: string;
  name: string;
  admNo: string;
  class: string;
  date: string;
  photoUrl?: string;
}

export interface BirthdayStudentItem {
  id: string;
  name: string;
  class: string;
  section: string;
  photoUrl?: string;
  age: number;
}

export interface FeeDefaulterItem {
  id: string;
  name: string;
  class: string;
  pendingAmount: number;
}

export interface AttendanceOverviewData {
  totalStudents: number;
  totalPresent: number;
  absentCount: number;
  presentPercentage: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// COLOR MAP
// ═══════════════════════════════════════════════════════════════════════════

const colorMap: Record<string, { bg: string; icon: string; border: string; gradient: string }> = {
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    icon: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-100 dark:border-indigo-800/50",
    gradient: "from-indigo-500 to-indigo-600",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    icon: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-100 dark:border-emerald-800/50",
    gradient: "from-emerald-500 to-emerald-600",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    icon: "text-amber-600 dark:text-amber-400",
    border: "border-amber-100 dark:border-amber-800/50",
    gradient: "from-amber-500 to-amber-600",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-900/20",
    icon: "text-rose-600 dark:text-rose-400",
    border: "border-rose-100 dark:border-rose-800/50",
    gradient: "from-rose-500 to-rose-600",
  },
  cyan: {
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
    icon: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-100 dark:border-cyan-800/50",
    gradient: "from-cyan-500 to-cyan-600",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    icon: "text-purple-600 dark:text-purple-400",
    border: "border-purple-100 dark:border-purple-800/50",
    gradient: "from-purple-500 to-purple-600",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    icon: "text-orange-600 dark:text-orange-400",
    border: "border-orange-100 dark:border-orange-800/50",
    gradient: "from-orange-500 to-orange-600",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    icon: "text-blue-600 dark:text-blue-400",
    border: "border-blue-100 dark:border-blue-800/50",
    gradient: "from-blue-500 to-blue-600",
  },
  pink: {
    bg: "bg-pink-50 dark:bg-pink-900/20",
    icon: "text-pink-600 dark:text-pink-400",
    border: "border-pink-100 dark:border-pink-800/50",
    gradient: "from-pink-500 to-pink-600",
  },
  teal: {
    bg: "bg-teal-50 dark:bg-teal-900/20",
    icon: "text-teal-600 dark:text-teal-400",
    border: "border-teal-100 dark:border-teal-800/50",
    gradient: "from-teal-500 to-teal-600",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 1. STAT CARD (Enhanced with trend + animation)
// ═══════════════════════════════════════════════════════════════════════════

export function StatCard({ icon, value, label, trend, trendLabel, color, onClick, loading, subtitle }: StatCardProps) {
  const colors = colorMap[color] || colorMap.indigo;

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
      className={`group bg-white dark:bg-slate-900 rounded-xl border ${colors.border} p-5 hover:shadow-lg hover:shadow-slate-100/50 dark:hover:shadow-slate-800/30 transition-all duration-300 ${
        onClick ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]" : ""
      }`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {typeof value === "number" ? value.toLocaleString("en-IN") : value}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mt-1">
              {trend >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              )}
              <span
                className={`text-xs font-semibold ${
                  trend >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
              {trendLabel && (
                <span className="text-xs text-slate-400 dark:text-slate-500">{trendLabel}</span>
              )}
            </div>
          )}
          {subtitle && !trend && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center ${colors.icon} group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. EXPANDABLE STAT CARD (for Category/Class/Section breakdown)
// ═══════════════════════════════════════════════════════════════════════════

interface ExpandableStatCardProps {
  icon: ReactNode;
  label: string;
  total: number;
  items: { name: string; count: number }[];
  color: string;
}

export function ExpandableStatCard({ icon, label, total, items, color }: ExpandableStatCardProps) {
  const [expanded, setExpanded] = useState(false);
  const colors = colorMap[color] || colorMap.indigo;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border ${colors.border} overflow-hidden transition-all duration-300`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
        aria-expanded={expanded}
        aria-label={`${label}: ${total} total. Click to ${expanded ? "collapse" : "expand"} details.`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center ${colors.icon}`}>
            {icon}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {total.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {items.length} groups
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 border-t border-slate-100 dark:border-slate-700/50 pt-3 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <span className="text-sm text-slate-600 dark:text-slate-300">{item.name}</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                  {item.count.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. RECENT STUDENTS WIDGET
// ═══════════════════════════════════════════════════════════════════════════

interface RecentStudentsWidgetProps {
  students: RecentStudentItem[];
  onViewAll?: () => void;
  onStudentClick?: (id: string) => void;
}

export function RecentStudentsWidget({ students, onViewAll, onStudentClick }: RecentStudentsWidgetProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Recently Added</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Latest student enrollments</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full">
            {students.length} records
          </span>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Adm No
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {students.length > 0 ? (
              students.slice(0, 10).map((student, idx) => (
                <tr
                  key={student.id || idx}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => onStudentClick?.(student.id)}
                >
                  <td className="px-6 py-3 text-sm text-slate-400 dark:text-slate-500 tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {student.photoUrl ? (
                        <img
                          src={student.photoUrl}
                          alt={student.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-600"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {student.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      )}
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {student.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-sm text-slate-600 dark:text-slate-300 font-mono">
                      {student.admNo}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {student.class || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {student.date
                        ? new Date(student.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                  No recent admissions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. BIRTHDAY WIDGET
// ═══════════════════════════════════════════════════════════════════════════

interface BirthdayWidgetProps {
  students: BirthdayStudentItem[];
  onSendWishes?: (studentId: string) => void;
}

export function BirthdayWidget({ students, onSendWishes }: BirthdayWidgetProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <Cake className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Birthday Today</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{students.length} student{students.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {students.length > 0 && onSendWishes && (
          <button
            onClick={() => students.forEach((s) => onSendWishes(s.id))}
            className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            🎉 Send Wishes
          </button>
        )}
      </div>

      {students.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-100/50 dark:border-amber-800/30"
            >
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-200 dark:border-amber-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                  {student.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  🎂 {student.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {student.class} {student.section && `• ${student.section}`} • Turns {student.age}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Cake className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400 dark:text-slate-500">No birthdays today</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. QUICK ACTIONS WIDGET
// ═══════════════════════════════════════════════════════════════════════════

interface QuickAction {
  icon: ReactNode;
  label: string;
  description: string;
  color: string;
  path?: string;
  onClick?: () => void;
}

interface QuickActionsWidgetProps {
  actions?: QuickAction[];
}

export function QuickActionsWidget({ actions }: QuickActionsWidgetProps) {
  const navigate = useNavigate();

  const defaultActions: QuickAction[] = actions || [
    {
      icon: <UserPlus className="w-4 h-4" />,
      label: "New Admission",
      description: "Register a new student",
      color: "indigo",
      path: "/students/admission/new",
    },
    {
      icon: <GraduationCap className="w-4 h-4" />,
      label: "Quick Admission",
      description: "5-field fast entry",
      color: "emerald",
      path: "/students/quick-admission",
    },
    {
      icon: <Upload className="w-4 h-4" />,
      label: "Bulk Import",
      description: "Import from Excel/CSV",
      color: "cyan",
      path: "/students/import",
    },
    {
      icon: <FileSpreadsheet className="w-4 h-4" />,
      label: "Export Data",
      description: "Download student data",
      color: "amber",
      path: "/students/export",
    },
    {
      icon: <Printer className="w-4 h-4" />,
      label: "Print List",
      description: "Print student records",
      color: "purple",
      path: "/students/print",
    },
    {
      icon: <IdCard className="w-4 h-4" />,
      label: "ID Cards",
      description: "Generate identity cards",
      color: "orange",
      path: "/students/id-card",
    },
    {
      icon: <FileText className="w-4 h-4" />,
      label: "Certificates",
      description: "Generate certificates",
      color: "teal",
      path: "/students/certificates",
    },
    {
      icon: <Users className="w-4 h-4" />,
      label: "Reports",
      description: "Student reports",
      color: "rose",
      path: "/students/reports",
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Quick Actions</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Common student operations</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {defaultActions.map((action, idx) => {
          const colors = colorMap[action.color] || colorMap.indigo;
          return (
            <button
              key={idx}
              onClick={() => {
                if (action.onClick) action.onClick();
                else if (action.path) navigate(action.path);
              }}
              className="group flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-sm active:scale-[0.98] transition-all duration-200 text-left"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${colors.bg} ${colors.icon}`}
              >
                {action.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{action.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. FEE DEFAULTERS WIDGET
// ═══════════════════════════════════════════════════════════════════════════

interface FeeDefaultersWidgetProps {
  students: FeeDefaulterItem[];
  onViewAll?: () => void;
  onStudentClick?: (id: string) => void;
}

export function FeeDefaultersWidget({ students, onViewAll, onStudentClick }: FeeDefaultersWidgetProps) {
  const totalPending = students.reduce((sum, s) => sum + (s.pendingAmount || 0), 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Fee Defaulters</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total Pending: <span className="font-semibold text-rose-600 dark:text-rose-400">₹{totalPending.toLocaleString("en-IN")}</span>
            </p>
          </div>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
          >
            View All <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {students.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {students.slice(0, 8).map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              onClick={() => onStudentClick?.(student.id)}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {student.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{student.class}</p>
              </div>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap ml-3 tabular-nums">
                ₹{student.pendingAmount?.toLocaleString("en-IN") || 0}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <CreditCard className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400 dark:text-slate-500">No fee defaulters 🎉</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. ATTENDANCE OVERVIEW WIDGET
// ═══════════════════════════════════════════════════════════════════════════

interface AttendanceOverviewWidgetProps {
  data: AttendanceOverviewData | null;
}

export function AttendanceOverviewWidget({ data }: AttendanceOverviewWidgetProps) {
  if (!data) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Today's Attendance</h3>
        <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
          No attendance data for today
        </div>
      </div>
    );
  }

  const percentage = data.presentPercentage || 0;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Today's Attendance</h3>

      <div className="flex items-center justify-center mb-4">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="40"
              fill="none" stroke="#e2e8f0"
              strokeWidth="8"
              className="dark:stroke-slate-700"
            />
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke={percentage >= 80 ? "#10b981" : percentage >= 60 ? "#f59e0b" : "#ef4444"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{percentage}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <p className="text-lg font-bold text-slate-900 dark:text-white">{data.totalStudents}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
        </div>
        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/10">
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{data.totalPresent}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Present</p>
        </div>
        <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/10">
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{data.absentCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Absent</p>
        </div>
      </div>
    </div>
  );
}
