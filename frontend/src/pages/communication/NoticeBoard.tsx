import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Bell,
  Plus,
  Filter,
  Search,
  Edit2,
  Trash2,
  X,
  Paperclip,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  FileText,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type NoticeType = "GENERAL" | "ACADEMIC" | "EXAM" | "FEE";
type Audience = "ALL" | "STUDENTS" | "TEACHERS" | "PARENTS";

interface Notice {
  id: string;
  title: string;
  content: string;
  type: NoticeType;
  audience: Audience;
  isImportant: boolean;
  publishDate: string;
  expiryDate?: string;
  publishedBy: string;
  attachments: string[];
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const NOTICE_TYPES: NoticeType[] = ["GENERAL", "ACADEMIC", "EXAM", "FEE"];
const AUDIENCES: Audience[] = ["ALL", "STUDENTS", "TEACHERS", "PARENTS"];

const TYPE_COLORS: Record<NoticeType, string> = {
  GENERAL: "bg-blue-50 text-blue-700 border-blue-200",
  ACADEMIC: "bg-purple-50 text-purple-700 border-purple-200",
  EXAM: "bg-amber-50 text-amber-700 border-amber-200",
  FEE: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const AUDIENCE_COLORS: Record<Audience, string> = {
  ALL: "bg-gray-100 text-gray-700",
  STUDENTS: "bg-indigo-100 text-indigo-700",
  TEACHERS: "bg-teal-100 text-teal-700",
  PARENTS: "bg-rose-100 text-rose-700",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// ─── Toast Component ─────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
        type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
      }`}>
        {type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={14} /></button>
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function NoticeSkeleton() {
  return (
    <div className="bg-white rounded-xl border p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-48 bg-gray-200 rounded" />
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-3/4 bg-gray-100 rounded" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-20 bg-gray-100 rounded" />
            <div className="h-5 w-24 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function NoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<NoticeType | "">("");
  const [filterAudience, setFilterAudience] = useState<Audience | "">("");
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ─── Fetch Notices ─────────────────────────────────────────────────────────
  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterType) params.type = filterType;
      if (filterAudience) params.audience = filterAudience;
      if (searchQuery) params.search = searchQuery;

      const res = await axios.get("/api/communication-new/notices", { headers, params });
      setNotices(res.data.data || []);
    } catch {
      setToast({ message: "Failed to load notices", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [filterType, filterAudience, searchQuery]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // ─── Delete Notice ─────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/communication-new/notices/${id}`, { headers });
      setNotices((prev) => prev.filter((n) => n.id !== id));
      setToast({ message: "Notice deleted successfully", type: "success" });
    } catch {
      setToast({ message: "Failed to delete notice", type: "error" });
    }
    setDeleteConfirm(null);
  };

  // ─── Edit Handler ──────────────────────────────────────────────────────────
  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setShowForm(true);
  };

  // ─── Filter notices client-side by search ──────────────────────────────────
  const displayedNotices = notices.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container space-y-6">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Bell className="text-indigo-600" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notice Board</h1>
            <p className="text-sm text-gray-500">Manage and publish notices for your institution</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingNotice(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
        >
          <Plus size={18} />
          Create Notice
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notices..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as NoticeType | "")}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">All Types</option>
              {NOTICE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Audience Filter */}
          <select
            value={filterAudience}
            onChange={(e) => setFilterAudience(e.target.value as Audience | "")}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Audiences</option>
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notice List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <NoticeSkeleton key={i} />)}
        </div>
      ) : displayedNotices.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No notices found</h3>
          <p className="text-sm text-gray-500 mt-1">Create your first notice to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedNotices.map((notice) => (
            <div
              key={notice.id}
              className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow ${
                notice.isImportant ? "border-l-4 border-l-red-500" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-base">{notice.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${TYPE_COLORS[notice.type]}`}>
                      {notice.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${AUDIENCE_COLORS[notice.audience]}`}>
                      {notice.audience}
                    </span>
                    {notice.isImportant && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                        ⚠ Important
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{notice.content}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(notice.publishDate || notice.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {notice.publishedBy || "Admin"}
                    </span>
                    {notice.attachments?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Paperclip size={12} />
                        {notice.attachments.length} attachment(s)
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(notice)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(notice.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Notice</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this notice? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Notice Modal */}
      {showForm && (
        <NoticeFormModal
          notice={editingNotice}
          onClose={() => { setShowForm(false); setEditingNotice(null); }}
          onSuccess={() => {
            setShowForm(false);
            setEditingNotice(null);
            fetchNotices();
            setToast({ message: editingNotice ? "Notice updated!" : "Notice created!", type: "success" });
          }}
          onError={(msg) => setToast({ message: msg, type: "error" })}
        />
      )}
    </div>
  );
}

// ─── Notice Form Modal ───────────────────────────────────────────────────────
function NoticeFormModal({
  notice,
  onClose,
  onSuccess,
  onError,
}: {
  notice: Notice | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    title: notice?.title || "",
    content: notice?.content || "",
    type: notice?.type || ("GENERAL" as NoticeType),
    audience: notice?.audience || ("ALL" as Audience),
    isImportant: notice?.isImportant || false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      onError("Title and content are required");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("content", form.content);
      formData.append("type", form.type);
      formData.append("audience", form.audience);
      formData.append("isImportant", String(form.isImportant));
      if (file) formData.append("attachment", file);

      if (notice) {
        await axios.put(`/api/communication-new/notices/${notice.id}`, formData, {
          headers: { ...headers, "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post("/api/communication-new/notices", formData, {
          headers: { ...headers, "Content-Type": "multipart/form-data" },
        });
      }
      onSuccess();
    } catch {
      onError("Failed to save notice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {notice ? "Edit Notice" : "Create Notice"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter notice title"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Content *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={5}
              placeholder="Write your notice content here..."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
              required
            />
          </div>

          {/* Type & Audience */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as NoticeType })}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {NOTICE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Audience</label>
              <select
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value as Audience })}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {AUDIENCES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachment</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition text-sm text-gray-600">
                <Paperclip size={16} />
                {file ? file.name : "Choose file"}
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  accept=".pdf,.jpg,.png,.doc,.docx"
                />
              </label>
              {file && (
                <button type="button" onClick={() => setFile(null)} className="text-red-500 hover:text-red-700">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Important */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isImportant}
              onChange={(e) => setForm({ ...form, isImportant: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Mark as important notice</span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
            >
              {saving ? "Saving..." : notice ? "Update Notice" : "Publish Notice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
