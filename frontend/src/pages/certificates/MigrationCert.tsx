import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  ArrowRightLeft,
  Search,
  Printer,
  User,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Clock,
  Download,
  FileText,
  MapPin,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  admissionDate: string;
  fatherName: string;
  dateOfBirth: string;
  class?: { name: string };
  section?: { name: string };
  gender?: string;
}

interface MigrationRecord {
  id: string;
  studentName: string;
  admissionNo: string;
  className: string;
  destination: string;
  reason: string;
  generatedAt: string;
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
export default function MigrationCert() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState<MigrationRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState({
    destination: "",
    destinationType: "UNIVERSITY",
    reason: "",
    boardUniversity: "",
    remarks: "",
  });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ─── Fetch History ─────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get("/api/certificate/migration", { headers });
      setHistory(res.data.data || []);
    } catch {
      // silent
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ─── Search ────────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await axios.get("/api/certificate/migration/search-students", {
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
  };

  // ─── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedStudent) return;
    if (!form.destination.trim()) {
      setToast({ message: "Please enter the destination institution", type: "error" });
      return;
    }

    setGenerating(true);
    try {
      await axios.post("/api/certificate/migration", {
        studentId: selectedStudent.id,
        ...form,
      }, { headers });

      setToast({ message: "Migration certificate generated!", type: "success" });
      setShowPreview(true);
      fetchHistory();
    } catch {
      setToast({ message: "Failed to generate certificate", type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="page-container space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-sky-100 rounded-lg">
          <ArrowRightLeft className="text-sky-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Migration Certificate</h1>
          <p className="text-sm text-gray-500">Generate migration certificates for board/university transfer</p>
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
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 transition font-medium text-sm"
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
                className="w-full px-4 py-3 text-left hover:bg-sky-50 transition flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-gray-500">
                    Adm No: {s.admissionNo} | Class: {s.class?.name || "—"} {s.section?.name || ""}
                  </p>
                </div>
                <span className="text-xs text-sky-600 font-medium">Select</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Student + Form */}
      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Info */}
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
              <InfoRow label="Date of Birth" value={formatDate(selectedStudent.dateOfBirth)} />
              <InfoRow label="Admission Date" value={formatDate(selectedStudent.admissionDate)} />
            </div>
            <button
              onClick={() => setSelectedStudent(null)}
              className="mt-4 text-xs text-red-500 hover:text-red-700 font-medium"
            >
              ✕ Clear Selection
            </button>
          </div>

          {/* Migration Form */}
          <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-6 space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <MapPin size={16} />
              Migration Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination Institution *</label>
                <input
                  type="text"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  placeholder="e.g., Delhi University, CBSE Board, IIT Delhi"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination Type</label>
                <select
                  value={form.destinationType}
                  onChange={(e) => setForm({ ...form, destinationType: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="UNIVERSITY">University</option>
                  <option value="BOARD">Board</option>
                  <option value="COLLEGE">College</option>
                  <option value="SCHOOL">School</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Board/University</label>
                <input
                  type="text"
                  value={form.boardUniversity}
                  onChange={(e) => setForm({ ...form, boardUniversity: e.target.value })}
                  placeholder="e.g., CBSE, UP Board"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for Migration</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={3}
                placeholder="e.g., Seeking admission in higher education, Relocation to another state"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks (Optional)</label>
              <input
                type="text"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Any additional remarks"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 transition font-medium text-sm shadow-sm"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                {generating ? "Generating..." : "Generate Certificate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={16} />
            Certificate History
          </h3>
        </div>

        {loadingHistory ? (
          <div className="p-8 flex justify-center">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center">
            <ArrowRightLeft size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No migration certificates generated yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Generated</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{cert.studentName}</p>
                      <p className="text-xs text-gray-400">{cert.admissionNo}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{cert.className}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">{cert.destination}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{cert.reason}</td>
                    <td className="px-4 py-3 text-xs text-center text-gray-500">{formatDate(cert.generatedAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition" title="Download">
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
      {showPreview && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Migration Certificate Preview</h3>
              <button onClick={() => setShowPreview(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-8 space-y-6 text-sm">
              <div className="text-center border-b pb-4">
                <h2 className="text-lg font-bold uppercase">Migration Certificate</h2>
              </div>
              <p className="leading-relaxed text-gray-700">
                This is to certify that <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong>,
                {selectedStudent.fatherName && <> son/daughter of <strong>{selectedStudent.fatherName}</strong>,</>}
                {" "}bearing Admission No. <strong>{selectedStudent.admissionNo}</strong>,
                was a bonafide student of Class <strong>{selectedStudent.class?.name || "—"}</strong> of this institution.
              </p>
              <p className="leading-relaxed text-gray-700">
                The student is migrating to <strong>{form.destination}</strong>
                {form.reason && <> for the reason: <strong>{form.reason}</strong></>}.
              </p>
              {form.boardUniversity && (
                <p className="leading-relaxed text-gray-700">
                  The student was registered under <strong>{form.boardUniversity}</strong> board/university.
                </p>
              )}
              <p className="text-gray-700">
                This certificate is issued to facilitate the student's admission at the above-mentioned institution.
                We have no objection to the migration.
              </p>
              {form.remarks && (
                <p className="text-gray-700"><strong>Remarks:</strong> {form.remarks}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition"
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
