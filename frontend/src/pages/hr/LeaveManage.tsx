import { useState, useEffect } from "react";
import axios from "axios";
import {
  Calendar, CheckCircle2, XCircle, Clock, MessageSquare,
  Home, ChevronRight, Loader2, X, AlertCircle, Users, Filter
} from "lucide-react";

interface LeaveRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  leaveType: "CASUAL" | "SICK" | "EARNED" | "MATERNITY" | "PATERNITY" | "UNPAID";
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  appliedOn: string;
  comment?: string;
}

interface LeaveBalance {
  employeeName: string;
  employeeId: string;
  casual: { total: number; used: number };
  sick: { total: number; used: number };
  earned: { total: number; used: number };
}

type Tab = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

export default function LeaveManage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("PENDING");
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [actionTarget, setActionTarget] = useState<{ id: string; action: "APPROVED" | "REJECTED" } | null>(null);
  const [comment, setComment] = useState("");
  const [showBalances, setShowBalances] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    setError("");
    try {
      const [leavesRes, balancesRes] = await Promise.all([
        axios.get("/api/hr/leave", { headers }),
        axios.get("/api/hr/leave/balances", { headers }).catch(() => ({ data: { data: [] } })),
      ]);
      setLeaves(leavesRes.data.data || []);
      setBalances(balancesRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch leave data");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionTarget) return;
    try {
      await axios.patch(`/api/hr/leave/${actionTarget.id}`, {
        status: actionTarget.action,
        comment,
      }, { headers });
      setSuccess(`Leave ${actionTarget.action.toLowerCase()} successfully`);
      setTimeout(() => setSuccess(""), 3000);
      setShowCommentModal(false);
      setActionTarget(null);
      setComment("");
      fetchLeaves();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update leave");
    }
  };

  const openActionModal = (id: string, action: "APPROVED" | "REJECTED") => {
    setActionTarget({ id, action });
    setShowCommentModal(true);
  };

  const filteredLeaves = activeTab === "ALL" ? leaves : leaves.filter(l => l.status === activeTab);

  const pendingCount = leaves.filter(l => l.status === "PENDING").length;
  const approvedCount = leaves.filter(l => l.status === "APPROVED").length;
  const rejectedCount = leaves.filter(l => l.status === "REJECTED").length;

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700", APPROVED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700",
  };

  const leaveTypeColors: Record<string, string> = {
    CASUAL: "bg-blue-50 text-blue-700", SICK: "bg-red-50 text-red-700", EARNED: "bg-green-50 text-green-700",
    MATERNITY: "bg-pink-50 text-pink-700", PATERNITY: "bg-purple-50 text-purple-700", UNPAID: "bg-gray-50 text-gray-700",
  };

  const tabs: { key: Tab; label: string; count?: number; icon: any }[] = [
    { key: "PENDING", label: "Pending", count: pendingCount, icon: Clock },
    { key: "APPROVED", label: "Approved", count: approvedCount, icon: CheckCircle2 },
    { key: "REJECTED", label: "Rejected", count: rejectedCount, icon: XCircle },
    { key: "ALL", label: "All", count: leaves.length, icon: Calendar },
  ];

  return (
    <div className="page-container p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 gap-1">
        <Home size={14} /> <ChevronRight size={14} /> <span>HR</span> <ChevronRight size={14} /> <span className="text-gray-900 font-medium">Leave Management</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <button onClick={() => setShowBalances(!showBalances)}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm text-gray-700">
          <Users size={16} /> {showBalances ? "Hide Balances" : "Leave Balances"}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error} <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg"><Clock size={18} className="text-amber-600" /></div>
            <div><p className="text-xl font-bold text-amber-700">{pendingCount}</p><p className="text-xs text-gray-500">Pending</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><CheckCircle2 size={18} className="text-green-600" /></div>
            <div><p className="text-xl font-bold text-green-700">{approvedCount}</p><p className="text-xs text-gray-500">Approved</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg"><XCircle size={18} className="text-red-600" /></div>
            <div><p className="text-xl font-bold text-red-700">{rejectedCount}</p><p className="text-xs text-gray-500">Rejected</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><Calendar size={18} className="text-blue-600" /></div>
            <div><p className="text-xl font-bold text-blue-700">{leaves.length}</p><p className="text-xs text-gray-500">Total Requests</p></div>
          </div>
        </div>
      </div>

      {/* Leave Balances Table */}
      {showBalances && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b"><h3 className="font-semibold text-gray-800 text-sm">Leave Balance Overview</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">Casual (Used/Total)</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">Sick (Used/Total)</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">Earned (Used/Total)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {balances.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">No balance data available</td></tr>
                ) : balances.map(b => (
                  <tr key={b.employeeId} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{b.employeeName}</td>
                    <td className="px-4 py-2.5 text-sm text-center">{b.casual.used}/{b.casual.total}</td>
                    <td className="px-4 py-2.5 text-sm text-center">{b.sick.used}/{b.sick.total}</td>
                    <td className="px-4 py-2.5 text-sm text-center">{b.earned.used}/{b.earned.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map(({ key, label, count, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              <Icon size={15} /> {label}
              {count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === key ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"}`}>{count}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Leave Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-indigo-600" /></div>
      ) : filteredLeaves.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
          <p>No {activeTab === "ALL" ? "" : activeTab.toLowerCase()} leave requests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLeaves.map(leave => (
            <div key={leave.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{leave.employeeName}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{leave.department} • Applied: {new Date(leave.appliedOn).toLocaleDateString("en-IN")}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[leave.status]}`}>{leave.status}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${leaveTypeColors[leave.leaveType]}`}>{leave.leaveType}</span>
                <span className="text-xs text-gray-500">
                  {new Date(leave.fromDate).toLocaleDateString("en-IN")} → {new Date(leave.toDate).toLocaleDateString("en-IN")}
                </span>
                <span className="text-xs font-medium text-gray-700">({leave.days} day{leave.days > 1 ? "s" : ""})</span>
              </div>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2.5 mb-3">{leave.reason}</p>
              {leave.comment && (
                <p className="text-xs text-gray-500 italic mb-3 flex items-center gap-1"><MessageSquare size={12} /> {leave.comment}</p>
              )}
              {leave.status === "PENDING" && (
                <div className="flex gap-2 pt-2 border-t">
                  <button onClick={() => openActionModal(leave.id, "APPROVED")}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button onClick={() => openActionModal(leave.id, "REJECTED")}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && actionTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {actionTarget.action === "APPROVED" ? "Approve" : "Reject"} Leave
              </h2>
              <button onClick={() => { setShowCommentModal(false); setActionTarget(null); }} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comment (Optional)</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
                placeholder="Add a note..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowCommentModal(false); setActionTarget(null); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAction}
                className={`flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-medium ${
                  actionTarget.action === "APPROVED" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }`}>
                Confirm {actionTarget.action === "APPROVED" ? "Approval" : "Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
