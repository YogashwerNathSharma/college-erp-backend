import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  MessageCircle,
  Send,
  Users,
  User,
  CheckCircle,
  AlertCircle,
  X,
  Clock,
  Loader2,
  Eye,
  CheckCheck,
  Check,
  FileText,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type RecipientMode = "CLASS" | "INDIVIDUAL";

interface WATemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  category: string;
}

interface WALog {
  id: string;
  recipient: string;
  recipientName?: string;
  templateName?: string;
  message: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  sentAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const WA_TEMPLATES: WATemplate[] = [
  {
    id: "fee_reminder",
    name: "Fee Payment Reminder",
    content: "Hello {parent_name}, this is a reminder for {student_name}'s pending fee of ₹{amount}. Due date: {due_date}. Please pay via the school portal or visit the accounts office.",
    variables: ["parent_name", "student_name", "amount", "due_date"],
    category: "FEE",
  },
  {
    id: "attendance_alert",
    name: "Attendance Alert",
    content: "Dear {parent_name}, your ward {student_name} of Class {class} was absent today ({date}). Kindly inform us about the reason.",
    variables: ["parent_name", "student_name", "class", "date"],
    category: "ATTENDANCE",
  },
  {
    id: "exam_result",
    name: "Exam Result Notification",
    content: "Dear {parent_name}, the results for {exam_name} have been published. {student_name} scored {percentage}%. You can view the detailed report card on the portal.",
    variables: ["parent_name", "exam_name", "student_name", "percentage"],
    category: "ACADEMIC",
  },
  {
    id: "transport_update",
    name: "Transport Update",
    content: "Dear {parent_name}, bus route {route_no} is delayed by approximately {delay_mins} minutes today due to {reason}. We apologize for the inconvenience.",
    variables: ["parent_name", "route_no", "delay_mins", "reason"],
    category: "TRANSPORT",
  },
  {
    id: "general_notice",
    name: "General Notice",
    content: "Dear {parent_name}, {notice_content}. For more details, please contact the school office.",
    variables: ["parent_name", "notice_content"],
    category: "GENERAL",
  },
];

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  SENT: { color: "bg-blue-50 text-blue-700", icon: Check, label: "Sent" },
  DELIVERED: { color: "bg-green-50 text-green-700", icon: CheckCheck, label: "Delivered" },
  READ: { color: "bg-emerald-50 text-emerald-700", icon: Eye, label: "Read" },
  FAILED: { color: "bg-red-50 text-red-700", icon: AlertCircle, label: "Failed" },
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
export default function WhatsAppSend() {
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("CLASS");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [phones, setPhones] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<WATemplate | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [waLog, setWaLog] = useState<WALog[]>([]);
  const [loadingLog, setLoadingLog] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ─── Fetch ─────────────────────────────────────────────────────────────────
  const fetchLog = useCallback(async () => {
    setLoadingLog(true);
    try {
      const res = await axios.get("/api/communication-new/whatsapp/log", { headers, params: { limit: 20 } });
      setWaLog(res.data.data || []);
    } catch {
      // silent
    } finally {
      setLoadingLog(false);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await axios.get("/api/communication-new/whatsapp/classes", { headers });
      setClasses(res.data.data || []);
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
    fetchClasses();
  }, [fetchLog, fetchClasses]);

  // ─── Template handling ─────────────────────────────────────────────────────
  const handleTemplateSelect = (templateId: string) => {
    const tpl = WA_TEMPLATES.find((t) => t.id === templateId);
    setSelectedTemplate(tpl || null);
    setVariableValues({});
    setCustomMessage("");
  };

  const getPreviewMessage = (): string => {
    if (!selectedTemplate) return customMessage;
    let msg = selectedTemplate.content;
    Object.entries(variableValues).forEach(([key, val]) => {
      msg = msg.replace(`{${key}}`, val || `{${key}}`);
    });
    return msg;
  };

  // ─── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    setShowConfirm(false);
    setSending(true);
    try {
      await axios.post("/api/communication-new/whatsapp/send", {
        recipientMode,
        classId: recipientMode === "CLASS" ? selectedClass : undefined,
        section: recipientMode === "CLASS" ? selectedSection : undefined,
        phones: recipientMode === "INDIVIDUAL" ? phones.split(",").map((n) => n.trim()).filter(Boolean) : undefined,
        templateId: selectedTemplate?.id,
        message: getPreviewMessage(),
        variables: variableValues,
      }, { headers });
      setToast({ message: "WhatsApp message sent successfully!", type: "success" });
      setCustomMessage("");
      setSelectedTemplate(null);
      setVariableValues({});
      fetchLog();
    } catch {
      setToast({ message: "Failed to send WhatsApp message", type: "error" });
    } finally {
      setSending(false);
    }
  };

  const canSend = selectedTemplate ? true : customMessage.trim().length > 0;

  return (
    <div className="page-container space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <MessageCircle className="text-green-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Messages</h1>
          <p className="text-sm text-gray-500">Send template-based WhatsApp messages</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Compose Section */}
        <div className="lg:col-span-3 bg-white rounded-xl border shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Compose Message</h2>

          {/* Template Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              WhatsApp Template
            </label>
            <select
              value={selectedTemplate?.id || ""}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="">Custom Message (no template)</option>
              {WA_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>[{t.category}] {t.name}</option>
              ))}
            </select>
          </div>

          {/* Variable Inputs (for templates) */}
          {selectedTemplate && selectedTemplate.variables.length > 0 && (
            <div className="bg-green-50/50 rounded-lg p-4 border border-green-100 space-y-3">
              <p className="text-sm font-medium text-green-800">Template Variables</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedTemplate.variables.map((v) => (
                  <div key={v}>
                    <label className="block text-xs text-gray-600 mb-1 capitalize">
                      {v.replace(/_/g, " ")}
                    </label>
                    <input
                      type="text"
                      value={variableValues[v] || ""}
                      onChange={(e) => setVariableValues({ ...variableValues, [v]: e.target.value })}
                      placeholder={`Enter ${v.replace(/_/g, " ")}`}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Message */}
          {!selectedTemplate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={5}
                placeholder="Type your WhatsApp message here..."
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
              />
            </div>
          )}

          {/* Recipient Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
            <div className="flex gap-2">
              {([
                { key: "CLASS" as RecipientMode, label: "Class-wise", icon: Users },
                { key: "INDIVIDUAL" as RecipientMode, label: "Individual", icon: User },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setRecipientMode(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    recipientMode === key
                      ? "bg-green-50 border-green-300 text-green-700 shadow-sm"
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
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
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
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>
          )}

          {/* Individual Numbers */}
          {recipientMode === "INDIVIDUAL" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Numbers <span className="text-gray-400">(comma separated, with country code)</span>
              </label>
              <textarea
                value={phones}
                onChange={(e) => setPhones(e.target.value)}
                rows={2}
                placeholder="919876543210, 919876543211"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
              />
            </div>
          )}

          {/* Send Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!canSend || sending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm shadow-sm"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? "Sending..." : "Send via WhatsApp"}
            </button>
          </div>
        </div>

        {/* Preview Panel (WhatsApp style) */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Eye size={16} />
            Message Preview
          </h3>

          {/* WhatsApp-style chat bubble */}
          <div className="bg-[#e5ddd5] rounded-lg p-4 min-h-[250px] flex flex-col justify-end">
            {getPreviewMessage() ? (
              <div className="max-w-[85%] ml-auto">
                <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none px-3 py-2 shadow-sm">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{getPreviewMessage()}</p>
                  <p className="text-[10px] text-gray-500 text-right mt-1 flex items-center justify-end gap-1">
                    {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    <CheckCheck size={12} className="text-blue-500" />
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center italic">Select a template or type a message</p>
            )}
          </div>

          {selectedTemplate && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
              <p className="text-xs font-medium text-gray-500 mb-1">Template</p>
              <p className="text-sm font-medium text-gray-900">{selectedTemplate.name}</p>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded mt-1 inline-block">
                {selectedTemplate.category}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Send History */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={16} />
            Send History
          </h3>
        </div>

        {loadingLog ? (
          <div className="p-8 flex justify-center">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : waLog.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No messages sent yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {waLog.map((log) => {
                  const statusCfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.SENT;
                  const StatusIcon = statusCfg.icon;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{log.recipientName || log.recipient}</p>
                        <p className="text-xs text-gray-400">{log.recipient}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {log.templateName || "Custom"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600 truncate max-w-[200px]">{log.message}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                          <StatusIcon size={12} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-500">
                        {formatDate(log.sentAt)}
                      </td>
                    </tr>
                  );
                })}
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
              <div className="p-2 bg-green-100 rounded-full">
                <MessageCircle size={20} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Send WhatsApp Message?</h3>
            </div>
            <div className="bg-[#e5ddd5] rounded-lg p-3 mb-4">
              <div className="bg-[#dcf8c6] rounded-lg px-3 py-2 max-w-[90%] ml-auto">
                <p className="text-sm text-gray-800 line-clamp-4">{getPreviewMessage()}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              This message will be sent to the selected recipients via WhatsApp. Delivery depends on their WhatsApp availability.
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
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
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
