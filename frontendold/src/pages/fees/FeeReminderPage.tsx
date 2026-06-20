
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "/api";

interface ClassOption { id: string; name: string; }
interface AcademicYearOption { id: string; name: string; }

const MESSAGE_TEMPLATES = [
  { value: "MONTHLY", label: "Monthly Fee Reminder", message: "Dear Parent, This is a reminder that the monthly fee for your ward [student_name] of Class [class] is pending. Kindly make the payment at the earliest. Thank you." },
  { value: "QUARTERLY", label: "Quarterly Fee Reminder", message: "Dear Parent, The quarterly fee for [student_name] (Class [class]) is due. Please arrange the payment soon to avoid late fee charges. Thank you." },
  { value: "OVERDUE", label: "Overdue Notice", message: "Dear Parent, The fee for [student_name] (Class [class], Adm. No: [admission_no]) is overdue. Please make the payment immediately to avoid further penalties. - School Management" },
  { value: "CUSTOM", label: "Custom Message", message: "" },
];

const FeeReminderPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [template, setTemplate] = useState("MONTHLY");
  const [sendTo, setSendTo] = useState<"ALL" | "DUE_ONLY">("DUE_ONLY");
  const [message, setMessage] = useState(MESSAGE_TEMPLATES[0].message);
  const [channels, setChannels] = useState<string[]>(["SMS"]);
  const [sending, setSending] = useState(false);
  const [previewData, setPreviewData] = useState<{ totalStudents: number } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    const tmpl = MESSAGE_TEMPLATES.find((t) => t.value === template);
    if (tmpl && tmpl.value !== "CUSTOM") {
      setMessage(tmpl.message);
    }
  }, [template]);

  useEffect(() => {
    if (selectedYear) fetchPreview();
  }, [selectedClass, selectedYear, sendTo]);

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API}/class`);
      if (res.data.success) setClasses(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await axios.get(`${API}/academic`);
      if (res.data.success) setAcademicYears(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchPreview = async () => {
    if (!selectedYear) return;
    setLoadingPreview(true);
    try {
      const res = await axios.post(`${API}/fees/reminders/preview`, {
        classId: selectedClass || undefined,
        academicYearId: selectedYear,
        sendTo,
      });
      if (res.data.success) setPreviewData(res.data.data);
    } catch (e) { setPreviewData(null); }
    finally { setLoadingPreview(false); }
  };

  const toggleChannel = (ch: string) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleSend = async () => {
    if (!selectedYear) { toast.error("Please select academic year"); return; }
    if (!message.trim()) { toast.error("Message cannot be empty"); return; }
    if (channels.length === 0) { toast.error("Select at least one channel"); return; }

    setSending(true);
    try {
      const res = await axios.post(`${API}/fees/reminders/send`, {
        classId: selectedClass || undefined,
        academicYearId: selectedYear,
        sendTo,
        message,
        channels,
      });
      if (res.data.success) {
        toast.success(res.data.data.message || "Reminders sent!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send reminders");
    } finally { setSending(false); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fee Reminders</h1>
        <p className="text-sm text-gray-500 mt-1">Send fee payment reminders to parents</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year <span className="text-red-500">*</span></label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500">
              <option value="">Select Session</option>
              {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class (Optional)</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500">
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message Template</label>
            <select value={template} onChange={(e) => setTemplate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500">
              {MESSAGE_TEMPLATES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Send To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="DUE_ONLY" checked={sendTo === "DUE_ONLY"} onChange={() => setSendTo("DUE_ONLY")} className="w-4 h-4 text-primary-600" />
              <span className="text-sm text-gray-700">Due Students Only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="ALL" checked={sendTo === "ALL"} onChange={() => setSendTo("ALL")} className="w-4 h-4 text-primary-600" />
              <span className="text-sm text-gray-700">All Students</span>
            </label>
          </div>
          {previewData && (
            <p className="text-xs text-primary-600 mt-1 font-medium">
              {loadingPreview ? "Counting..." : `${previewData.totalStudents} students will receive this reminder`}
            </p>
          )}
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            placeholder="Enter reminder message..."
          />
          <p className="text-xs text-gray-400 mt-1">
            Variables: [student_name], [father_name], [class], [admission_no]
          </p>
        </div>

        {/* Send Via */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Send Via</label>
          <div className="flex gap-4">
            {["SMS", "EMAIL", "WHATSAPP"].map((ch) => (
              <label key={ch} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${channels.includes(ch) ? "bg-primary-50 border-primary-300" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
                <input type="checkbox" checked={channels.includes(ch)} onChange={() => toggleChannel(ch)} className="w-4 h-4 text-primary-600 rounded" />
                <span className="text-sm font-medium text-gray-700">{ch === "SMS" ? "📱 SMS" : ch === "EMAIL" ? "📧 Email" : "💬 WhatsApp"}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Send Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-gray-500">
            {channels.length > 0 ? `Will send via: ${channels.join(", ")}` : "Select at least one channel"}
          </p>
          <button
            onClick={handleSend}
            disabled={sending || !selectedYear || channels.length === 0}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium flex items-center gap-2"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>📤 Send Reminder</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeeReminderPage;

