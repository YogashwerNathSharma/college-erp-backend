import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  ClipboardList,
  Plus,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  RotateCcw,
  Calendar,
  User,
  Package,
  AlertTriangle,
  Clock,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface IssuedAsset {
  id: string;
  assetId: string;
  assetName: string;
  assetCode: string;
  issuedTo: string;
  issuedToType: "STAFF" | "TEACHER" | "STUDENT" | "DEPARTMENT";
  department?: string;
  issueDate: string;
  expectedReturn: string;
  returnDate?: string;
  status: "ISSUED" | "RETURNED" | "OVERDUE";
  condition: string;
  remarks?: string;
}

interface AvailableAsset {
  id: string;
  name: string;
  assetCode: string;
  location: string;
  condition: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const isOverdue = (expectedReturn: string, returnDate?: string) => {
  if (returnDate) return false;
  return new Date(expectedReturn) < new Date();
};

const STATUS_COLORS: Record<string, string> = {
  ISSUED: "bg-blue-50 text-blue-700",
  RETURNED: "bg-green-50 text-green-700",
  OVERDUE: "bg-red-50 text-red-700",
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
export default function AssetIssue() {
  const [issues, setIssues] = useState<IssuedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [returnConfirm, setReturnConfirm] = useState<string | null>(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ─── Fetch Issues ──────────────────────────────────────────────────────────
  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      if (searchQuery) params.search = searchQuery;

      const res = await axios.get("/api/inventory/issues", { headers, params });
      setIssues(res.data.data || []);
    } catch {
      setToast({ message: "Failed to load issued assets", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // ─── Return Asset ──────────────────────────────────────────────────────────
  const handleReturn = async (issueId: string) => {
    try {
      await axios.put(`/api/inventory/issues/${issueId}/return`, {
        returnDate: new Date().toISOString(),
      }, { headers });
      setToast({ message: "Asset returned successfully", type: "success" });
      fetchIssues();
    } catch {
      setToast({ message: "Failed to return asset", type: "error" });
    }
    setReturnConfirm(null);
  };

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const activeIssues = issues.filter((i) => i.status === "ISSUED");
  const overdueIssues = issues.filter((i) => i.status === "OVERDUE" || (i.status === "ISSUED" && isOverdue(i.expectedReturn, i.returnDate)));
  const returnedToday = issues.filter((i) => {
    if (!i.returnDate) return false;
    return new Date(i.returnDate).toDateString() === new Date().toDateString();
  });

  return (
    <div className="page-container space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <ClipboardList className="text-orange-600" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Asset Issue / Return</h1>
            <p className="text-sm text-gray-500">Track assets issued to staff and departments</p>
          </div>
        </div>
        <button
          onClick={() => setShowIssueForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm font-medium text-sm"
        >
          <Plus size={18} />
          Issue Asset
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Active Issues</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{activeIssues.length}</p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <Package size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Overdue</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{overdueIssues.length}</p>
            </div>
            <div className="p-2.5 bg-red-50 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Returned Today</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{returnedToday.length}</p>
            </div>
            <div className="p-2.5 bg-green-50 rounded-lg">
              <RotateCcw size={20} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              {overdueIssues.length} asset(s) are overdue for return
            </p>
            <p className="text-xs text-red-600 mt-0.5">Please follow up with the respective recipients.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by asset or recipient..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="">All Status</option>
            <option value="ISSUED">Issued</option>
            <option value="RETURNED">Returned</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 size={28} className="animate-spin text-gray-400" />
          </div>
        ) : issues.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No issues found</h3>
            <p className="text-sm text-gray-500 mt-1">Issue an asset to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued To</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Expected Return</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Return Date</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {issues.map((item) => {
                  const overdue = item.status === "ISSUED" && isOverdue(item.expectedReturn, item.returnDate);
                  const displayStatus = overdue ? "OVERDUE" : item.status;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 transition ${overdue ? "bg-red-50/30" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{item.assetName}</p>
                        <p className="text-xs text-gray-400 font-mono">{item.assetCode}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{item.issuedTo}</p>
                        <p className="text-xs text-gray-400">{item.issuedToType}{item.department ? ` • ${item.department}` : ""}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">{formatDate(item.issueDate)}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={overdue ? "text-red-600 font-medium" : "text-gray-600"}>
                          {formatDate(item.expectedReturn)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">
                        {item.returnDate ? formatDate(item.returnDate) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[displayStatus]}`}>
                          {overdue && "⚠ "}{displayStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(item.status === "ISSUED") && (
                          <button
                            onClick={() => setReturnConfirm(item.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 transition"
                          >
                            <RotateCcw size={12} />
                            Return
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Return Confirmation */}
      {returnConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-full">
                <RotateCcw size={20} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Return Asset</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Mark this asset as returned? The return date will be set to today.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setReturnConfirm(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
              <button onClick={() => handleReturn(returnConfirm)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition">Confirm Return</button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Asset Modal */}
      {showIssueForm && (
        <IssueFormModal
          onClose={() => setShowIssueForm(false)}
          onSuccess={() => {
            setShowIssueForm(false);
            fetchIssues();
            setToast({ message: "Asset issued successfully!", type: "success" });
          }}
          onError={(msg) => setToast({ message: msg, type: "error" })}
        />
      )}
    </div>
  );
}

// ─── Issue Form Modal ────────────────────────────────────────────────────────
function IssueFormModal({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    assetId: "",
    issuedTo: "",
    issuedToType: "STAFF" as "STAFF" | "TEACHER" | "STUDENT" | "DEPARTMENT",
    department: "",
    issueDate: new Date().toISOString().split("T")[0],
    expectedReturn: "",
    remarks: "",
  });
  const [assets, setAssets] = useState<AvailableAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchAvailable = async () => {
      try {
        const res = await axios.get("/api/inventory/assets", { headers, params: { status: "AVAILABLE" } });
        setAssets(res.data.data || []);
      } catch {
        // silent
      } finally {
        setLoadingAssets(false);
      }
    };
    fetchAvailable();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.assetId || !form.issuedTo.trim() || !form.expectedReturn) {
      onError("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      await axios.post("/api/inventory/issues", form, { headers });
      onSuccess();
    } catch {
      onError("Failed to issue asset");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Issue Asset</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Asset Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Asset *</label>
            {loadingAssets ? (
              <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                <Loader2 size={14} className="animate-spin" /> Loading assets...
              </div>
            ) : (
              <select
                value={form.assetId}
                onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                required
              >
                <option value="">Choose an asset</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.assetCode}) — {a.location}</option>
                ))}
              </select>
            )}
          </div>

          {/* Recipient */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Issued To *</label>
              <input
                type="text"
                value={form.issuedTo}
                onChange={(e) => setForm({ ...form, issuedTo: e.target.value })}
                placeholder="Staff name or department"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipient Type</label>
              <select
                value={form.issuedToType}
                onChange={(e) => setForm({ ...form, issuedToType: e.target.value as any })}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="STAFF">Staff</option>
                <option value="TEACHER">Teacher</option>
                <option value="STUDENT">Student</option>
                <option value="DEPARTMENT">Department</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="e.g., Science Dept"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Issue Date</label>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Expected Return *</label>
              <input
                type="date"
                value={form.expectedReturn}
                onChange={(e) => setForm({ ...form, expectedReturn: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              rows={2}
              placeholder="Optional notes"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition shadow-sm">
              {saving ? "Issuing..." : "Issue Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AvailableAsset {
  id: string;
  name: string;
  assetCode: string;
  location: string;
}
