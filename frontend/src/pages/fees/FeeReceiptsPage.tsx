
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import { printDocument, printMultipleReceipts } from "../../utils/print";
import {
  Search, Printer, FileText, Users, ChevronRight,
  IndianRupee, CheckCircle, AlertCircle, Download,
  GraduationCap, Filter,
} from "lucide-react";

const API = `${API_BASE_URL}/api`;

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

interface StudentOption {
  id: string;
  enrollmentId: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  className: string;
  sectionName: string;
  fatherName?: string;
  rollNumber?: string;
}

interface FeeInstallment {
  id: string;
  installmentNo: number;
  netAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  dueDate: string | null;
  feeStructure?: { name: string };
}

interface PaymentRecord {
  id: string;
  receiptNo: string;
  amount: number;
  method: string;
  paymentDate: string;
  reference?: string;
  feeItems?: { name: string; amount: number; code?: string }[];
  studentFee?: any;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const FeeReceiptsPage: React.FC = () => {
  const navigate = useNavigate();
  // Filters
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Student Fee Data
  const [feeData, setFeeData] = useState<FeeInstallment[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Print
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([]);
  const [bulkPrinting, setBulkPrinting] = useState(false);

  // ─── Fetch classes on mount ──────────────────────────────────
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API}/class`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClasses(res.data?.data || res.data || []);
      } catch { setClasses([]); }
    };
    fetchClasses();
  }, []);

  // ─── Fetch sections when class changes ──────────────────────
  useEffect(() => {
    if (!selectedClass) { setSections([]); setStudents([]); return; }
    const fetchSections = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API}/section?classId=${selectedClass}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSections(res.data?.data || res.data || []);
      } catch { setSections([]); }
    };
    fetchSections();
    setSelectedSection("");
    setSelectedStudent(null);
    setFeeData([]);
    setPayments([]);
  }, [selectedClass]);

  // ─── Fetch students when section changes ────────────────────
  useEffect(() => {
    if (!selectedClass || !selectedSection) { setStudents([]); return; }
    const fetchStudents = async () => {
      setStudentsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API}/students?classId=${selectedClass}&sectionId=${selectedSection}&limit=500`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const raw: any[] = res.data?.data?.students || res.data?.data || [];
        setStudents(raw.map((s: any) => ({
          id: s.id,
          enrollmentId: s.enrollments?.[0]?.id || s.enrollmentId || s.id,
          firstName: s.firstName || "",
          lastName: s.lastName || "",
          admissionNo: s.admissionNo || "",
          className: s.enrollments?.[0]?.class?.name || s.className || "",
          sectionName: s.enrollments?.[0]?.section?.name || s.sectionName || "",
          fatherName: s.fatherName || "",
          rollNumber: s.rollNumber || "",
        })));
      } catch { setStudents([]); }
      finally { setStudentsLoading(false); }
    };
    fetchStudents();
    setSelectedStudent(null);
    setFeeData([]);
    setPayments([]);
  }, [selectedSection]);

  // ─── Fetch student fee data ─────────────────────────────────
  const fetchStudentFees = async (student: StudentOption) => {
    setSelectedStudent(student);
    setLoading(true);
    setSelectedReceipts([]);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch fee installments
      const feeRes = await axios.get(`${API}/fees/collection/student/${student.enrollmentId}`, { headers });
      const fees = feeRes.data?.fees || feeRes.data?.data?.fees || [];
      setFeeData(fees);

      // Fetch ledger with all payments
      const ledgerRes = await axios.get(`${API}/fees/ledger/${student.enrollmentId}`, { headers });
      const ledger = ledgerRes.data?.data || ledgerRes.data || {};
      
      // Extract payments from ledger response (backend now sends flat payments array)
      const allPayments: PaymentRecord[] = (ledger.payments || []).map((p: any) => ({
        id: p.id,
        receiptNo: p.receiptNo || `RCP-${p.id?.slice(-6)}`,
        amount: p.amount || 0,
        method: p.method || "CASH",
        paymentDate: p.paymentDate || p.createdAt || "",
        reference: p.reference || null,
        feeItems: p.feeItems || [],
        studentFee: { installmentNo: p.installmentNo, feeStructureName: p.feeStructureName },
      }));
      setPayments(allPayments);

      // If fees are empty but ledger has summary, use that
      if (fees.length === 0 && ledger.entries?.length > 0) {
        setFeeData(ledger.entries.map((e: any) => ({
          id: e.id,
          installmentNo: e.installmentNo || 1,
          netAmount: e.netAmount || e.totalAmount || 0,
          totalAmount: e.totalAmount || 0,
          paidAmount: e.paidAmount || 0,
          balanceAmount: e.balanceAmount || e.balance || 0,
          status: e.status || "PENDING",
          dueDate: e.dueDate || null,
          feeStructure: e.feeStructure || null,
        })));
      }
    } catch (err: any) {
      toast.error("Failed to load fee data");
      setFeeData([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Search students ────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setStudentsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/fees/collection/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = res.data;
      if (result?.type === "single" && result?.data) {
        const s = result.data.student || result.data;
        const student: StudentOption = {
          id: s.id,
          enrollmentId: result.data.enrollmentId || s.enrollmentId || s.id,
          firstName: s.firstName || "",
          lastName: s.lastName || "",
          admissionNo: s.admissionNo || "",
          className: s.className || "",
          sectionName: s.sectionName || "",
          fatherName: s.fatherName || "",
        };
        fetchStudentFees(student);
      } else if (result?.type === "list" && result?.students?.length > 0) {
        setStudents(result.students.map((s: any) => ({
          id: s.id,
          enrollmentId: s.enrollmentId || s.id,
          firstName: s.firstName || s.name?.split(" ")[0] || "",
          lastName: s.lastName || s.name?.split(" ").slice(1).join(" ") || "",
          admissionNo: s.admissionNo || "",
          className: s.className || "",
          sectionName: s.sectionName || "",
          fatherName: s.fatherName || "",
        })));
      } else {
        toast.error("No student found");
      }
    } catch { toast.error("Search failed"); }
    finally { setStudentsLoading(false); }
  };

  // ─── Print helpers ──────────────────────────────────────────
  const toggleReceipt = (receiptNo: string) => {
    setSelectedReceipts((prev) =>
      prev.includes(receiptNo) ? prev.filter((r) => r !== receiptNo) : [...prev, receiptNo]
    );
  };

  const selectAllReceipts = () => {
    if (selectedReceipts.length === payments.length) {
      setSelectedReceipts([]);
    } else {
      setSelectedReceipts(payments.map((p) => p.receiptNo));
    }
  };

  const printSingleReceipt = (payment: PaymentRecord) => {
    if (!selectedStudent) return;
    printDocument("fee_receipt", {
      receiptNo: payment.receiptNo,
      paymentDate: payment.paymentDate,
      studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`.trim(),
      admissionNo: selectedStudent.admissionNo,
      fatherName: selectedStudent.fatherName || "",
      className: selectedStudent.className,
      section: selectedStudent.sectionName || "",
      feeHead: payment.studentFee?.feeStructureName || "Fee",
      feeItems: payment.feeItems,
      installmentNo: payment.studentFee?.installmentNo || 1,
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
      totalDue: totalFee,
      balance: totalBalance,
      totalPaidTillDate: totalPaid,
    });
  };

  const bulkPrint = () => {
    if (selectedReceipts.length === 0) {
      toast.error("Select receipts to print");
      return;
    }
    const selected = payments.filter((p) => selectedReceipts.includes(p.receiptNo));
    const receiptsData = selected.map((p) => ({
      receiptNo: p.receiptNo,
      paymentDate: p.paymentDate,
      studentName: `${selectedStudent?.firstName} ${selectedStudent?.lastName}`.trim(),
      admissionNo: selectedStudent?.admissionNo || "",
      fatherName: selectedStudent?.fatherName || "",
      className: selectedStudent?.className || "",
      section: selectedStudent?.sectionName || "",
      feeHead: p.studentFee?.feeStructureName || "Fee",
      feeItems: p.feeItems,
      installmentNo: p.studentFee?.installmentNo || 1,
      amount: p.amount,
      method: p.method,
      reference: p.reference,
      totalDue: totalFee,
      balance: totalBalance,
      totalPaidTillDate: totalPaid,
    }));
    printMultipleReceipts(receiptsData);
  };

  // ─── Computed values ────────────────────────────────────────
  const totalFee = feeData.reduce((s, f) => s + (f.netAmount || f.totalAmount || 0), 0);
  const totalPaid = feeData.reduce((s, f) => s + (f.paidAmount || 0), 0);
  const totalBalance = feeData.reduce((s, f) => s + (f.balanceAmount || 0), 0);

  const filteredStudents = searchQuery && !selectedStudent
    ? students.filter((s) =>
        `${s.firstName} ${s.lastName} ${s.admissionNo}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students;

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <FileText size={24} className="text-indigo-500" /> Fee Receipts & Records
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Select a student to view complete fee record and print receipts
        </p>
      </div>

      {/* ═══ FILTERS: Search + Class + Section ═══ */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or admission no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button onClick={handleSearch} className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Search size={14} /> Search
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-500"><Filter size={14} /> Or filter by:</div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white"
          >
            <option value="">Select Class</option>
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            disabled={!selectedClass}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white disabled:opacity-50"
          >
            <option value="">Select Section</option>
            {sections.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ═══ STUDENT LIST ═══ */}
      {filteredStudents.length > 0 && !selectedStudent && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <Users size={16} className="text-blue-500" /> Select Student ({filteredStudents.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {filteredStudents.map((s) => (
              <button
                key={s.enrollmentId || s.id}
                onClick={() => fetchStudentFees(s)}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {s.firstName[0]?.toUpperCase() || "S"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{s.firstName} {s.lastName}</p>
                  <p className="text-[11px] text-slate-500">{s.admissionNo} • {s.className}{s.sectionName ? ` - ${s.sectionName}` : ""}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 ml-auto flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {studentsLoading && (
        <div className="text-center py-8 text-slate-400"><div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2" />Loading students...</div>
      )}

      {/* ═══ STUDENT FEE RECORD ═══ */}
      {selectedStudent && (
        <div className="space-y-4">
          {/* Student Info Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                  {selectedStudent.firstName[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                  <p className="text-sm text-white/80">{selectedStudent.admissionNo} • {selectedStudent.className}{selectedStudent.sectionName ? ` - ${selectedStudent.sectionName}` : ""}</p>
                  {selectedStudent.fatherName && <p className="text-xs text-white/60">F/O: {selectedStudent.fatherName}</p>}
                </div>
              </div>
              <button
                onClick={() => { setSelectedStudent(null); setFeeData([]); setPayments([]); }}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                ← Change Student
              </button>
              <button
                onClick={() => navigate(`/fees/collection?student=${encodeURIComponent(selectedStudent.admissionNo || selectedStudent.firstName + " " + selectedStudent.lastName)}`)}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 shadow-lg"
              >
                💰 Pay / Collect Fee
              </button>
            </div>
          </div>

          {/* Fee Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
              <p className="text-xs text-slate-500">Total Fee</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">₹{totalFee.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
              <p className="text-xs text-slate-500">Total Paid</p>
              <p className="text-lg font-bold text-emerald-600">₹{totalPaid.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
              <p className="text-xs text-slate-500">Balance</p>
              <p className="text-lg font-bold text-red-600">₹{totalBalance.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
              <p className="text-xs text-slate-500">Receipts</p>
              <p className="text-lg font-bold text-indigo-600">{payments.length}</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-400"><div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2" />Loading fee data...</div>
          ) : (
            <>
              {/* Fee Installments Table */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <IndianRupee size={16} className="text-emerald-500" /> Fee Installments
                </h3>
                {feeData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">#</th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">Fee Structure</th>
                          <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500">Net Fee</th>
                          <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500">Paid</th>
                          <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500">Balance</th>
                          <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500">Status</th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">Due Date</th>
                          <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feeData.map((f, idx) => (
                          <tr key={f.id || idx} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                            <td className="py-2.5 px-2 text-slate-500">{idx + 1}</td>
                            <td className="py-2.5 px-2 font-medium text-slate-800 dark:text-slate-200">{f.feeStructure?.name || `Inst. ${f.installmentNo}`}</td>
                            <td className="py-2.5 px-2 text-right text-slate-700 dark:text-slate-300">₹{(f.netAmount || f.totalAmount || 0).toLocaleString("en-IN")}</td>
                            <td className="py-2.5 px-2 text-right text-emerald-600 font-medium">₹{(f.paidAmount || 0).toLocaleString("en-IN")}</td>
                            <td className="py-2.5 px-2 text-right font-bold text-red-600">₹{(f.balanceAmount || 0).toLocaleString("en-IN")}</td>
                            <td className="py-2.5 px-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                f.status === "PAID" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                                  : f.status === "OVERDUE" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                              }`}>{f.status || "PENDING"}</span>
                            </td>
                            <td className="py-2.5 px-2 text-slate-500 text-xs">{f.dueDate ? new Date(f.dueDate).toLocaleDateString("en-IN") : "—"}</td>
                            <td className="py-2.5 px-2 text-center">
                              {f.status !== "PAID" && (f.balanceAmount || 0) > 0 ? (
                                <button
                                  onClick={() => navigate(`/fees/collection?student=${encodeURIComponent(selectedStudent?.admissionNo || "")}`)}
                                  className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-md hover:bg-emerald-700 transition-colors inline-flex items-center gap-1"
                                >
                                  💰 Pay
                                </button>
                              ) : (
                                <span className="text-[10px] text-green-500 font-medium">✓ Paid</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-6 text-slate-400 text-sm">No fee installments found</p>
                )}
              </div>

              {/* Payment Receipts */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Printer size={16} className="text-indigo-500" /> Payment Receipts ({payments.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    {payments.length > 0 && (
                      <>
                        <button
                          onClick={selectAllReceipts}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          {selectedReceipts.length === payments.length ? "Deselect All" : "Select All"}
                        </button>
                        <button
                          onClick={bulkPrint}
                          disabled={selectedReceipts.length === 0}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                        >
                          <Printer size={12} /> Bulk Print ({selectedReceipts.length})
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="py-2 px-2 w-8">
                            <input
                              type="checkbox"
                              checked={selectedReceipts.length === payments.length}
                              onChange={selectAllReceipts}
                              className="rounded border-slate-300"
                            />
                          </th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">Receipt No</th>
                          <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500">Amount</th>
                          <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500">Method</th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">Date</th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 hidden sm:table-cell">Reference</th>
                          <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p, idx) => (
                          <tr key={p.id || idx} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                            <td className="py-2.5 px-2">
                              <input
                                type="checkbox"
                                checked={selectedReceipts.includes(p.receiptNo)}
                                onChange={() => toggleReceipt(p.receiptNo)}
                                className="rounded border-slate-300"
                              />
                            </td>
                            <td className="py-2.5 px-2 font-mono text-xs font-medium text-slate-800 dark:text-slate-200">{p.receiptNo}</td>
                            <td className="py-2.5 px-2 text-right font-bold text-emerald-600">₹{(p.amount || 0).toLocaleString("en-IN")}</td>
                            <td className="py-2.5 px-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                p.method === "CASH" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                                  : p.method === "ONLINE" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                              }`}>{p.method}</span>
                            </td>
                            <td className="py-2.5 px-2 text-xs text-slate-600 dark:text-slate-400">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                            <td className="py-2.5 px-2 text-xs text-slate-400 hidden sm:table-cell">{p.reference || "—"}</td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                onClick={() => printSingleReceipt(p)}
                                className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-medium rounded-md hover:bg-indigo-700 transition-colors inline-flex items-center gap-1"
                              >
                                <Printer size={10} /> Print
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No payment receipts found</p>
                    <p className="text-xs text-slate-400 mt-1">Receipts will appear here after fee collection</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty state when nothing selected */}
      {!selectedStudent && filteredStudents.length === 0 && !studentsLoading && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
          <GraduationCap size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Select a Student</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 max-w-md mx-auto">
            Search by name/admission number or use Class → Section filters to find a student and view their complete fee record
          </p>
        </div>
      )}

    </div>
  );
};

export default FeeReceiptsPage;
