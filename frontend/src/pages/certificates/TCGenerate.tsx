import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FileText,
  Search,
  Printer,
  User,
  Calendar,
  Hash,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Clock,
  GraduationCap,
  Download,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  admissionDate: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  class?: { name: string };
  section?: { name: string };
  rollNo?: string;
  gender?: string;
}

interface TCRecord {
  id: string;
  serialNumber: string;
  studentName: string;
  admissionNo: string;
  className: string;
  leavingDate: string;
  reason: string;
  generatedAt: string;
  status: "GENERATED" | "ISSUED";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
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
export default function TCGenerate() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [tcHistory, setTcHistory] = useState<TCRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const [form, setForm] = useState({
    leavingDate: new Date().toISOString().split("T")[0],
    reason: "TRANSFER",
    character: "GOOD",
    conduct: "GOOD",
    examPassed: "",
    dobInWords: "",
    remarks: "",
  });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ─── Fetch TC History ──────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get("/api/certificate/tc", { headers });
      setTcHistory(res.data.data || []);
    } catch {
      // silent
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ─── Search Student ────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await axios.get("/api/certificate/tc/search-students", {
        headers,
        params: { q: searchQuery },
      });
      setSearchResults(res.data.data || []);
      if (!res.data.data?.length) {
        setToast({ message: "No students found", type: "error" });
      }
    } catch {
      setToast({ message: "Search failed", type: "error" });
    } finally {
      setSearching(false);
    }
  };

  const selectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchQuery("");
    // Auto-fill DOB in words
    if (student.dateOfBirth) {
      const d = new Date(student.dateOfBirth);
      const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
      setForm((prev) => ({ ...prev, dobInWords: d.toLocaleDateString("en-IN", options) }));
    }
  };

  // ─── Generate TC ───────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedStudent) return;
    setGenerating(true);
    try {
      const res = await axios.post("/api/certificate/tc", {
        studentId: selectedStudent.id,
        ...form,
      }, { headers });

      setToast({ message: `TC Generated! Serial No: ${res.data.data?.serialNumber || "N/A"}`, type: "success" });
      setShowPrintPreview(true);
      fetchHistory();
    } catch {
      setToast({ message: "Failed to generate TC", type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="page-container space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <GraduationCap className="text-amber-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfer Certificate</h1>
          <p className="text-sm text-gray-500">Generate and manage transfer certificates</p>
        </div>
      </div>

      {/* Student Search */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Search size={16} />
          Search Student
        </h3>
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by name or admission number..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition font-medium text-sm"
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Search
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-3 border rounded-lg divide-y max-h-48 overflow-y-auto">
            {searchResults.map((s) => (
              <button
                key={s.id}
                onClick={() => selectStudent(s)}
                className="w-full px-4 py-3 text-left hover:bg-amber-50 transition flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-gray-500">
                    Adm No: {s.admissionNo} | Class: {s.class?.name || "—"} {s.section?.name || ""}
                  </p>
                </div>
                <span className="text-xs text-amber-600 font-medium">Select</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Student + TC Form */}
      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Info Card */}
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={16} />
              Student Information
            </h3>
            <div className="space-y-3">
              <InfoRow label="Name" value={`${selectedStudent.firstName} ${selectedStudent.lastName}`} />
              <InfoRow label="Admission No" value={selectedStudent.admissionNo} />
              <InfoRow label="Father's Name" value={selectedStudent.fatherName || "—"} />
              <InfoRow label="Class" value={`${selectedStudent.class?.name || "—"} - ${selectedStudent.section?.name || ""}`} />
              <InfoRow label="Admission Date" value={formatDate(selectedStudent.admissionDate)} />
              <InfoRow label="Date of Birth" value={formatDate(selectedStudent.dateOfBirth)} />
              <InfoRow label="Gender" value={selectedStudent.gender || "—"} />
            </div>
            <button
              onClick={() => { setSelectedStudent(null); setForm({ leavingDate: new Date().toISOString().split("T")[0], reason: "TRANSFER", character: "GOOD", conduct: "GOOD", examPassed: "", dobInWords: "", remarks: "" }); }}
              className="mt-4 text-xs text-red-500 hover:text-red-700 font-medium"
            >
              ✕ Clear Selection
            </button>
          </div>

          {/* TC Form */}
          <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-6 space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <FileText size={16} />
              TC Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Leaving Date *</label>
                <input
                  type="date"
                  value={form.leavingDate}
                  onChange={(e) => setForm({ ...form, leavingDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for Leaving</label>
                <select
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="TRANSFER">Transfer to another school</option>
                  <option value="LEAVING">Leaving the area</option>
                  <option value="PASSED_OUT">Passed out (completed)</option>
                  <option value="MIGRATION">Migration</option>
                  <option value="WITHDRAWAL">Voluntary withdrawal</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Character</label>
                <select
                  value={form.character}
                  onChange={(e) => setForm({ ...form, character: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="SATISFACTORY">Satisfactory</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Conduct</label>
                <select
                  value={form.conduct}
                  onChange={(e) => setForm({ ...form, conduct: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="SATISFACTORY">Satisfactory</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Exam Passed</label>
                <input
                  type="text"
                  value={form.examPassed}
                  onChange={(e) => setForm({ ...form, examPassed: e.target.value })}
                  placeholder="e.g., Class IX Annual Exam 2025"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth (in words)</label>
                <input
                  type="text"
                  value={form.dobInWords}
                  onChange={(e) => setForm({ ...form, dobInWords: e.target.value })}
                  placeholder="e.g., Fifteenth March Two Thousand Ten"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
              <textarea
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                rows={3}
                placeholder="Any additional remarks..."
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition font-medium text-sm shadow-sm"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                {generating ? "Generating..." : "Generate TC"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TC History */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={16} />
            Generated TC History
          </h3>
        </div>

        {loadingHistory ? (
          <div className="p-8 flex justify-center">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : tcHistory.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No transfer certificates generated yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Leaving Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tcHistory.map((tc) => (
                  <tr key={tc.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm font-mono font-medium text-gray-900">
                        <Hash size={12} className="text-gray-400" />
                        {tc.serialNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{tc.studentName}</p>
                      <p className="text-xs text-gray-400">{tc.admissionNo}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{tc.className}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{formatDate(tc.leavingDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{tc.reason}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tc.status === "ISSUED" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
                      }`}>
                        {tc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Print">
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print Preview Modal */}
      {showPrintPreview && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">TC Print Preview</h3>
              <button onClick={() => setShowPrintPreview(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-8 space-y-4 text-sm">
              <div className="text-center border-b pb-4">
                <h2 className="text-lg font-bold">TRANSFER CERTIFICATE</h2>
                <p className="text-gray-500">TC Serial No: AUTO-GENERATED</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <p><strong>Student Name:</strong> {selectedStudent.firstName} {selectedStudent.lastName}</p>
                <p><strong>Admission No:</strong> {selectedStudent.admissionNo}</p>
                <p><strong>Father's Name:</strong> {selectedStudent.fatherName || "—"}</p>
                <p><strong>Class:</strong> {selectedStudent.class?.name} - {selectedStudent.section?.name}</p>
                <p><strong>Date of Birth:</strong> {form.dobInWords}</p>
                <p><strong>Date of Admission:</strong> {formatDate(selectedStudent.admissionDate)}</p>
                <p><strong>Date of Leaving:</strong> {formatDate(form.leavingDate)}</p>
                <p><strong>Reason:</strong> {form.reason}</p>
                <p><strong>Character:</strong> {form.character}</p>
                <p><strong>Conduct:</strong> {form.conduct}</p>
                <p><strong>Exam Passed:</strong> {form.examPassed || "—"}</p>
              </div>
              {form.remarks && <p><strong>Remarks:</strong> {form.remarks}</p>}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button
                onClick={() => setShowPrintPreview(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition"
              >
                <Printer size={16} />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper Component ────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
