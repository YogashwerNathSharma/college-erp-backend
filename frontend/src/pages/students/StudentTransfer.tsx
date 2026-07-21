import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowRightCircle,
  Search,
  User,
  Calendar,
  FileText,
  Building2,
  AlertTriangle,
  Loader2,
  CheckCircle,
  X,
  Download,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { PageHeader, ConfirmDialog, LoadingSkeleton } from "../../components/enterprise";
import { getFullUrl } from "../../utils/url";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface StudentSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  admissionNo: string;
  photoUrl: string | null;
  fatherName: string;
  status: string;
  enrollments: {
    class: { id: string; name: string };
    section: { id: string; name: string };
  }[];
}

interface TransferFormData {
  reason: string;
  destinationSchool: string;
  destinationAddress: string;
  effectiveDate: string;
  generateTC: boolean;
  remarks: string;
  conductCertificate: string;
  feesClearance: boolean;
  libraryClearance: boolean;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

function authHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
}

export default function StudentTransfer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get("studentId");

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState<{ tcUrl?: string } | null>(null);

  const [formData, setFormData] = useState<TransferFormData>({
    reason: "",
    destinationSchool: "",
    destinationAddress: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    generateTC: true,
    remarks: "",
    conductCertificate: "good",
    feesClearance: false,
    libraryClearance: false,
  });

  // ─── Pre-select student from URL params ────────────────────
  useEffect(() => {
    if (preselectedId) {
      const fetchStudent = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/students/${preselectedId}`, authHeaders());
          if (res.data.success) {
            setSelectedStudent(res.data.data);
          }
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
      setSearching(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/students?search=${encodeURIComponent(searchQuery)}&status=active&limit=10`,
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

  // ─── Handle Transfer ───────────────────────────────────────
  const handleTransfer = async () => {
    if (!selectedStudent) return;
    setConfirmOpen(false);
    setSubmitting(true);

    try {
      const payload = {
        studentId: selectedStudent.id,
        reason: formData.reason,
        destinationSchool: formData.destinationSchool,
        destinationAddress: formData.destinationAddress,
        effectiveDate: formData.effectiveDate,
        generateTC: formData.generateTC,
        remarks: formData.remarks,
        conductCertificate: formData.conductCertificate,
        feesClearance: formData.feesClearance,
        libraryClearance: formData.libraryClearance,
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/students/operations/${selectedStudent.id}/transfer`,
        payload,
        authHeaders()
      );

      if (res.data.success) {
        toast.success("Student transferred successfully!");
        setTransferSuccess({ tcUrl: res.data.data?.tcUrl });
      } else {
        toast.error(res.data.message || "Transfer failed");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Validation ─────────────────────────────────────────────
  const canSubmit =
    selectedStudent &&
    formData.reason.trim() &&
    formData.destinationSchool.trim() &&
    formData.effectiveDate;

  // ─── Success View ──────────────────────────────────────────
  if (transferSuccess) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Transfer Complete</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {selectedStudent?.firstName} {selectedStudent?.lastName} has been successfully transferred to{" "}
            <span className="font-medium">{formData.destinationSchool}</span>.
          </p>

          {transferSuccess.tcUrl && (
            <a
              href={transferSuccess.tcUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors mb-6"
            >
              <Download className="w-4 h-4" />
              Download Transfer Certificate
            </a>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => navigate("/students")}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl px-4 py-3 transition-colors"
            >
              Back to Students
            </button>
            <button
              onClick={() => {
                setTransferSuccess(null);
                setSelectedStudent(null);
                setFormData({
                  reason: "",
                  destinationSchool: "",
                  destinationAddress: "",
                  effectiveDate: new Date().toISOString().split("T")[0],
                  generateTC: true,
                  remarks: "",
                  conductCertificate: "good",
                  feesClearance: false,
                  libraryClearance: false,
                });
              }}
              className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-xl px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Transfer Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Form ─────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Student Transfer"
        subtitle="Transfer a student to another school with Transfer Certificate"
        icon={<ArrowRightCircle className="w-6 h-6" />}
      />

      <div className="mt-6 space-y-6">
        {/* Student Selection */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-indigo-500" />
            Select Student
          </h3>

          {selectedStudent ? (
            <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 dark:text-white">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Adm: {selectedStudent.admissionNo} | Class: {selectedStudent.enrollments?.[0]?.class?.name || "—"} - {selectedStudent.enrollments?.[0]?.section?.name || "—"}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors"
              >
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
                placeholder="Search by student name or admission number..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
              )}

              {/* Search Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                  {searchResults.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => {
                        setSelectedStudent(student);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left border-b last:border-b-0 border-slate-100 dark:border-slate-700"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-slate-500">{student.admissionNo} | {student.enrollments?.[0]?.class?.name || ""}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transfer Details */}
        {selectedStudent && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-indigo-500" />
              Transfer Details
            </h3>

            <div className="space-y-4">
              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Reason for Transfer <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Reason</option>
                  <option value="Parent Transfer">Parent Transfer (Job relocation)</option>
                  <option value="Better Opportunity">Better Opportunity</option>
                  <option value="Relocation">Family Relocation</option>
                  <option value="Financial">Financial Reasons</option>
                  <option value="Health">Health Reasons</option>
                  <option value="Discipline">Disciplinary Action</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Destination School */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Destination School <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.destinationSchool}
                    onChange={(e) => setFormData((prev) => ({ ...prev, destinationSchool: e.target.value }))}
                    placeholder="Name of the receiving school"
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    School Address
                  </label>
                  <input
                    type="text"
                    value={formData.destinationAddress}
                    onChange={(e) => setFormData((prev) => ({ ...prev, destinationAddress: e.target.value }))}
                    placeholder="City / State"
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Effective Date & Conduct */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Effective Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, effectiveDate: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Conduct & Character
                  </label>
                  <select
                    value={formData.conductCertificate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, conductCertificate: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="very good">Very Good</option>
                    <option value="good">Good</option>
                    <option value="satisfactory">Satisfactory</option>
                  </select>
                </div>
              </div>

              {/* Clearances */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.feesClearance}
                    onChange={(e) => setFormData((prev) => ({ ...prev, feesClearance: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Fees Cleared</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.libraryClearance}
                    onChange={(e) => setFormData((prev) => ({ ...prev, libraryClearance: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Library Books Returned</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.generateTC}
                    onChange={(e) => setFormData((prev) => ({ ...prev, generateTC: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Generate Transfer Certificate</span>
                </label>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Additional notes about the transfer..."
                  rows={3}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Warning */}
              {!formData.feesClearance && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Fees Not Cleared</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      Student has pending fee balance. Transfer can still proceed but will be noted in records.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={!canSubmit || submitting}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold rounded-xl px-6 py-3.5 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Transfer...
                    </>
                  ) : (
                    <>
                      <ArrowRightCircle className="w-5 h-5" />
                      Transfer Student
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmOpen && (
        <ConfirmDialog
          open={confirmOpen}
          title="Confirm Student Transfer"
          message={`Are you sure you want to transfer ${selectedStudent?.firstName} ${selectedStudent?.lastName} (${selectedStudent?.admissionNo}) to ${formData.destinationSchool}? This action will mark the student as "transferred" and ${formData.generateTC ? "generate a Transfer Certificate" : "NOT generate a TC"}.`}
          confirmLabel="Yes, Transfer"
          variant="danger"
          onConfirm={handleTransfer}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
