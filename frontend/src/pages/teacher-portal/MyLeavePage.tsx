import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getFullUrl } from "../../utils/url";
import { FiFileText } from "react-icons/fi";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}
function normalizeId(item: any): string { return item?.id || item?._id || ""; }
function Spinner() { return (<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>); }

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "N/A";
  try { return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return dateStr; }
}

interface LeaveRecord { id: string; leaveType?: { id: string; name: string } | string; leaveTypeId?: string; startDate: string; endDate: string; status: string; reason?: string; fromDate?: string; toDate?: string; type?: string; }

export default function MyLeavePage() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchLeaves(); fetchLeaveTypes(); }, []);

  async function fetchLeaves() {
    try {
      const res = await axios.get(getFullUrl("/api/teacher-leave"), { headers: getAuthHeaders() });
      const data = res.data?.data?.data || res.data?.data || [];
      setLeaves(Array.isArray(data) ? data : []);
    } catch {} finally { setLoading(false); }
  }

  async function fetchLeaveTypes() {
    try {
      const res = await axios.get(getFullUrl("/api/teacher-leave/types"), { headers: getAuthHeaders() });
      const data = res.data?.data || [];
      setLeaveTypes(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function handleApplyLeave() {
    if (!applyForm.startDate || !applyForm.endDate || !applyForm.reason) { toast.error("Please fill in all required fields"); return; }
    setSubmitting(true);
    try {
      await axios.post(getFullUrl("/api/teacher-leave"), applyForm, { headers: getAuthHeaders() });
      toast.success("Leave application submitted!");
      setShowApplyModal(false);
      setApplyForm({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
      fetchLeaves();
    } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to apply for leave"); }
    finally { setSubmitting(false); }
  }

  function getLeaveTypeName(leave: LeaveRecord): string {
    if (typeof leave.leaveType === "object" && leave.leaveType?.name) return leave.leaveType.name;
    if (typeof leave.leaveType === "string") return leave.leaveType;
    if (leave.type) return leave.type;
    return "Leave";
  }

  const statusBadge: Record<string, string> = {
    APPROVED: "bg-green-100 text-green-700", approved: "bg-green-100 text-green-700",
    PENDING: "bg-amber-100 text-amber-700", pending: "bg-amber-100 text-amber-700",
    REJECTED: "bg-red-100 text-red-700", rejected: "bg-red-100 text-red-700",
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">My Leave</h2>
        <button onClick={() => setShowApplyModal(true)} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Apply Leave</button>
      </div>

      {leaves.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8"><div className="text-center py-8 text-gray-500"><FiFileText className="mx-auto text-3xl mb-2 text-gray-300" /><p className="text-sm">No leave records found.</p></div></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {leaves.map((leave) => {
              const leaveId = normalizeId(leave);
              const typeName = getLeaveTypeName(leave);
              const fromDate = leave.startDate || leave.fromDate || "";
              const toDate = leave.endDate || leave.toDate || "";
              const status = leave.status || "PENDING";
              return (
                <div key={leaveId} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">{typeName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusBadge[status] || "bg-gray-100 text-gray-600"}`}>{status.toLowerCase()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(fromDate)} to {formatDate(toDate)}{leave.reason ? ` \u2022 ${leave.reason}` : ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Apply for Leave</h3>
            <div className="space-y-4">
              {leaveTypes.length > 0 && (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                  <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={applyForm.leaveTypeId} onChange={(e) => setApplyForm((p) => ({ ...p, leaveTypeId: e.target.value }))}>
                    <option value="">-- Select Type --</option>
                    {leaveTypes.map((lt: any) => (<option key={normalizeId(lt)} value={normalizeId(lt)}>{lt.name || lt.type || "Leave"}</option>))}
                  </select>
                </div>
              )}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">From Date *</label><input type="date" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={applyForm.startDate} onChange={(e) => setApplyForm((p) => ({ ...p, startDate: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">To Date *</label><input type="date" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={applyForm.endDate} onChange={(e) => setApplyForm((p) => ({ ...p, endDate: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label><textarea className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" rows={3} value={applyForm.reason} onChange={(e) => setApplyForm((p) => ({ ...p, reason: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowApplyModal(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleApplyLeave} disabled={submitting} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{submitting ? "Submitting..." : "Submit Application"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
