import { useState, useEffect } from "react";
import axios from "axios";
import {
  IndianRupee, Download, CheckCircle2, Clock, Calculator,
  Home, ChevronRight, Loader2, X, AlertCircle, FileDown, Check
} from "lucide-react";

interface PayrollEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  basicPay: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: "PENDING" | "PAID";
  paidDate?: string;
}

export default function Payroll() {
  const [payroll, setPayroll] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchPayroll(); }, [month]);

  const fetchPayroll = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/hr/payroll", { headers, params: { month } });
      setPayroll(res.data.data || []);
      setSelectedIds([]);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch payroll");
    } finally {
      setLoading(false);
    }
  };

  const generatePayroll = async () => {
    setProcessing(true);
    setError("");
    try {
      await axios.post("/api/hr/payroll/generate", { month }, { headers });
      setSuccess("Payroll generated successfully!");
      setTimeout(() => setSuccess(""), 3000);
      fetchPayroll();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate payroll");
    } finally {
      setProcessing(false);
    }
  };

  const markAsPaid = async (ids: string[]) => {
    try {
      await axios.patch("/api/hr/payroll/mark-paid", { ids }, { headers });
      setSuccess(`${ids.length} payroll(s) marked as paid`);
      setTimeout(() => setSuccess(""), 3000);
      fetchPayroll();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update");
    }
  };

  const downloadSlip = async (id: string, name: string) => {
    try {
      const res = await axios.get(`/api/hr/payroll/slip/${id}`, { headers, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `salary_slip_${name.replace(/\s+/g, "_")}_${month}.pdf`;
      link.click();
    } catch (err: any) {
      setError("Failed to download salary slip");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAllPending = () => {
    const pendingIds = payroll.filter(p => p.status === "PENDING").map(p => p.id);
    setSelectedIds(prev => prev.length === pendingIds.length ? [] : pendingIds);
  };

  const totalSalary = payroll.reduce((sum, p) => sum + p.netSalary, 0);
  const paidTotal = payroll.filter(p => p.status === "PAID").reduce((sum, p) => sum + p.netSalary, 0);
  const pendingTotal = payroll.filter(p => p.status === "PENDING").reduce((sum, p) => sum + p.netSalary, 0);
  const paidCount = payroll.filter(p => p.status === "PAID").length;
  const pendingCount = payroll.filter(p => p.status === "PENDING").length;

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const formatMonth = (m: string) => {
    const [year, mon] = m.split("-");
    const date = new Date(parseInt(year), parseInt(mon) - 1);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  return (
    <div className="page-container p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 gap-1">
        <Home size={14} /> <ChevronRight size={14} /> <span>HR</span> <ChevronRight size={14} /> <span className="text-gray-900 font-medium">Payroll</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-sm text-gray-500 mt-1">{formatMonth(month)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          <button onClick={generatePayroll} disabled={processing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-50">
            {processing ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />} Generate Payroll
          </button>
        </div>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg"><IndianRupee size={20} className="text-blue-600" /></div>
            <div><p className="text-xl font-bold text-gray-900">{formatCurrency(totalSalary)}</p><p className="text-xs text-gray-500">Total Salary</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-lg"><CheckCircle2 size={20} className="text-green-600" /></div>
            <div><p className="text-xl font-bold text-green-700">{formatCurrency(paidTotal)}</p><p className="text-xs text-gray-500">Paid ({paidCount})</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-lg"><Clock size={20} className="text-amber-600" /></div>
            <div><p className="text-xl font-bold text-amber-700">{formatCurrency(pendingTotal)}</p><p className="text-xs text-gray-500">Pending ({pendingCount})</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 rounded-lg"><Calculator size={20} className="text-purple-600" /></div>
            <div><p className="text-xl font-bold text-purple-700">{payroll.length}</p><p className="text-xs text-gray-500">Total Entries</p></div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <span className="text-sm font-medium text-indigo-700">{selectedIds.length} selected</span>
          <button onClick={() => markAsPaid(selectedIds)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
            <Check size={14} /> Mark as Paid
          </button>
          <button onClick={() => setSelectedIds([])}
            className="text-xs text-gray-500 hover:text-gray-700 ml-auto">Clear Selection</button>
        </div>
      )}

      {/* Payroll Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-indigo-600" /></div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-3 text-left">
                      <input type="checkbox" onChange={selectAllPending}
                        checked={selectedIds.length > 0 && selectedIds.length === payroll.filter(p => p.status === "PENDING").length}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Basic</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Allowances</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Deductions</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Net Salary</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payroll.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">No payroll data. Click "Generate Payroll" to create entries.</td></tr>
                  ) : payroll.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3">
                        {entry.status === "PENDING" && (
                          <input type="checkbox" checked={selectedIds.includes(entry.id)}
                            onChange={() => toggleSelect(entry.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-900 text-sm">{entry.employeeName}</p>
                        <p className="text-xs text-gray-500">{entry.designation} • {entry.department}</p>
                      </td>
                      <td className="px-3 py-3 text-sm text-center">{formatCurrency(entry.basicPay)}</td>
                      <td className="px-3 py-3 text-sm text-center text-green-600">+{formatCurrency(entry.allowances)}</td>
                      <td className="px-3 py-3 text-sm text-center text-red-600">-{formatCurrency(entry.deductions)}</td>
                      <td className="px-3 py-3 text-sm text-center font-bold text-gray-900">{formatCurrency(entry.netSalary)}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.status === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>{entry.status}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {entry.status === "PENDING" && (
                            <button onClick={() => markAsPaid([entry.id])}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Mark Paid">
                              <Check size={14} />
                            </button>
                          )}
                          <button onClick={() => downloadSlip(entry.id, entry.employeeName)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Download Slip">
                            <FileDown size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {payroll.length === 0 ? (
              <div className="bg-white rounded-xl border p-8 text-center text-gray-500">No payroll data for this month</div>
            ) : payroll.map(entry => (
              <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{entry.employeeName}</p>
                    <p className="text-xs text-gray-500">{entry.designation}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    entry.status === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}>{entry.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Basic</p>
                    <p className="text-sm font-medium">{formatCurrency(entry.basicPay)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-xs text-green-600">Allowances</p>
                    <p className="text-sm font-medium text-green-700">+{formatCurrency(entry.allowances)}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2">
                    <p className="text-xs text-red-600">Deductions</p>
                    <p className="text-sm font-medium text-red-700">-{formatCurrency(entry.deductions)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="font-bold text-gray-900">{formatCurrency(entry.netSalary)}</span>
                  <div className="flex gap-2">
                    {entry.status === "PENDING" && (
                      <button onClick={() => markAsPaid([entry.id])} className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">Pay</button>
                    )}
                    <button onClick={() => downloadSlip(entry.id, entry.employeeName)} className="px-2 py-1 border text-xs rounded hover:bg-gray-50">Slip</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
