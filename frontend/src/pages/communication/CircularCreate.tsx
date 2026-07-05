import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FileText,
  Send,
  Eye,
  EyeOff,
  Paperclip,
  X,
  Calendar,
  Tag,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Download,
  Trash2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Category = "GENERAL" | "ACADEMIC" | "EVENT" | "HOLIDAY" | "EXAM" | "ADMINISTRATIVE";

interface Circular {
  id: string;
  title: string;
  subject: string;
  content: string;
  category: Category;
  audiences: string[];
  publishDate: string;
  attachment?: string;
  publishedBy: string;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const CATEGORIES: { value: Category; label: string }[] = [
  { value: "GENERAL", label: "General" },
  { value: "ACADEMIC", label: "Academic" },
  { value: "EVENT", label: "Event" },
  { value: "HOLIDAY", label: "Holiday" },
  { value: "EXAM", label: "Examination" },
  { value: "ADMINISTRATIVE", label: "Administrative" },
];

const AUDIENCE_OPTIONS = [
  { id: "STUDENTS", label: "Students", color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
  { id: "PARENTS", label: "Parents", color: "bg-rose-50 border-rose-200 text-rose-700" },
  { id: "TEACHERS", label: "Teachers", color: "bg-teal-50 border-teal-200 text-teal-700" },
  { id: "STAFF", label: "Staff", color: "bg-amber-50 border-amber-200 text-amber-700" },
];

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

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CircularCreate() {
  const [form, setForm] = useState({
    title: "",
    subject: "",
    content: "",
    category: "GENERAL" as Category,
    audiences: [] as string[],
    publishDate: new Date().toISOString().split("T")[0],
    isImportant: false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loadingCirculars, setLoadingCirculars] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ─── Fetch Circulars ───────────────────────────────────────────────────────
  const fetchCirculars = useCallback(async () => {
    setLoadingCirculars(true);
    try {
      const res = await axios.get("/api/communication-new/circular", { headers });
      const data = res.data?.data;
      setCirculars(Array.isArray(data) ? data : []);
    } catch {
      // silent
    } finally {
      setLoadingCirculars(false);
    }
  }, []);

  useEffect(() => {
    fetchCirculars();
  }, [fetchCirculars]);

  // ─── Toggle Audience ───────────────────────────────────────────────────────
  const toggleAudience = (aud: string) => {
    setForm((prev) => ({
      ...prev,
      audiences: prev.audiences.includes(aud)
        ? prev.audiences.filter((a) => a !== aud)
        : [...prev.audiences, aud],
    }));
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setToast({ message: "Title and content are required", type: "error" });
      return;
    }
    if (form.audiences.length === 0) {
      setToast({ message: "Please select at least one audience", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("subject", form.subject);
      formData.append("content", form.content);
      formData.append("category", form.category);
      formData.append("audiences", JSON.stringify(form.audiences));
      formData.append("publishDate", form.publishDate);
      formData.append("isImportant", String(form.isImportant));
      if (file) formData.append("attachment", file);

      await axios.post("/api/communication-new/circular", formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      setToast({ message: "Circular published successfully!", type: "success" });
      setForm({
        title: "", subject: "", content: "", category: "GENERAL",
        audiences: [], publishDate: new Date().toISOString().split("T")[0], isImportant: false,
      });
      setFile(null);
      fetchCirculars();
    } catch {
      setToast({ message: "Failed to publish circular", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/communication-new/circular/${id}`, { headers });
      setCirculars((prev) => prev.filter((c) => c.id !== id));
      setToast({ message: "Circular deleted", type: "success" });
    } catch {
      setToast({ message: "Failed to delete circular", type: "error" });
    }
  };

  return (
    <div className="page-container space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <FileText className="text-violet-600" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Circular</h1>
            <p className="text-sm text-gray-500">Draft and publish circulars to your institution</p>
          </div>
        </div>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
            previewMode
              ? "bg-violet-50 border-violet-200 text-violet-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {previewMode ? <EyeOff size={16} /> : <Eye size={16} />}
          {previewMode ? "Edit Mode" : "Preview"}
        </button>
      </div>

      {/* Form / Preview */}
      {previewMode ? (
        /* ─── Preview Mode ─────────────────────────────────────────────── */
        <div className="bg-white rounded-xl border shadow-sm p-8 max-w-4xl">
          <div className="text-center mb-6 border-b pb-6">
            <h2 className="text-xl font-bold text-gray-900">{form.title || "Untitled Circular"}</h2>
            {form.subject && <p className="text-gray-600 mt-1">{form.subject}</p>}
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(form.publishDate)}</span>
              <span className="flex items-center gap-1"><Tag size={12} />{form.category}</span>
              <span className="flex items-center gap-1"><Users size={12} />{form.audiences.join(", ") || "No audience"}</span>
            </div>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {form.content || "No content added yet."}
            </p>
          </div>
          {file && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Paperclip size={14} />
                <span>Attachment: {file.name}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ─── Edit Mode ────────────────────────────────────────────────── */
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border shadow-sm p-6 max-w-4xl space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Circular Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter circular title"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition"
              required
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Brief subject line"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition"
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-medium text-gray-700">Content *</label>
              <span className="text-xs text-gray-400">
                Formatting: Use blank lines for paragraphs. Use * for emphasis.
              </span>
            </div>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={10}
              placeholder="Write your circular content here...&#10;&#10;Use blank lines to separate paragraphs.&#10;This will be shared with the selected audience via configured channels."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition resize-none font-mono"
              required
            />
          </div>

          {/* Category + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Publish Date</label>
              <input
                type="date"
                value={form.publishDate}
                onChange={(e) => setForm({ ...form, publishDate: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2.5 cursor-pointer pb-2.5">
                <input
                  type="checkbox"
                  checked={form.isImportant}
                  onChange={(e) => setForm({ ...form, isImportant: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-gray-700">Mark as Important</span>
              </label>
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience *</label>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_OPTIONS.map((aud) => (
                <button
                  key={aud.id}
                  type="button"
                  onClick={() => toggleAudience(aud.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.audiences.includes(aud.id)
                      ? aud.color + " shadow-sm"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {form.audiences.includes(aud.id) && "✓ "}
                  {aud.label}
                </button>
              ))}
            </div>
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachment (PDF/Image)</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition text-sm text-gray-600">
                <Paperclip size={16} />
                {file ? file.name : "Choose file"}
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </label>
              {file && (
                <button type="button" onClick={() => setFile(null)} className="text-red-500 hover:text-red-700">
                  <X size={16} />
                </button>
              )}
            </div>
            {file && (
              <p className="text-xs text-gray-400 mt-1">
                {(file.size / 1024).toFixed(1)} KB • {file.type}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              <Eye size={16} />
              Preview
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition shadow-sm"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {saving ? "Publishing..." : "Publish Circular"}
            </button>
          </div>
        </form>
      )}

      {/* Published Circulars */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={16} />
            Published Circulars
          </h3>
        </div>

        {loadingCirculars ? (
          <div className="p-8 flex justify-center">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : circulars.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No circulars published yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {circulars.map((circ) => (
              <div key={circ.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{circ.title}</h4>
                    <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded">{circ.category}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{formatDate(circ.createdAt)}</span>
                    <span>•</span>
                    <span>{circ.audiences.join(", ")}</span>
                    {circ.publishedBy && (
                      <>
                        <span>•</span>
                        <span>by {circ.publishedBy}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {circ.attachment && (
                    <a
                      href={circ.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Download Attachment"
                    >
                      <Download size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(circ.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
