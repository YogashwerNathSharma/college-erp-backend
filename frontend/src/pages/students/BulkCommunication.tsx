import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Megaphone,
  Filter,
  Send,
  Users,
  Phone,
  Mail,
  MessageSquare,
  Loader2,
  Eye,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { PageHeader, LoadingSkeleton } from "../../components/enterprise";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ClassItem { id: string; name: string; }
interface SectionItem { id: string; name: string; }

type Channel = "sms" | "email" | "whatsapp";

interface BulkFilters {
  classId: string;
  sectionId: string;
  gender: string;
  status: string;
  category: string;
}

interface SendResult {
  total: number;
  sent: number;
  failed: number;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

function authHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
}

export default function BulkCommunication() {
  // State
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [filters, setFilters] = useState<BulkFilters>({
    classId: "",
    sectionId: "",
    gender: "",
    status: "active",
    category: "",
  });
  const [channel, setChannel] = useState<Channel>("sms");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [matchedCount, setMatchedCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // ─── Load dropdowns ────────────────────────────────────────
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/classes`, authHeaders());
        setClasses(res.data.data || res.data || []);
      } catch {}
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!filters.classId) { setSections([]); return; }
    const fetchSections = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/sections?classId=${filters.classId}`, authHeaders());
        setSections(res.data.data || res.data || []);
      } catch { setSections([]); }
    };
    fetchSections();
  }, [filters.classId]);

  // ─── Count matching students ───────────────────────────────
  useEffect(() => {
    const fetchCount = async () => {
      setLoadingCount(true);
      try {
        const params = new URLSearchParams();
        if (filters.classId) params.append("classId", filters.classId);
        if (filters.sectionId) params.append("sectionId", filters.sectionId);
        if (filters.gender) params.append("gender", filters.gender);
        if (filters.status) params.append("status", filters.status);
        params.append("limit", "1");

        const res = await axios.get(`${API_BASE_URL}/api/students?${params.toString()}`, authHeaders());
        setMatchedCount(res.data.data?.total || 0);
      } catch {
        setMatchedCount(null);
      } finally {
        setLoadingCount(false);
      }
    };
    fetchCount();
  }, [filters]);

  // ─── Send Bulk Message ─────────────────────────────────────
  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Message cannot be empty");
      return;
    }
    if (matchedCount === 0) {
      toast.error("No students match your filter criteria");
      return;
    }

    setSending(true);
    setResult(null);
    try {
      const endpoint = `bulk-${channel}`;
      const payload: any = {
        filters: {
          classId: filters.classId || undefined,
          sectionId: filters.sectionId || undefined,
          gender: filters.gender || undefined,
          status: filters.status || undefined,
          category: filters.category || undefined,
        },
        message: message.trim(),
      };
      if (channel === "email") {
        payload.subject = subject;
      }

      const res = await axios.post(
        `${API_BASE_URL}/api/students/communication/${endpoint}`,
        payload,
        authHeaders()
      );

      if (res.data.success) {
        const data = res.data.data;
        setResult({
          total: data.total || matchedCount || 0,
          sent: data.sent || data.total || matchedCount || 0,
          failed: data.failed || 0,
        });
        toast.success(`Messages sent to ${data.sent || matchedCount} students!`);
      } else {
        toast.error(res.data.message || "Failed to send");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Bulk send failed");
    } finally {
      setSending(false);
    }
  };

  // ─── Preview message with sample data ──────────────────────
  const getPreviewMessage = () => {
    return message
      .replace(/\{\{student_name\}\}/g, "Rahul Sharma")
      .replace(/\{\{class\}\}/g, "10th A")
      .replace(/\{\{father_name\}\}/g, "Mr. Rajesh Sharma")
      .replace(/\{\{admission_no\}\}/g, "ADM-2025-001")
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString("en-IN"));
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Bulk Communication"
        subtitle="Send messages to multiple students at once"
        icon={<Megaphone className="w-6 h-6" />}
      />

      <div className="mt-6 space-y-6">
        {/* Success Result */}
        {result && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-green-800 dark:text-green-300">Messages Sent!</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{result.total}</p>
                <p className="text-xs text-green-600 dark:text-green-500">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{result.sent}</p>
                <p className="text-xs text-green-600 dark:text-green-500">Sent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{result.failed}</p>
                <p className="text-xs text-red-500">Failed</p>
              </div>
            </div>
            <button
              onClick={() => { setResult(null); setMessage(""); setSubject(""); }}
              className="mt-4 text-sm text-green-700 dark:text-green-400 underline"
            >
              Send another message
            </button>
          </div>
        )}

        {!result && (
          <>
            {/* Filter Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-500" />
                Select Recipients
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Class */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Class</label>
                  <select
                    value={filters.classId}
                    onChange={(e) => setFilters((prev) => ({ ...prev, classId: e.target.value, sectionId: "" }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="">All Classes</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Section</label>
                  <select
                    value={filters.sectionId}
                    onChange={(e) => setFilters((prev) => ({ ...prev, sectionId: e.target.value }))}
                    disabled={!filters.classId}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="">All Sections</option>
                    {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Gender</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters((prev) => ({ ...prev, gender: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="">All</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="">All</option>
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>
              </div>

              {/* Matched Count */}
              <div className="mt-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {loadingCount ? "Counting..." : matchedCount !== null ? `${matchedCount} student(s) matched` : "—"}
                </span>
              </div>
            </div>

            {/* Channel & Message */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-500" />
                Compose Message
              </h3>

              {/* Channel Selection */}
              <div className="flex gap-3">
                {(["sms", "email", "whatsapp"] as Channel[]).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                      channel === ch
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                        : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    {ch === "sms" && <Phone className="w-4 h-4" />}
                    {ch === "email" && <Mail className="w-4 h-4" />}
                    {ch === "whatsapp" && <MessageSquare className="w-4 h-4" />}
                    {ch.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Subject (email) */}
              {channel === "email" && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject..."
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Message</label>
                  <span className="text-xs text-slate-400">
                    Variables: {"{{student_name}}"}, {"{{class}}"}, {"{{father_name}}"}, {"{{admission_no}}"}, {"{{date}}"}
                  </span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here... Use {{variable}} for personalization"
                  rows={6}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{message.length} characters</p>
              </div>

              {/* Preview */}
              {message.trim() && (
                <div>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    {previewMode ? "Hide Preview" : "Preview with sample data"}
                  </button>
                  {previewMode && (
                    <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                      <p className="text-xs text-slate-400 mb-1">Preview (sample student):</p>
                      <p className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap">{getPreviewMessage()}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Send Button */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || matchedCount === 0 || sending}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl px-6 py-3.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending to {matchedCount} students...
                    </>
                  ) : (
                    <>
                      <Megaphone className="w-5 h-5" />
                      Send to {matchedCount || 0} Students
                    </>
                  )}
                </button>
              </div>

              {/* Warning */}
              {matchedCount && matchedCount > 100 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Sending to {matchedCount} students may take a few minutes. Messages will be queued and processed in background.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
