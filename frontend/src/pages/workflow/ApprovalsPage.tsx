import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getFullUrl } from "../../utils/url";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  FileText,
  UserCheck,
  IndianRupee,
  GraduationCap,
  ChevronDown,
  AlertCircle,
  Search,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// APPROVALS PAGE — List pending/resolved approvals
// ═══════════════════════════════════════════════════════════════

interface ApprovalItem {
  id: string;
  type: string;
  status: string;
  entityId: string;
  entityType: string;
  requesterId: string;
  requesterName: string;
  approverId?: string;
  approverName?: string;
  data?: any;
  remarks?: string;
  requestedAt: string;
  resolvedAt?: string;
}

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  byType: { type: string; count: number }[];
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  MARKS: { label: "Marks Approval", icon: <FileText size={16} />, color: "bg-blue-50 text-blue-700" },
  LEAVE: { label: "Leave Approval", icon: <Clock size={16} />, color: "bg-purple-50 text-purple-700" },
  FEE_EDIT: { label: "Fee Edit", icon: <IndianRupee size={16} />, color: "bg-amber-50 text-amber-700" },
  ADMISSION: { label: "Admission", icon: <GraduationCap size={16} />, color: "bg-green-50 text-green-700" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pending", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: <Clock size={14} /> },
  APPROVED: { label: "Approved", color: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 size={14} /> },
  REJECTED: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200", icon: <XCircle size={14} /> },
};

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [remarksModal, setRemarksModal] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const canApprove = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HR_MANAGER"].includes(user?.role);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 15 };
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await axios.get(getFullUrl("/api/approvals"), { params });
      if (res.data?.success) {
        setItems(res.data.data.items || []);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch (error) {
      console.warn("Failed to fetch approvals:", error);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(getFullUrl("/api/approvals/stats"));
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch {
      // Stats are optional
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
    fetchStats();
  }, [fetchApprovals, fetchStats]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      setActionLoading(true);
      const res = await axios.post(getFullUrl(`/api/approvals/${id}/${action}`), {
        remarks: remarks || undefined,
      });
      if (res.data?.success) {
        toast.success(action === "approve" ? "Approved successfully" : "Rejected");
        setRemarksModal(null);
        setRemarks("");
        fetchApprovals();
        fetchStats();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to ${action}`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Approval Queue</h2>
          <p className="text-sm text-gray-500 mt-1">Manage pending approvals for marks, leave, fees, and admissions</p>
        </div>
        <button
          onClick={() => {
            fetchApprovals();
            fetchStats();
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-yellow-600" />
              <p className="text-xs font-medium text-gray-500">Pending</p>
            </div>
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={16} className="text-green-600" />
              <p className="text-xs font-medium text-gray-500">Approved</p>
            </div>
            <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle size={16} className="text-red-600" />
              <p className="text-xs font-medium text-gray-500">Rejected</p>
            </div>
            <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={16} className="text-gray-500" />
              <p className="text-xs font-medium text-gray-500">Total</p>
            </div>
            <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-500">Filters:</span>
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Types</option>
          <option value="MARKS">Marks</option>
          <option value="LEAVE">Leave</option>
          <option value="FEE_EDIT">Fee Edit</option>
          <option value="ADMISSION">Admission</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-indigo-500 animate-spin" />
            <p className="text-sm text-gray-400 mt-3">Loading approvals...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-400">
            <CheckCircle2 size={48} className="mb-3 opacity-30" />
            <p className="text-base font-medium">No approvals found</p>
            <p className="text-sm mt-1">
              {statusFilter === "PENDING" ? "All caught up! No pending approvals." : "No matching records."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Requested By</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Entity</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Requested</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Remarks</th>
                  {canApprove && (
                    <th className="text-center py-3 px-4 text-gray-500 font-medium">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const typeConf = TYPE_CONFIG[item.type] || {
                    label: item.type,
                    icon: <FileText size={16} />,
                    color: "bg-gray-50 text-gray-700",
                  };
                  const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;

                  return (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${typeConf.color}`}>
                          {typeConf.icon}
                          {typeConf.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-800 font-medium">{item.requesterName}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs font-mono">{item.entityType}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${statusConf.color}`}>
                          {statusConf.icon}
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(item.requestedAt)}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs max-w-[150px] truncate">
                        {item.remarks || "—"}
                      </td>
                      {canApprove && (
                        <td className="py-3 px-4">
                          {item.status === "PENDING" ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setRemarksModal({ id: item.id, action: "approve" })}
                                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRemarksModal({ id: item.id, action: "reject" })}
                                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              {item.approverName ? `By ${item.approverName}` : "—"}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Remarks Modal */}
      {remarksModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {remarksModal.action === "approve" ? "Approve Request" : "Reject Request"}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks (optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add a note..."
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setRemarksModal(null);
                  setRemarks("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(remarksModal.id, remarksModal.action)}
                disabled={actionLoading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
                  remarksModal.action === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {actionLoading
                  ? "Processing..."
                  : remarksModal.action === "approve"
                  ? "Confirm Approve"
                  : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
