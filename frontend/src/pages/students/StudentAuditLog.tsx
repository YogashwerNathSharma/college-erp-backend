import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  History,
  Filter,
  Download,
  ChevronDown,
  ChevronRight,
  User,
  Edit,
  Trash2,
  Plus,
  ArrowUpCircle,
  Shield,
  Clock,
  Calendar,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { PageHeader, LoadingSkeleton, EmptyState } from "../../components/enterprise";
import { getFullUrl } from "../../utils/url";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  module: string;
  previousData: string | null;
  newData: string | null;
  performedBy: string;
  performedByName: string;
  ipAddress: string;
  createdAt: string;
  details: string;
}

interface StudentHeader {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  photoUrl: string | null;
  enrollments: { class: { name: string }; section: { name: string } }[];
}

type ActionType = "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "PROMOTE" | "RESTORE" | "";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  STATUS_CHANGE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PROMOTE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  RESTORE: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

const ACTION_ICONS: Record<string, typeof Plus> = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  STATUS_CHANGE: Shield,
  PROMOTE: ArrowUpCircle,
  RESTORE: History,
};

function authHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function StudentAuditLog() {
  const { id: studentId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const [student, setStudent] = useState<StudentHeader | null>(null);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [filterAction, setFilterAction] = useState<ActionType>("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ─── Load Data ─────────────────────────────────────────────
  useEffect(() => {
    if (!studentId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [studentRes, auditRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/students/${studentId}`, authHeaders()),
          axios.get(`${API_BASE_URL}/api/students/operations/${studentId}/audit-log`, {
            ...authHeaders(),
            params: {
              action: filterAction || undefined,
              dateFrom: filterDateFrom || undefined,
              dateTo: filterDateTo || undefined,
            },
          }),
        ]);
        setStudent(studentRes.data.data);
        setLogs(auditRes.data.data || []);
      } catch (err: any) {
        toast.error("Failed to load audit log");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId, filterAction, filterDateFrom, filterDateTo]);

  // ─── Parse Diff ────────────────────────────────────────────
  const parseDiff = (prev: string | null, next: string | null): { field: string; oldVal: string; newVal: string }[] => {
    try {
      const prevObj = prev ? JSON.parse(prev) : {};
      const nextObj = next ? JSON.parse(next) : {};
      const diffs: { field: string; oldVal: string; newVal: string }[] = [];

      const allKeys = new Set([...Object.keys(prevObj), ...Object.keys(nextObj)]);
      allKeys.forEach((key) => {
        const oldVal = prevObj[key];
        const newVal = nextObj[key];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          diffs.push({
            field: key,
            oldVal: oldVal !== undefined ? String(oldVal) : "—",
            newVal: newVal !== undefined ? String(newVal) : "—",
          });
        }
      });
      return diffs;
    } catch {
      return [];
    }
  };

  // ─── Export ────────────────────────────────────────────────
  const handleExport = () => {
    const csv = [
      ["Date", "Action", "Performed By", "Details", "IP"].join(","),
      ...logs.map((l) =>
        [
          new Date(l.createdAt).toLocaleString("en-IN"),
          l.action,
          l.performedByName || l.performedBy,
          `"${l.details || ""}"`,
          l.ipAddress || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit_log_${student?.admissionNo || studentId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported");
  };

  // ─── Loading ───────────────────────────────────────────────
  if (loading) {
    return <div className="p-6"><LoadingSkeleton variant="list" count={8} /></div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Audit Log"
        subtitle="Complete change history for this student"
        icon={<History className="w-6 h-6" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        }
      />

      {/* Student Header */}
      {student && (
        <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
          {student.photoUrl ? (
            <img src={getFullUrl(student.photoUrl)} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {student.firstName[0]}{student.lastName[0]}
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{student.firstName} {student.lastName}</p>
            <p className="text-sm text-slate-500">{student.admissionNo} | {student.enrollments?.[0]?.class?.name || ""} - {student.enrollments?.[0]?.section?.name || ""}</p>
          </div>
          <div className="ml-auto">
            <span className="text-sm text-slate-400">{logs.length} entries</span>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Action Type</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value as ActionType)}
                className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="STATUS_CHANGE">Status Change</option>
                <option value="PROMOTE">Promote</option>
                <option value="RESTORE">Restore</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <button
              onClick={() => { setFilterAction(""); setFilterDateFrom(""); setFilterDateTo(""); }}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="mt-6">
        {logs.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <EmptyState
              icon={<History className="w-12 h-12" />}
              title="No Audit Entries"
              description="No changes recorded for this student yet"
            />
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, idx) => {
              const IconComp = ACTION_ICONS[log.action] || Clock;
              const isExpanded = expandedId === log.id;
              const diffs = isExpanded ? parseDiff(log.previousData, log.newData) : [];

              return (
                <div key={log.id} className="relative">
                  {/* Timeline Line */}
                  {idx < logs.length - 1 && (
                    <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                  )}

                  {/* Entry */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 ml-0">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${ACTION_COLORS[log.action] || "bg-slate-100 text-slate-600"}`}>
                        <IconComp className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ACTION_COLORS[log.action] || ""}`}>
                              {log.action}
                            </span>
                            {log.details && (
                              <span className="text-sm text-slate-700 dark:text-slate-300">{log.details}</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.createdAt).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.performedByName || log.performedBy || "System"}
                          </span>
                          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                        </div>

                        {/* Expand/Collapse for diff */}
                        {(log.previousData || log.newData) && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                            className="mt-2 flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium"
                          >
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            {isExpanded ? "Hide Changes" : "View Changes"}
                          </button>
                        )}

                        {/* Diff Table */}
                        {isExpanded && diffs.length > 0 && (
                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                              <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                  <th className="px-3 py-2 text-left font-medium text-slate-500">Field</th>
                                  <th className="px-3 py-2 text-left font-medium text-red-500">Old Value</th>
                                  <th className="px-3 py-2 text-left font-medium text-green-500">New Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {diffs.map((diff, i) => (
                                  <tr key={i}>
                                    <td className="px-3 py-1.5 font-medium text-slate-700 dark:text-slate-300">{diff.field}</td>
                                    <td className="px-3 py-1.5 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10">{diff.oldVal}</td>
                                    <td className="px-3 py-1.5 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10">{diff.newVal}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {isExpanded && diffs.length === 0 && (log.previousData || log.newData) && (
                          <p className="mt-2 text-xs text-slate-400 italic">No detailed diff available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
