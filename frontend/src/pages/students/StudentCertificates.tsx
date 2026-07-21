import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Award,
  Search,
  Download,
  Printer,
  Eye,
  FileText,
  Clock,
  Loader2,
  X,
  Calendar,
  User,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { PageHeader, LoadingSkeleton, EmptyState } from "../../components/enterprise";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface StudentSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  fatherName: string;
  enrollments: { class: { name: string }; section: { name: string } }[];
}

interface CertificateHistory {
  id: string;
  type: string;
  certificateNo: string;
  generatedAt: string;
  generatedBy: string;
  purpose: string;
}

type CertificateType = "bonafide" | "character" | "leaving" | "migration" | "study" | "custom";

const CERTIFICATE_TYPES: { value: CertificateType; label: string; description: string; icon: string }[] = [
  { value: "bonafide", label: "Bonafide Certificate", description: "Proof of enrollment in institution", icon: "🎓" },
  { value: "character", label: "Character Certificate", description: "Conduct and character reference", icon: "⭐" },
  { value: "leaving", label: "Leaving Certificate", description: "Certificate issued on leaving school", icon: "📋" },
  { value: "migration", label: "Migration Certificate", description: "For board/university transfer", icon: "🔄" },
  { value: "study", label: "Study Certificate", description: "Proof of study period", icon: "📖" },
  { value: "custom", label: "Custom Certificate", description: "Generate from custom template", icon: "✏️" },
];

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

function authHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
}

export default function StudentCertificates() {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get("studentId");

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
  const [selectedType, setSelectedType] = useState<CertificateType | "">("");
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState<CertificateHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Certificate options
  const [options, setOptions] = useState({
    purpose: "",
    issueDate: new Date().toISOString().split("T")[0],
    conduct: "good",
    remarks: "",
  });

  // ─── Pre-select student from URL params ────────────────────
  useEffect(() => {
    if (preselectedId) {
      const fetch = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/students/${preselectedId}`, authHeaders());
          if (res.data.success) setSelectedStudent(res.data.data);
        } catch {}
      };
      fetch();
    }
  }, [preselectedId]);

  // ─── Search Students ───────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/students?search=${encodeURIComponent(searchQuery)}&limit=8`,
          authHeaders()
        );
        setSearchResults(res.data.data?.students || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // ─── Load Certificate History ──────────────────────────────
  useEffect(() => {
    if (!selectedStudent) {
      setHistory([]);
      return;
    }
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/students/certificates/${selectedStudent.id}/certificate-history`,
          authHeaders()
        );
        setHistory(res.data.data || []);
      } catch {
        setHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [selectedStudent]);

  // ─── Generate Certificate ──────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedStudent || !selectedType) {
      toast.error("Please select a student and certificate type");
      return;
    }

    setGenerating(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/students/certificates/${selectedStudent.id}/certificate/${selectedType}`,
        {
          purpose: options.purpose,
          issueDate: options.issueDate,
          conduct: options.conduct,
          remarks: options.remarks,
        },
        { ...authHeaders(), responseType: "blob" }
      );

      // Create blob URL for preview
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewOpen(true);
      toast.success("Certificate generated successfully!");

      // Refresh history
      const histRes = await axios.get(
        `${API_BASE_URL}/api/students/certificates/${selectedStudent.id}/certificate-history`,
        authHeaders()
      );
      setHistory(histRes.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate certificate");
    } finally {
      setGenerating(false);
    }
  };

  // ─── Download ──────────────────────────────────────────────
  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `${selectedType}_certificate_${selectedStudent?.admissionNo || "student"}.pdf`;
    link.click();
  };

  // ─── Print ─────────────────────────────────────────────────
  const handlePrint = () => {
    if (!previewUrl) return;
    const printWindow = window.open(previewUrl, "_blank");
    if (printWindow) {
      printWindow.onload = () => printWindow.print();
    }
  };

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Certificate Generation"
        subtitle="Generate official certificates for students"
        icon={<Award className="w-6 h-6" />}
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Selection */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              Select Student
            </h3>

            {selectedStudent ? (
              <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedStudent.admissionNo} | {selectedStudent.enrollments?.[0]?.class?.name || ""} - {selectedStudent.enrollments?.[0]?.section?.name || ""}
                  </p>
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
                  placeholder="Search student..."
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
                        <span className="font-medium text-slate-900 dark:text-white">{s.firstName} {s.lastName}</span>
                        <span className="text-slate-400 ml-2">({s.admissionNo})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Certificate Type Selection */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Certificate Type
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CERTIFICATE_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    selectedType === type.value
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{type.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{type.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Certificate Options */}
          {selectedType && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Options
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Purpose</label>
                  <input
                    type="text"
                    value={options.purpose}
                    onChange={(e) => setOptions((prev) => ({ ...prev, purpose: e.target.value }))}
                    placeholder="e.g., Bank Account Opening"
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={options.issueDate}
                    onChange={(e) => setOptions((prev) => ({ ...prev, issueDate: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {(selectedType === "character" || selectedType === "leaving") && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Conduct</label>
                    <select
                      value={options.conduct}
                      onChange={(e) => setOptions((prev) => ({ ...prev, conduct: e.target.value }))}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="excellent">Excellent</option>
                      <option value="very good">Very Good</option>
                      <option value="good">Good</option>
                      <option value="satisfactory">Satisfactory</option>
                    </select>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                  <textarea
                    value={options.remarks}
                    onChange={(e) => setOptions((prev) => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Additional remarks..."
                    rows={2}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!selectedStudent || !selectedType || generating}
                className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl px-6 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Award className="w-5 h-5" />
                    Generate Certificate
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: History */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Certificate History
            </h3>

            {loadingHistory ? (
              <LoadingSkeleton variant="list" count={4} />
            ) : history.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                {selectedStudent ? "No certificates generated yet" : "Select a student to view history"}
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">{cert.type}</span>
                      <span className="text-xs text-slate-400">{new Date(cert.generatedAt).toLocaleDateString("en-IN")}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">No: {cert.certificateNo}</p>
                    {cert.purpose && <p className="text-xs text-slate-400 mt-0.5">Purpose: {cert.purpose}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewOpen && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">Certificate Preview</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={() => { setPreviewOpen(false); URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={previewUrl}
                className="w-full h-full rounded-lg border border-slate-200 dark:border-slate-700"
                title="Certificate Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
