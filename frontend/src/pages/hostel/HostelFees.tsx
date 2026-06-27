import { useState, useEffect } from "react";
import axios from "axios";
import {
  IndianRupee, Receipt, AlertTriangle, Users, Search, Download,
  Home, ChevronRight, Loader2, X, AlertCircle, FileText, Filter
} from "lucide-react";

interface FeeStructure {
  id: string;
  hostelName: string;
  roomType: string;
  monthlyFee: number;
  yearlyFee: number;
  messFee: number;
  securityDeposit: number;
}

interface FeePayment {
  id: string;
  studentName: string;
  admissionNo: string;
  hostelName: string;
  roomNo: string;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  status: "PAID" | "PARTIAL" | "PENDING";
  dueDate: string;
  lastPaymentDate?: string;
}

type Tab = "structure" | "collection" | "defaulters";

export default function HostelFees() {
  const [activeTab, setActiveTab] = useState<Tab>("collection");
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<FeePayment | null>(null);
  const [collectAmount, setCollectAmount] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/hostel/fees", { headers });
      const data = res.data.data || {};
      setFeeStructures(data.structures || []);
      setPayments(data.payments || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch fee data");
    } finally {
      setLoading(false);
    }
  };

  const handleCollectFee = async () => {
    if (!selectedStudent || !collectAmount) return;
    try {
      await axios.post("/api/hostel/fees/collect", {
        studentId: selectedStudent.id,
        amount: parseFloat(collectAmount),
      }, { headers });
      setShowCollectModal(false);
      setSelectedStudent(null);
      setCollectAmount("");
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to collect fee");
    }
  };

  const generateReceipt = async (paymentId: string) => {
    try {
      const res = await axios.get(`/api/hostel/fees/receipt/${paymentId}`, { headers, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt_${paymentId}.pdf`;
      link.click();
    } catch (err: any) {
      setError("Failed to generate receipt");
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch = p.studentName.toLowerCase().includes(search.toLowerCase()) ||
      p.admissionNo.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const defaulters = payments.filter(p => p.status === "PENDING" && new Date(p.dueDate) < new Date());
  const totalCollected = payments.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalPending = payments.reduce((sum, p) => sum + p.pendingAmount, 0);

  const statusColors: Record<string, string> = {
    PAID: "bg-green-100 text-green-700", PARTIAL: "bg-amber-100 text-amber-700", PENDING: "bg-red-100 text-red-700",
  };

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="page-container p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 gap-1">
        <Home size={14} /> <ChevronRight size={14} /> <span>Hostel</span> <ChevronRight size={14} /> <span className="text-gray-900 font-medium">Fees</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Hostel Fees Management</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error} <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg"><Users size={20} className="text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{payments.length}</p><p className="text-sm text-gray-500">Total Students</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-lg"><IndianRupee size={20} className="text-green-600" /></div>
            <div><p className="text-2xl font-bold text-green-700">{formatCurrency(totalCollected)}</p><p className="text-sm text-gray-500">Collected</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 rounded-lg"><IndianRupee size={20} className="text-red-600" /></div>
            <div><p className="text-2xl font-bold text-red-700">{formatCurrency(totalPending)}</p><p className="text-sm text-gray-500">Pending</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-lg"><AlertTriangle size={20} className="text-amber-600" /></div>
            <div><p className="text-2xl font-bold text-amber-700">{defaulters.length}</p><p className="text-sm text-gray-500">Defaulters</p></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 overflow-x-auto">
          {([
            { key: "structure" as Tab, label: "Fee Structure", icon: FileText },
            { key: "collection" as Tab, label: "Payment Collection", icon: IndianRupee },
            { key: "defaulters" as Tab, label: "Defaulters", icon: AlertTriangle },
          ]).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-indigo-600" /></div>
      ) : (
        <>
          {/* Fee Structure */}
          {activeTab === "structure" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hostel</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Room Type</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Monthly</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Yearly</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Mess Fee</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Security Deposit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {feeStructures.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No fee structures configured</td></tr>
                    ) : feeStructures.map(fs => (
                      <tr key={fs.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{fs.hostelName}</td>
                        <td className="px-4 py-3 text-sm text-center">{fs.roomType}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium">{formatCurrency(fs.monthlyFee)}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium">{formatCurrency(fs.yearlyFee)}</td>
                        <td className="px-4 py-3 text-sm text-center">{formatCurrency(fs.messFee)}</td>
                        <td className="px-4 py-3 text-sm text-center">{formatCurrency(fs.securityDeposit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Collection */}
          {activeTab === "collection" && (
            <>
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search student..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">All Status</option>
                  <option value="PAID">Paid</option><option value="PARTIAL">Partial</option><option value="PENDING">Pending</option>
                </select>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Room</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Total</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Paid</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Pending</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPayments.length === 0 ? (
                        <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">No records found</td></tr>
                      ) : filteredPayments.map(fee => (
                        <tr key={fee.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 text-sm">{fee.studentName}</p>
                            <p className="text-xs text-gray-500">{fee.admissionNo}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">{fee.roomNo}</td>
                          <td className="px-4 py-3 text-sm text-center font-medium">{formatCurrency(fee.totalFee)}</td>
                          <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">{formatCurrency(fee.paidAmount)}</td>
                          <td className="px-4 py-3 text-sm text-center text-red-600 font-medium">{formatCurrency(fee.pendingAmount)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[fee.status]}`}>{fee.status}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {fee.status !== "PAID" && (
                                <button onClick={() => { setSelectedStudent(fee); setShowCollectModal(true); }}
                                  className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700">Collect</button>
                              )}
                              <button onClick={() => generateReceipt(fee.id)}
                                className="p-1 text-gray-500 hover:text-indigo-600"><Receipt size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Defaulters */}
          {activeTab === "defaulters" && (
            <div className="space-y-4">
              {defaulters.length === 0 ? (
                <div className="bg-white rounded-xl border p-12 text-center text-gray-500">No defaulters found 🎉</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {defaulters.map(d => (
                    <div key={d.id} className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{d.studentName}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{d.admissionNo} • Room {d.roomNo}</p>
                        </div>
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">Overdue</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-gray-600">Pending: <span className="font-bold text-red-600">{formatCurrency(d.pendingAmount)}</span></span>
                        <span className="text-gray-500">Due: {new Date(d.dueDate).toLocaleDateString("en-IN")}</span>
                      </div>
                      <button onClick={() => { setSelectedStudent(d); setShowCollectModal(true); }}
                        className="mt-3 w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                        Collect Payment
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Collect Fee Modal */}
      {showCollectModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Collect Fee</h2>
              <button onClick={() => setShowCollectModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <p><span className="font-medium text-gray-700">Student:</span> {selectedStudent.studentName}</p>
              <p><span className="font-medium text-gray-700">Pending Amount:</span> <span className="text-red-600 font-bold">{formatCurrency(selectedStudent.pendingAmount)}</span></p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Collect (₹)</label>
                <input type="number" value={collectAmount} onChange={(e) => setCollectAmount(e.target.value)}
                  max={selectedStudent.pendingAmount} placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCollectModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleCollectFee} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                Collect & Generate Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
