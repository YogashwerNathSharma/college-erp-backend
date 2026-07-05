import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  MessageSquare,
  Send,
  Users,
  User,
  Phone,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Clock,
  TrendingUp,
  XCircle,
  ChevronDown,
  Loader2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type RecipientMode = "CLASS" | "INDIVIDUAL" | "CUSTOM";

interface SmsTemplate {
  id: string;
  name: string;
  content: string;
}

interface SmsLog {
  id: string;
  recipient: string;
  message: string;
  status: "SENT" | "DELIVERED" | "FAILED" | "PENDING";
  sentAt: string;
  recipientName?: string;
}

interface SmsStats {
  totalSentToday: number;
  delivered: number;
  failed: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const SMS_TEMPLATES: SmsTemplate[] = [
  { id: "fee_reminder", name: "Fee Reminder", content: "Dear Parent, this is a reminder that the fee of ₹{amount} for {student_name} is due on {due_date}. Please pay at the earliest." },
  { id: "attendance_alert", name: "Attendance Alert", content: "Dear Parent, {student_name} was absent on {date}. Kindly inform the school about the reason." },
  { id: "exam_schedule", name: "Exam Schedule", content: "Dear Parent, exams for {class} will start from {start_date}. Please ensure your ward prepares well." },
  { id: "meeting_invite", name: "PTM Invitation", content: "Dear Parent, you are invited for the Parent-Teacher Meeting on {date} at {time}. Your presence is requested." },
  { id: "holiday_notice", name: "Holiday Notice", content: "Dear Parent, school will remain closed on {date} on account of {reason}. Regular classes resume on {resume_date}." },
];

const STATUS_COLORS: Record<string, string> = {
  SENT: "bg-blue-50 text-blue-700",
  DELIVERED: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-700",
  PENDING: "bg-yellow-50 text-yellow-700",
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
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
export default function SMSSend() {
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("CLASS");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [customNumbers, setCustomNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [smsLog, setSmsLog] = useState<SmsLog[]>([]);
  const [stats, setStats] = useState<SmsStats>({ totalSentToday: 0, delivered: 0, failed: 0 });
  const [loadingLog, setLoadingLog] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ─── Fetch data ────────────────────────────────────────────────────────────
  const fetchLog = useCallback(async () => {
    setLoadingLog(true);
    try {
      const res = await axios.get("/api/communication-new/sms/log", { headers, params: { limit: 20 } });
      setSmsLog(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      // silent
    } finally {
      setLoadingLog(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get("/api/communication-new/sms/stats", { headers });
      setStats(res.data.data || { totalSentToday: 0, delivered: 0, failed: 0 });
    } catch {
      // silent
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await axios.get("/api/communication-new/sms/classes", { headers });
      setClasses(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setClasses([
        { id: "1", name: "Class 1" }, { id: "2", name: "Class 2" }, { id: "3", name: "Class 3" },
        { id: "4", name: "Class 4" }, { id: "5", name: "Class 5" }, { id: "6", name: "Class 6" },
        { id: "7", name: "Class 7" }, { id: "8", name: "Class 8" }, { id: "9", name: "Class 9" },
        { id: "10", name: "Class 10" }, { id: "11", name: "Class 11" }, { id: "12", name: "Class 12" },
      ]);
    }
  }, []);

  useEffect(() => {
    fetchLog();
    fetchStats();
    fetchClasses();
  }, [fetchLog, fetchStats, fetchClasses]);

  // ─── Template selection ────────────────────────────────────────────────────
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tpl = SMS_TEMPLATES.find((t) => t.id === templateId);
    if (tpl) setMessage(tpl.content);
  };

  // ─── Send SMS ──────────────────────────────────────────────────────────────
  const handleSend = async () => {
    setShowConfirm(false);
    setSending(true);
    try {
      await axios.post("/api/communication-new/sms/send", {
        recipientMode,
        classId: recipientMode === "CLASS" ? selectedClass : undefined,
        section: recipientMode === "CLASS" ? selectedSection : undefined,
        numbers: recipientMode === "CUSTOM" ? customNumbers.split(",").map((n) => n.trim()).filter(Boolean) : undefined,
        message,
        templateId: selectedTemplate || undefined,
      }, { headers });
      setToast({ message: "SMS sent successfully!", type: "success" });
      setMessage("");
      setSelectedTemplate("");
      fetchLog();
      fetchStats();
    } catch {
      setToast({ message: "Failed to send SMS", type: "error" });
    } finally {
      setSending(false);
    }
  };

  const charCount = message.length;
  const smsCount = Math.ceil(charCount / 160) || 1;

  return (
    <div className="page-container space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <MessageSquare className="text-blue-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Send SMS</h1>
          <p className="text-sm text-gray-500">Send SMS messages to parents, students & staff</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Sent Today</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalSentToday}</p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Delivered</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.delivered}</p>
            </div>
            <div className="p-2.5 bg-green-50 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Failed</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.failed}</p>
            </div>
            <div className="p-2.5 bg-red-50 rounded-lg">
              <XCircle size={20} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Section */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Compose Message</h2>

          {/* Recipient Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
            <div className="flex flex-wrap gap-2">
              {([
                { key: "CLASS" as RecipientMode, label: "Class-wise", icon: Users },
                { key: "INDIVIDUAL" as RecipientMode, label: "Individual", icon: User },
                { key: "CUSTOM" as RecipientMode, label: "Custom Numbers", icon: Phone },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setRecipientMode(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    recipientMode === key
                      ? "bg-blue-50 border-blue-300 text-blue-700 shadow-sm"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Class Selector */}
          {recipientMode === "CLASS" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>
          )}

          {/* Custom Numbers */}
          {recipientMode === "CUSTOM" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Numbers <span className="text-gray-400">(comma separated)</span>
              </label>
              <textarea
                value={customNumbers}
                onChange={(e) => setCustomNumbers(e.target.value)}
                rows={3}
                placeholder="9876543210, 9876543211, 9876543212"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                {customNumbers.split(",").filter((n) => n.trim()).length} number(s) entered
              </p>
            </div>
          )}

          {/* Template Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message Template</label>
            <div className="relative">
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none pr-10"
              >
                <option value="">Custom Message (no template)</option>
                {SMS_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Message */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-medium text-gray-700">Message</label>
              <span className={`text-xs font-medium ${charCount > 160 ? "text-amber-600" : "text-gray-400"}`}>
                {charCount}/160 • {smsCount} SMS
              </span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Type your SMS message here..."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
            {charCount > 160 && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠ Message exceeds 160 chars. Will be sent as {smsCount} SMS(s).
              </p>
            )}
          </div>

          {/* Send Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!message.trim() || sending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm shadow-sm"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? "Sending..." : "Send SMS"}
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={16} />
            Message Preview
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-dashed border-gray-200 min-h-[200px]">
            {message ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{message}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">Your message preview will appear here...</p>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Characters</span>
              <span className="font-medium">{charCount}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>SMS Count</span>
              <span className="font-medium">{smsCount}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Recipients</span>
              <span className="font-medium">
                {recipientMode === "CUSTOM"
                  ? customNumbers.split(",").filter((n) => n.trim()).length
                  : recipientMode === "CLASS"
                  ? selectedClass ? "Class " + selectedClass : "All"
                  : "Individual"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SMS Log Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={16} />
            Recent SMS Log
          </h3>
          <span className="text-xs text-gray-400">Last 20 messages</span>
        </div>

        {loadingLog ? (
          <div className="p-8 flex justify-center">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : smsLog.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No SMS sent yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {smsLog.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{log.recipientName || log.recipient}</p>
                      <p className="text-xs text-gray-400">{log.recipient}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 truncate max-w-xs">{log.message}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[log.status]}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">
                      {formatDate(log.sentAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <Send size={20} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirm Send</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">Are you sure you want to send this SMS?</p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 border">
              <p className="text-sm text-gray-700 line-clamp-3">{message}</p>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              This will send {smsCount} SMS(s) to the selected recipients. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
