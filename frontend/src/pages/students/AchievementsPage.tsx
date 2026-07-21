import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Award,
  Plus,
  Pencil,
  Trash2,
  X,
  Trophy,
  Music,
  Dumbbell,
  Star,
  Upload,
  Calendar,
  User,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { PageHeader, LoadingSkeleton, EmptyState, ConfirmDialog, StatusBadge } from "../../components/enterprise";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type Achievement = {
  _id: string;
  title: string;
  category: "academic" | "sports" | "cultural" | "extracurricular";
  description: string;
  date: string;
  awardedBy: string;
  certificateUrl?: string;
};

type AchievementForm = {
  title: string;
  category: Achievement["category"];
  description: string;
  date: string;
  awardedBy: string;
  certificate: File | null;
};

const CATEGORIES: { key: Achievement["category"]; label: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
  { key: "academic", label: "Academic", icon: <Trophy className="w-5 h-5" />, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  { key: "sports", label: "Sports", icon: <Dumbbell className="w-5 h-5" />, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  { key: "cultural", label: "Cultural", icon: <Music className="w-5 h-5" />, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  { key: "extracurricular", label: "Extracurricular", icon: <Star className="w-5 h-5" />, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" },
];

const EMPTY_FORM: AchievementForm = {
  title: "",
  category: "academic",
  description: "",
  date: new Date().toISOString().split("T")[0],
  awardedBy: "",
  certificate: null,
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function AchievementsPage() {
  const { id } = useParams<{ id: string }>();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AchievementForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const authHeaders = {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  };

  // ─── Load Data ───────────────────────────────────────────────

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/students/${id}/achievements`, authHeaders);
      setAchievements(response.data.achievements || response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load achievements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchAchievements();
  }, [id]);

  // ─── CRUD ────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (achievement: Achievement) => {
    setEditingId(achievement._id);
    setForm({
      title: achievement.title,
      category: achievement.category,
      description: achievement.description,
      date: achievement.date?.split("T")[0] || "",
      awardedBy: achievement.awardedBy,
      certificate: null,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("category", form.category);
      formData.append("description", form.description);
      formData.append("date", form.date);
      formData.append("awardedBy", form.awardedBy);
      if (form.certificate) {
        formData.append("certificate", form.certificate);
      }

      if (editingId) {
        const response = await axios.put(
          `/api/students/${id}/achievements/${editingId}`,
          formData,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "multipart/form-data" } }
        );
        setAchievements((prev) =>
          prev.map((a) => (a._id === editingId ? response.data : a))
        );
        toast.success("Achievement updated");
      } else {
        const response = await axios.post(
          `/api/students/${id}/achievements`,
          formData,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "multipart/form-data" } }
        );
        setAchievements((prev) => [response.data, ...prev]);
        toast.success("Achievement added");
      }
      setShowModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/students/${id}/achievements/${deleteId}`, authHeaders);
      setAchievements((prev) => prev.filter((a) => a._id !== deleteId));
      toast.success("Achievement deleted");
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // ─── Filter ──────────────────────────────────────────────────

  const filtered = achievements.filter(
    (a) => filterCategory === "all" || a.category === filterCategory
  );

  const getCategoryConfig = (category: Achievement["category"]) =>
    CATEGORIES.find((c) => c.key === category) || CATEGORIES[0];

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <LoadingSkeleton variant="card" count={6} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Achievements"
        subtitle="Track awards, recognitions, and accomplishments"
        icon={<Award className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Students", path: "/students" },
          { label: "Profile", path: `/students/${id}` },
          { label: "Achievements" },
        ]}
        actions={
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Achievement
          </button>
        }
      />

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            filterCategory === "all"
              ? "bg-indigo-600 text-white"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          All ({achievements.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = achievements.filter((a) => a.category === cat.key).length;
          return (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filterCategory === cat.key
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {cat.icon}
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Achievement Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No achievements found"
          description={filterCategory === "all" ? "Add the first achievement for this student" : `No ${filterCategory} achievements recorded`}
          icon={<Award className="w-8 h-8" />}
          action={
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Achievement
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((achievement) => {
            const catConfig = getCategoryConfig(achievement.category);
            return (
              <div
                key={achievement._id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${catConfig.bgColor} flex items-center justify-center ${catConfig.color}`}>
                    {catConfig.icon}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(achievement)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(achievement._id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  {achievement.title}
                </h4>

                {/* Category Badge */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${catConfig.bgColor} ${catConfig.color} mb-2`}>
                  {catConfig.label}
                </span>

                {/* Description */}
                {achievement.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                    {achievement.description}
                  </p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-auto pt-3 border-t border-slate-100 dark:border-slate-700/50">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(achievement.date).toLocaleDateString()}
                  </span>
                  {achievement.awardedBy && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {achievement.awardedBy}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {editingId ? "Edit Achievement" : "Add Achievement"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Achievement title"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Achievement["category"] })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the achievement"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Awarded By
                  </label>
                  <input
                    type="text"
                    value={form.awardedBy}
                    onChange={(e) => setForm({ ...form, awardedBy: e.target.value })}
                    placeholder="Person/Organization"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Certificate (optional)
                </label>
                <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {form.certificate ? form.certificate.name : "Choose file"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setForm({ ...form, certificate: e.target.files?.[0] || null })}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Achievement"
        message="Are you sure you want to delete this achievement? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
