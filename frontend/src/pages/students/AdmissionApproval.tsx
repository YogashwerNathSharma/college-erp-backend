import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileCheck,
  Clock,
  AlertTriangle,
  Loader2,
  X,
  Users,
  CheckSquare,
  Square,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { PageHeader, StatusBadge, ConfirmDialog, LoadingSkeleton, EmptyState } from "../../components/enterprise";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface PendingStudent {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  admissionNo: string;
  admissionStatus: string;
  admissionDate: string;
  gender: string;
  fatherName: string;
  fatherPhone: string;
  phone: string;
  email: string;
  photoUrl: string | null;
  enrollments: {
    class: { id: string; name: string };
    section: { id: string; name: string };
  }[];
}

interface ClassItem {
  id: string;
  name: string;
}

interface DetailModalData {
  student: PendingStudent | null;
  open: boolean;
}

interface RejectDialogData {
  open: boolean;
  studentId: string;
  reason: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  verified: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

function authHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function AdmissionApproval() {
  const navigate = useNavigate();

  // State
  const [students, setStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [processing, setProcessing] = useState<string | null>(null);

  // Filters
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [detailModal, setDetailModal] = useState<DetailModalData>({ student: null, open: false });
  const [rejectDialog, setRejectDialog] = useState<RejectDialogData>({ open: false, studentId: "", reason: "" });
  const [bulkApproveConfirm, setBulkApproveConfirm] = useState(false);

  // ─── Fetch Students ────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "25");
      if (filterStatus) params.append("admissionStatus", filterStatus);
      if (filterClass) params.append("classId", filterClass);
      if (searchQuery) params.append("search", searchQuery);
      if (filterDateFrom) params.append("dateFrom", filterDateFrom);
      if (filterDateTo) params.append("dateTo", filterDateTo);

      const res = await axios.get(
        `${API_BASE_URL}/api/students?${params.toString()}`,
        authHeaders()
      );

      const data = res.data.data;
      setStudents(data.students || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err: any) {
      toast.error("Failed to load admission queue");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterClass, searchQuery, filterDateFrom, filterDateTo]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/classes`, authHeaders());
        setClasses(res.data.data || res.data || []);
      } catch {}
    };
    fetchClasses();
  }, []);

  // ─── Actions ───────────────────────────────────────────────
  const handleApprove = async (studentId: string) => {
    setProcessing(studentId);
    try {
      await axios.post(
        `${API_BASE_URL}/api/students/operations/${studentId}/status`,
        { admissionStatus: "approved", status: "active" },
        authHeaders()
      );
      toast.success("Admission approved!");
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.studentId || !rejectDialog.reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setProcessing(rejectDialog.studentId);
    try {
      await axios.post(
        `${API_BASE_URL}/api/students/operations/${rejectDialog.studentId}/status`,
        { admissionStatus: "rejected", statusReason: rejectDialog.reason, status: "inactive" },
        authHeaders()
      );
      toast.success("Admission rejected");
      setRejectDialog({ open: false, studentId: "", reason: "" });
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject");
    } finally {
      setProcessing(null);
    }
  };

  const handleVerify = async (studentId: string) => {
    setProcessing(studentId);
    try {
      await axios.post(
        `${API_BASE_URL}/api/students/operations/${studentId}/status`,
        { admissionStatus: "verified" },
        authHeaders()
      );
      toast.success("Documents verified!");
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setBulkApproveConfirm(false);
    setProcessing("bulk");
    try {
      await axios.post(
        `${API_BASE_URL}/api/students/operations/bulk-status`,
        { studentIds: Array.from(selectedIds), admissionStatus: "approved", status: "active" },
        authHeaders()
      );
      toast.success(`${selectedIds.size} admissions approved!`);
      setSelectedIds(new Set());
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Bulk approval failed");
    } finally {
      setProcessing(null);
    }
  };

  // ─── Selection ─────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  };

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Admission Approval"
        subtitle={`${total} admission(s) in queue`}
        icon={<Shield className="w-6 h-6" />}
        actions={
          selectedIds.size > 0 && (
            <button
              onClick={() => setBulkApproveConfirm(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Approve Selected ({selectedIds.size})
            </button>
          )
        }
      />

      {/* Filters Bar */}
      <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Name or Admission No..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Status */}
          <div className="min-w-[150px]">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Class */}
          <div className="min-w-[150px]">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Class</label>
            <select
              value={filterClass}
              onChange={(e) => { setFilterClass(e.target.value); setPage(1); }}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">From</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
            />
          </div>

          {/* Date To */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">To</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton variant="table" count={8} />
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-12 h-12" />}
            title="No Pending Admissions"
            description="All admissions have been processed or no records match your filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-indigo-500 transition-colors">
                      {selectedIds.size === students.length ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Adm. No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Parent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {students.map((student) => {
                  const enrollment = student.enrollments?.[0];
                  const isSelected = selectedIds.has(student.id);
                  const isProcessing = processing === student.id || processing === "bulk";

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${isSelected ? "bg-indigo-50 dark:bg-indigo-900/10" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(student.id)} className="text-slate-400 hover:text-indigo-500">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-700 dark:text-slate-300">
                        {student.admissionNo}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{student.firstName} {student.lastName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{student.gender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {enrollment ? `${enrollment.class.name} - ${enrollment.section.name}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700 dark:text-slate-300">{student.fatherName}</p>
                        <p className="text-xs text-slate-400">{student.fatherPhone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(student.admissionDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[student.admissionStatus || "pending"]}`}>
                          {student.admissionStatus === "pending" && <Clock className="w-3 h-3" />}
                          {student.admissionStatus === "approved" && <CheckCircle className="w-3 h-3" />}
                          {student.admissionStatus === "rejected" && <XCircle className="w-3 h-3" />}
                          {student.admissionStatus === "verified" && <FileCheck className="w-3 h-3" />}
                          {(student.admissionStatus || "pending").charAt(0).toUpperCase() + (student.admissionStatus || "pending").slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* View */}
                          <button
                            onClick={() => setDetailModal({ student, open: true })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Verify */}
                          {student.admissionStatus === "pending" && (
                            <button
                              onClick={() => handleVerify(student.id)}
                              disabled={isProcessing}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                              title="Verify Documents"
                            >
                              <FileCheck className="w-4 h-4" />
                            </button>
                          )}
                          {/* Approve */}
                          {(student.admissionStatus === "pending" || student.admissionStatus === "verified") && (
                            <button
                              onClick={() => handleApprove(student.id)}
                              disabled={isProcessing}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {/* Reject */}
                          {student.admissionStatus !== "rejected" && student.admissionStatus !== "approved" && (
                            <button
                              onClick={() => setRejectDialog({ open: true, studentId: student.id, reason: "" })}
                              disabled={isProcessing}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && students.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Showing {(page - 1) * 25 + 1}-{Math.min(page * 25, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal.open && detailModal.student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Admission Details</h3>
              <button onClick={() => setDetailModal({ student: null, open: false })} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500">Full Name</span>
                  <p className="font-medium text-slate-900 dark:text-white">{detailModal.student.firstName} {detailModal.student.lastName}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Admission No</span>
                  <p className="font-medium text-indigo-600">{detailModal.student.admissionNo}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Gender</span>
                  <p className="font-medium text-slate-900 dark:text-white">{detailModal.student.gender}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Admission Date</span>
                  <p className="font-medium text-slate-900 dark:text-white">{new Date(detailModal.student.admissionDate).toLocaleDateString("en-IN")}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Father</span>
                  <p className="font-medium text-slate-900 dark:text-white">{detailModal.student.fatherName}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Phone</span>
                  <p className="font-medium text-slate-900 dark:text-white">{detailModal.student.fatherPhone}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Class</span>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {detailModal.student.enrollments?.[0]?.class?.name || "—"} - {detailModal.student.enrollments?.[0]?.section?.name || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Email</span>
                  <p className="font-medium text-slate-900 dark:text-white">{detailModal.student.email || "—"}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => { setDetailModal({ student: null, open: false }); navigate(`/students/${detailModal.student!.id}`); }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
                >
                  View Full Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {rejectDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Reject Admission</h3>
                  <p className="text-sm text-slate-500">Please provide a reason for rejection</p>
                </div>
              </div>
              <textarea
                value={rejectDialog.reason}
                onChange={(e) => setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for rejection..."
                rows={4}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setRejectDialog({ open: false, studentId: "", reason: "" })}
                  className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectDialog.reason.trim() || processing === rejectDialog.studentId}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing === rejectDialog.studentId ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Approve Confirm */}
      {bulkApproveConfirm && (
        <ConfirmDialog
          open={bulkApproveConfirm}
          title="Bulk Approve Admissions"
          message={`Are you sure you want to approve ${selectedIds.size} admission(s)?`}
          confirmLabel="Approve All"
          variant="success"
          onConfirm={handleBulkApprove}
          onCancel={() => setBulkApproveConfirm(false)}
        />
      )}
    </div>
  );
}
