import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  MessageSquare,
  Mail,
  Phone,
  Send,
  Search,
  User,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { PageHeader, LoadingSkeleton, EmptyState } from "../../components/enterprise";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  phone: string;
  email: string;
  fatherName: string;
  fatherPhone: string;
  motherName: string;
  motherPhone: string;
  guardianName: string;
  guardianPhone: string;
  enrollments: { class: { name: string }; section: { name: string } }[];
}

interface CommunicationLog {
  id: string;
  type: string;
  subject: string;
  message: string;
  sentTo: string;
  sentBy: string;
  status: string;
  sentAt: string;
}

type Channel = "sms" | "email" | "whatsapp";
type Recipient = "student" | "father" | "mother" | "guardian";

const TEMPLATES: Record<Channel, { label: string; value: string }[]> = {
  sms: [
    { label: "Fee Reminder", value: "Dear Parent, this is a reminder that fee payment for {{student_name}} is pending. Please clear the dues at the earliest." },
    { label: "Attendance Alert", value: "Dear Parent, {{student_name}} was absent today. Please ensure regular attendance." },
    { label: "PTM Reminder", value: "Dear Parent, Parent-Teacher Meeting is scheduled on {{date}}. Your presence is requested." },
    { label: "Custom", value: "" },
  ],
  email: [
    { label: "Welcome", value: "Dear Parent,\n\nWelcome to our school! {{student_name}} has been successfully enrolled.\n\nBest regards,\nSchool Administration" },
    { label: "Fee Reminder", value: "Dear Parent,\n\nThis is a reminder that fee payment for {{student_name}} (Class: {{class}}) is pending.\n\nPlease clear the dues at the earliest.\n\nRegards,\nAccounts Department" },
    { label: "Report Card", value: "Dear Parent,\n\nThe report card for {{student_name}} is now available. Please visit the school to collect.\n\nRegards" },
    { label: "Custom", value: "" },
  ],
  whatsapp: [
    { label: "Fee Reminder", value: "🏫 *Fee Reminder*\n\nDear Parent, fee payment for *{{student_name}}* is pending. Please clear the dues.\n\nThank you!" },
    { label: "Holiday Notice", value: "📢 *Holiday Notice*\n\nDear Parent, please note that the school will remain closed on {{date}}.\n\nThank you!" },
    { label: "Custom", value: "" },
  ],
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

function authHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
}

export default function StudentCommunication() {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get("studentId");

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StudentInfo[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [channel, setChannel] = useState<Channel>("sms");
  const [recipient, setRecipient] = useState<Recipient>("father");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  // ─── Pre-select student from URL params ────────────────────
  useEffect(() => {
    if (preselectedId) {
      const fetchStudent = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/students/${preselectedId}`, authHeaders());
          if (res.data.success) setSelectedStudent(res.data.data);
        } catch {}
      };
      fetchStudent();
    }
  }, [preselectedId]);

  // ─── Search Students ───────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/students?search=${encodeURIComponent(searchQuery)}&limit=8`,
          authHeaders()
        );
        setSearchResults(res.data.data?.students || []);
      } catch {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // ─── Load Communication Logs ───────────────────────────────
  useEffect(() => {
    if (!selectedStudent) {
      setLogs([]);
      return;
    }
    const fetchLogs = async () => {
      setLoadingLogs(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/students/communication/${selectedStudent.id}/communication-log`,
          authHeaders()
        );
        setLogs(res.data.data || []);
      } catch {
        setLogs([]);
      } finally {
        setLoadingLogs(false);
      }
    };
    fetchLogs();
  }, [selectedStudent]);

  // ─── Get recipient contact info ────────────────────────────
  const getRecipientContact = (): string => {
    if (!selectedStudent) return "";
    switch (recipient) {
      case "student": return channel === "email" ? (selectedStudent.email || "") : (selectedStudent.phone || "");
      case "father": return channel === "email" ? "" : (selectedStudent.fatherPhone || "");
      case "mother": return channel === "email" ? "" : (selectedStudent.motherPhone || "");
      case "guardian": return channel === "email" ? "" : (selectedStudent.guardianPhone || "");
      default: return "";
    }
  };

  // ─── Send Message ──────────────────────────────────────────
  const handleSend = async () => {
    if (!selectedStudent || !message.trim()) {
      toast.error("Please select a student and enter a message");
      return;
    }

    const contact = getRecipientContact();
    if (!contact && channel !== "email") {
      toast.error(`No ${channel === "sms" ? "phone" : "WhatsApp"} number available for ${recipient}`);
      return;
    }

    setSending(true);
    try {
      const endpoint = channel === "sms" ? "send-sms" : channel === "email" ? "send-email" : "send-whatsapp";
      const payload: any = {
        message: message.trim(),
        to: contact,
        recipient,
      };
      if (channel === "email") {
        payload.subject = subject;
        payload.to = selectedStudent.email || "";
      }

      const res = await axios.post(
        `${API_BASE_URL}/api/students/communication/${selectedStudent.id}/${endpoint}`,
        payload,
        authHeaders()
      );

      if (res.data.success) {
        toast.success(`${channel.toUpperCase()} sent successfully!`);
        setMessage("");
        setSubject("");
        // Refresh logs
        const logRes = await axios.get(
          `${API_BASE_URL}/api/students/communication/${selectedStudent.id}/communication-log`,
          authHeaders()
        );
        setLogs(logRes.data.data || []);
      } else {
        toast.error(res.data.message || "Failed to send");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // ─── Apply Template ────────────────────────────────────────
  const applyTemplate = (templateValue: string) => {
    if (templateValue) {
      let processed = templateValue;
      if (selectedStudent) {
        processed = processed
          .replace(/\{\{student_name\}\}/g, `${selectedStudent.firstName} ${selectedStudent.lastName}`)
          .replace(/\{\{class\}\}/g, selectedStudent.enrollments?.[0]?.class?.name || "")
          .replace(/\{\{date\}\}/g, new Date().toLocaleDateString("en-IN"));
      }
      setMessage(processed);
    }
    setTemplateOpen(false);
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Student Communication"
        subtitle="Send SMS, Email or WhatsApp messages to students and parents"
        icon={<MessageSquare className="w-6 h-6" />}
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Compose */}
        <div className="lg:col-span-3 space-y-4">
          {/* Student Selector */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            {selectedStudent ? (
              <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                  <p className="text-xs text-slate-500">{selectedStudent.admissionNo} | {selectedStudent.enrollments?.[0]?.class?.name || ""}</p>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="p-1.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-800/50">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student by name or admission no..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                    {searchResults.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedStudent(s); setSearchQuery(""); setSearchResults([]); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm border-b last:border-b-0 border-slate-100 dark:border-slate-700"
                      >
                        <span className="font-medium">{s.firstName} {s.lastName}</span>
                        <span className="text-slate-400 ml-2">({s.admissionNo})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Channel Tabs */}
          {selectedStudent && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
              {/* Tabs */}
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                {(["sms", "email", "whatsapp"] as Channel[]).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => { setChannel(ch); setMessage(""); setSubject(""); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      channel === ch
                        ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    {ch === "sms" && <Phone className="w-4 h-4" />}
                    {ch === "email" && <Mail className="w-4 h-4" />}
                    {ch === "whatsapp" && <MessageSquare className="w-4 h-4" />}
                    {ch.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Recipient Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Send To</label>
                <div className="flex gap-2 flex-wrap">
                  {(["student", "father", "mother", "guardian"] as Recipient[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRecipient(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        recipient === r
                          ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-transparent hover:border-slate-300"
                      }`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Sending to: {getRecipientContact() || "No contact available"}
                </p>
              </div>

              {/* Template Selector */}
              <div className="relative">
                <button
                  onClick={() => setTemplateOpen(!templateOpen)}
                  className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium"
                >
                  Use Template
                  <ChevronDown className="w-4 h-4" />
                </button>
                {templateOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-10 min-w-[200px]">
                    {TEMPLATES[channel].map((t, i) => (
                      <button
                        key={i}
                        onClick={() => applyTemplate(t.value)}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm border-b last:border-b-0 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Subject (email only) */}
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
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Type your ${channel} message here...`}
                  rows={channel === "email" ? 8 : 4}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{message.length} characters</p>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl px-6 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send {channel.toUpperCase()}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right: Communication History */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Communication History
            </h3>

            {loadingLogs ? (
              <LoadingSkeleton variant="list" count={5} />
            ) : logs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                {selectedStudent ? "No messages sent yet" : "Select a student to view history"}
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                    <div className="flex items-center justify-between mb-1">
                      <span className="inline-flex items-center gap-1 text-xs font-medium">
                        {log.type === "sms" && <Phone className="w-3 h-3 text-blue-500" />}
                        {log.type === "email" && <Mail className="w-3 h-3 text-purple-500" />}
                        {log.type === "whatsapp" && <MessageSquare className="w-3 h-3 text-green-500" />}
                        <span className="uppercase text-slate-600 dark:text-slate-400">{log.type}</span>
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        {log.status === "sent" || log.status === "delivered" ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : log.status === "failed" ? (
                          <XCircle className="w-3 h-3 text-red-500" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-500" />
                        )}
                        <span className="text-slate-400 capitalize">{log.status}</span>
                      </span>
                    </div>
                    {log.subject && <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">{log.subject}</p>}
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{log.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-400">To: {log.sentTo}</span>
                      <span className="text-xs text-slate-400">{new Date(log.sentAt).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
