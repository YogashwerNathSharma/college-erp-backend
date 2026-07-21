import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Clock,
  GraduationCap,
  ArrowUpCircle,
  Award,
  AlertTriangle,
  Heart,
  FileText,
  Plus,
  Filter,
  Calendar,
  X,
  User,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { PageHeader, LoadingSkeleton, EmptyState } from "../../components/enterprise";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type TimelineEntry = {
  _id: string;
  type: "admission" | "promotion" | "achievement" | "disciplinary" | "medical" | "document";
  title: string;
  description: string;
  date: string;
  createdBy: string;
  metadata?: Record<string, any>;
};

type AddEntryForm = {
  type: TimelineEntry["type"];
  title: string;
  description: string;
  date: string;
};

const EVENT_TYPES: { key: TimelineEntry["type"]; label: string; color: string; bgColor: string; icon: React.ReactNode }[] = [
  { key: "admission", label: "Admission", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/30", icon: <GraduationCap className="w-4 h-4" /> },
  { key: "promotion", label: "Promotion", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30", icon: <ArrowUpCircle className="w-4 h-4" /> },
  { key: "achievement", label: "Achievement", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30", icon: <Award className="w-4 h-4" /> },
  { key: "disciplinary", label: "Disciplinary", color: "text-red-600 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30", icon: <AlertTriangle className="w-4 h-4" /> },
  { key: "medical", label: "Medical", color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/30", icon: <Heart className="w-4 h-4" /> },
  { key: "document", label: "Document", color: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-200 dark:bg-slate-700", icon: <FileText className="w-4 h-4" /> },
];

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function StudentTimeline() {
  const { id } = useParams<{ id: string }>();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AddEntryForm>({
    type: "admission",
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const authHeaders = {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  };

  // ─── Load Data ───────────────────────────────────────────────

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/students/${id}/timeline`, authHeaders);
      setEntries(response.data.timeline || response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTimeline();
  }, [id]);

  // ─── Filter ──────────────────────────────────────────────────

  const filteredEntries = entries.filter((entry) => {
    if (filterType !== "all" && entry.type !== filterType) return false;
    if (dateFrom && new Date(entry.date) < new Date(dateFrom)) return false;
    if (dateTo && new Date(entry.date) > new Date(dateTo)) return false;
    return true;
  });

  // ─── Add Entry ───────────────────────────────────────────────

  const handleAddEntry = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const response = await axios.post(
        `/api/students/${id}/timeline`,
        form,
        authHeaders
      );
      setEntries((prev) => [response.data, ...prev]);
      setShowAddModal(false);
      setForm({ type: "admission", title: "", description: "", date: new Date().toISOString().split("T")[0] });
      toast.success("Timeline entry added");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add entry");
    } finally {
      setSaving(false);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────

  const getEventConfig = (type: TimelineEntry["type"]) =>
    EVENT_TYPES.find((e) => e.key === type) || EVENT_TYPES[5];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <LoadingSkeleton variant="list" count={5} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Student Timeline"
        subtitle="Complete history of events and milestones"
        icon={<Clock className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Students", path: "/students" },
          { label: "Profile", path: `/students/${id}` },
          { label: "Timeline" },
        ]}
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter:</span>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Types</option>
            {EVENT_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              placeholder="From"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              placeholder="To"
            />
          </div>

          {(filterType !== "all" || dateFrom || dateTo) && (
            <button
              onClick={() => { setFilterType("all"); setDateFrom(""); setDateTo(""); }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      {filteredEntries.length === 0 ? (
        <EmptyState
          title="No timeline entries"
          description="This student has no recorded events matching the current filters."
          icon={<Clock className="w-8 h-8" />}
          action={
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Entry
            </button>
          }
        />
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

          <div className="space-y-6">
            {filteredEntries.map((entry) => {
              const config = getEventConfig(entry.type);
              return (
                <div key={entry._id} className="relative flex gap-4 pl-2">
                  {/* Icon */}
                  <div
                    className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgColor} ${config.color} ring-4 ring-white dark:ring-slate-950`}
                  >
                    {config.icon}
                  </div>

                  {/* Content Card */}
                  <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {entry.title}
                        </h4>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${config.bgColor} ${config.color}`}
                        >
                          {config.label}
                        </span>
                      </div>
                      <time className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                        {formatDate(entry.date)}
                      </time>
                    </div>

                    {entry.description && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        {entry.description}
                      </p>
                    )}

                    {entry.createdBy && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                        <User className="w-3 h-3" />
                        <span>{entry.createdBy}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Add Timeline Entry
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as TimelineEntry["type"] })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Enter description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEntry}
                disabled={saving}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
