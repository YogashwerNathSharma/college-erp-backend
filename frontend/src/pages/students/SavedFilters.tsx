import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Bookmark,
  Plus,
  Trash2,
  Star,
  Edit3,
  Play,
  Share2,
  Filter,
  X,
  Loader2,
  Check,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { PageHeader, ConfirmDialog, LoadingSkeleton, EmptyState } from "../../components/enterprise";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, string>;
  isDefault: boolean;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

function authHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
}

// Format filter key for display
function formatFilterKey(key: string): string {
  const map: Record<string, string> = {
    classId: "Class",
    sectionId: "Section",
    academicYearId: "Academic Year",
    status: "Status",
    gender: "Gender",
    category: "Category",
    religion: "Religion",
    bloodGroup: "Blood Group",
    search: "Search Term",
    transport: "Transport",
    hostel: "Hostel",
  };
  return map[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

export default function SavedFilters() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  // ─── Load Filters ──────────────────────────────────────────
  useEffect(() => {
    const fetchFilters = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/students/search/saved-filters`, authHeaders());
        setFilters(res.data.data || []);
      } catch (err: any) {
        toast.error("Failed to load saved filters");
      } finally {
        setLoading(false);
      }
    };
    fetchFilters();
  }, []);

  // ─── Apply Filter ──────────────────────────────────────────
  const applyFilter = (filter: SavedFilter) => {
    const params = new URLSearchParams(filter.filters);
    navigate(`/students?${params.toString()}`);
    toast.success(`Filter "${filter.name}" applied`);
  };

  // ─── Set as Default ────────────────────────────────────────
  const toggleDefault = async (id: string) => {
    try {
      // Remove default from all others
      const updated = filters.map((f) => ({
        ...f,
        isDefault: f.id === id ? !f.isDefault : false,
      }));
      setFilters(updated);

      await axios.put(
        `${API_BASE_URL}/api/students/search/saved-filters/${id}/default`,
        {},
        authHeaders()
      );
      toast.success("Default filter updated");
    } catch (err: any) {
      toast.error("Failed to update default");
    }
  };

  // ─── Rename Filter ─────────────────────────────────────────
  const handleRename = async (id: string) => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/students/search/saved-filters/${id}`,
        { name: editName.trim() },
        authHeaders()
      );
      setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, name: editName.trim() } : f)));
      setEditingId(null);
      toast.success("Filter renamed");
    } catch (err: any) {
      toast.error("Failed to rename");
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete Filter ─────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/students/search/saved-filters/${id}`, authHeaders());
      setFilters((prev) => prev.filter((f) => f.id !== id));
      toast.success("Filter deleted");
    } catch (err: any) {
      toast.error("Failed to delete");
    } finally {
      setDeleteConfirm(null);
    }
  };

  // ─── Share Filter ──────────────────────────────────────────
  const handleShare = (filter: SavedFilter) => {
    const params = new URLSearchParams(filter.filters);
    const url = `${window.location.origin}/students?${params.toString()}`;
    navigator.clipboard.writeText(url);
    toast.success("Filter URL copied to clipboard!");
  };

  // ─── Loading ───────────────────────────────────────────────
  if (loading) {
    return <div className="p-6"><LoadingSkeleton variant="list" count={5} /></div>;
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Saved Filters"
        subtitle="Manage your saved student filter presets"
        icon={<Bookmark className="w-6 h-6" />}
        actions={
          <button
            onClick={() => navigate("/students")}
            className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium"
          >
            <Filter className="w-4 h-4" />
            Go to Student List
          </button>
        }
      />

      <div className="mt-6">
        {filters.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <EmptyState
              icon={<Bookmark className="w-12 h-12" />}
              title="No Saved Filters"
              description="Save filter presets from the Student List page to quickly apply them later"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filters.map((filter) => (
              <div
                key={filter.id}
                className={`bg-white dark:bg-slate-800 rounded-xl border ${filter.isDefault ? "border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-200 dark:ring-indigo-800" : "border-slate-200 dark:border-slate-700"} p-4 hover:shadow-sm transition-shadow`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Name & Filters */}
                  <div className="flex-1 min-w-0">
                    {editingId === filter.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleRename(filter.id); if (e.key === "Escape") setEditingId(null); }}
                          className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 flex-1"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRename(filter.id)}
                          disabled={saving}
                          className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">{filter.name}</h4>
                        {filter.isDefault && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                            <Star className="w-3 h-3" /> Default
                          </span>
                        )}
                      </div>
                    )}

                    {/* Filter Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(filter.filters).map(([key, value]) => (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        >
                          <span className="font-medium">{formatFilterKey(key)}:</span> {value}
                        </span>
                      ))}
                    </div>

                    {/* Meta */}
                    <p className="text-xs text-slate-400 mt-2">
                      Created: {new Date(filter.createdAt).toLocaleDateString("en-IN")} •{" "}
                      {Object.keys(filter.filters).length} filter(s)
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Apply */}
                    <button
                      onClick={() => applyFilter(filter)}
                      className="p-2 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                      title="Apply Filter"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    {/* Star/Default */}
                    <button
                      onClick={() => toggleDefault(filter.id)}
                      className={`p-2 rounded-lg transition-colors ${filter.isDefault ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20" : "text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"}`}
                      title={filter.isDefault ? "Remove Default" : "Set as Default"}
                    >
                      <Star className={`w-4 h-4 ${filter.isDefault ? "fill-current" : ""}`} />
                    </button>
                    {/* Rename */}
                    <button
                      onClick={() => { setEditingId(filter.id); setEditName(filter.name); }}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="Rename"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {/* Share */}
                    <button
                      onClick={() => handleShare(filter)}
                      className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                      title="Copy Share Link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => setDeleteConfirm(filter.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tip */}
        <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
          <p className="text-sm text-indigo-700 dark:text-indigo-400">
            💡 <strong>Tip:</strong> To save a new filter, go to the{" "}
            <button onClick={() => navigate("/students")} className="underline font-medium">Student List</button>{" "}
            page, apply your desired filters, then click "Save Filter" in the search panel.
          </p>
        </div>
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <ConfirmDialog
          open={!!deleteConfirm}
          title="Delete Saved Filter"
          message="Are you sure you want to delete this saved filter? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
