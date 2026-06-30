import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import { FeeReceiptPrint } from "./FeeReceiptPrint";

const API = `${API_BASE_URL}/api`;

interface StudentInfo {
  name: string;
  admissionNo: string;
  fatherName: string;
  phone: string;
  class: string;
  section: string;
  rollNumber: string;
  enrollmentId: string;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  receiptNo: string;
  paymentDate: string;
}

interface FeeStructureItem {
  feeHeadId: string;
  amount: number;
  frequency: string;
  feeHead: { id: string; name: string; code: string };
}

interface StudentFeeItemRecord {
  id: string;
  feeHeadId: string;
  name: string;
  amount: number;
  frequency: string;
}

interface FeeRecord {
  id: string;
  feeStructureId: string;
  totalAmount: number;
  discountAmount: number;
  fineAmount: number;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;
  installmentNo: number;
  dueDate: string;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
  payments: Payment[];
  feeStructure: {
    name: string;
    feeHead?: string;
    items?: FeeStructureItem[];
  };
  items?: StudentFeeItemRecord[];
}

interface FeeSummary {
  totalAmount: number;
  totalDiscount: number;
  totalFine: number;
  totalNet: number;
  totalPaid: number;
  totalBalance: number;
}

interface PaymentModalData {
  studentFeeId: string;
  balance: number;
  feeHead: string;
  installmentNo: number;
  feeItems: { name: string; amount: number }[];
  paidAmount: number;
  totalAmount: number;
}

interface FeeDiscountOption {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  description?: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PARTIAL: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  PAID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const FeeCollectionPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [paymentModal, setPaymentModal] = useState<PaymentModalData | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "CASH",
    reference: "",
    remarks: "",
    discountId: "",
    discountAmount: "",
    selectedItems: null as number[] | null,
    fineAmount: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [assigning, setAssigning] = useState(false);
  const [discounts, setDiscounts] = useState<FeeDiscountOption[]>([]);

  useEffect(() => {
    fetchDiscounts();
    fetchClasses();
    const params = new URLSearchParams(window.location.search);
    const studentParam = params.get("student");
    if (studentParam) {
      setSearchQuery(studentParam);
      setTimeout(() => {
        document.getElementById("fee-search-btn")?.click();
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (selectedClass) fetchSections();
    else setSections([]);
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API}/class`);
      if (res.data.success) setClasses(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchSections = async () => {
    try {
      const res = await axios.get(`${API}/section`, { params: { classId: selectedClass } });
      if (res.data.success) setSections(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const handleFilterSearch = async () => {
    if (!selectedClass) {
      toast.error("Please select a class");
      return;
    }
    setSearchQuery("");
    setLoading(true);
    setStudent(null);
    setFees([]);
    setSummary(null);
    setSearchResults([]);
    try {
      const res = await axios.get(`${API}/students`, {
        params: { 
          classId: selectedClass, 
          ...(selectedSection && { sectionId: selectedSection }),
          limit: 100 
        },
      });
      const students = res.data?.data?.students || res.data?.data || [];
      if (students.length > 0) {
        setSearchResults(students.map((s: any) => ({
          enrollmentId: s.enrollments?.[0]?.id || s.id,
          name: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
          admissionNo: s.admissionNo || "",
          fatherName: s.fatherName || "",
          className: s.enrollments?.[0]?.class?.name || "",
          sectionName: s.enrollments?.[0]?.section?.name || "",
        })));
      } else {
        toast.error("No students found for selected class");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscounts = async () => {
    try {
      const res = await axios.get(`${API}/fees/discounts`);
      const data = res.data.data || res.data;
      setDiscounts(Array.isArray(data) ? data.filter((d: any) => d.isActive !== false) : []);
    } catch (error) {
      console.error("Failed to fetch discounts:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        handleSearch();
      }
      if (searchQuery.trim().length === 0) {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Enter name, admission number, or class to search");
      return;
    }

    setSelectedClass("");
    setSelectedSection("");
    setLoading(true);
    setStudent(null);
    setFees([]);
    setSummary(null);
    setSearchResults([]);

    try {
      const res = await axios.get(`${API}/fees/collection/search`, {
        params: { q: searchQuery.trim() },
      });

      if (res.data.type === "single" && res.data.data) {
        setStudent(res.data.data.student);
        setFees(res.data.data.fees || []);
        setSummary(res.data.data.summary || null);
      } else if (res.data.type === "multiple" && res.data.results?.length > 0) {
        setSearchResults(res.data.results);
      } else if (res.data.student) {
        setStudent(res.data.student);
        setFees(res.data.fees || []);
        setSummary(res.data.summary || null);
      } else {
        toast.error("No students found");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Student not found");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByEnrollment = async (enrollmentId: string) => {
    setLoading(true);
    setSearchResults([]);
    try {
      const res = await axios.get(`${API}/fees/collection/student/${enrollmentId}`);
      setStudent(res.data.student);
      setFees(res.data.fees);
      setSummary(res.data.summary);
      setSearchQuery("");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load fees");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignFees = async () => {
    if (!student?.enrollmentId) return;
    setAssigning(true);
    try {
      await axios.post(`${API}/fees/collection/assign/student`, {
        enrollmentId: student.enrollmentId,
      });
      toast.success("Fees assigned successfully");
      handleSearchByEnrollment(student.enrollmentId);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to assign fees");
    } finally {
      setAssigning(false);
    }
  };

  const openPaymentModal = (fee: FeeRecord) => {
    let feeItems: { name: string; amount: number }[] = [];

    if (fee.items && fee.items.length > 0) {
      feeItems = fee.items.map((item) => ({
        name: item.name || "Fee",
        amount: item.amount || 0,
      }));
    } else if (fee.feeStructure?.items && fee.feeStructure.items.length > 0) {
      feeItems = fee.feeStructure.items.map((item) => ({
        name: item.feeHead?.name || "Fee",
        amount: item.amount || 0,
      }));
    }

    setPaymentModal({
      studentFeeId: fee.id,
      balance: fee.balanceAmount,
      feeHead: fee.feeStructure?.name || "Fee",
      installmentNo: fee.installmentNo,
      feeItems,
      paidAmount: fee.paidAmount,
      totalAmount: fee.netAmount,
    });
    setPaymentForm({
      amount: fee.balanceAmount.toString(),
      method: "CASH",
      reference: "",
      remarks: "",
      discountId: "",
      discountAmount: "",
      selectedItems: feeItems.map((_, i) => i),
      fineAmount: "",
    });
  };

  const handleDiscountSelect = (discountId: string) => {
    if (!discountId || !paymentModal) {
      setPaymentForm((prev) => ({ ...prev, discountId: "", discountAmount: "", amount: paymentModal?.balance.toString() || "" }));
      return;
    }

    const selectedDiscount = discounts.find((d) => d.id === discountId);
    if (!selectedDiscount) return;

    let discountAmt = 0;
    if (selectedDiscount.type === "FIXED") {
      discountAmt = selectedDiscount.value;
    } else if (selectedDiscount.type === "PERCENTAGE") {
      discountAmt = Math.round((paymentModal.balance * selectedDiscount.value) / 100);
    }

    if (discountAmt > paymentModal.balance) discountAmt = paymentModal.balance;

    const newPayAmount = paymentModal.balance - discountAmt;

    setPaymentForm((prev) => ({
      ...prev,
      discountId,
      discountAmount: discountAmt.toString(),
      amount: newPayAmount.toString(),
    }));
  };

  const handleCollectPayment = async () => {
    if (!paymentModal) return;
    const amount = parseFloat(paymentForm.amount) || 0;
    const discount = parseFloat(paymentForm.discountAmount) || 0;

    if (amount + discount <= 0) {
      toast.error("Enter a valid amount or apply a discount");
      return;
    }
    if (amount < 0) {
      toast.error("Amount cannot be negative");
      return;
    }
    if (amount + discount > paymentModal.balance + 0.01) {
      toast.error("Amount + Discount cannot exceed balance");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/fees/collection/collect`, {
        studentFeeId: paymentModal.studentFeeId,
        amount,
        method: paymentForm.method,
        reference: paymentForm.reference || undefined,
        remarks: paymentForm.remarks || undefined,
        discountAmount: discount || undefined,
        discountId: paymentForm.discountId || undefined,
      });

      toast.success(`Payment collected! Receipt: ${res.data.receiptNo}`);
      const selectedIdxs = paymentForm.selectedItems || paymentModal.feeItems.map((_, i) => i);
      const selectedFeeItems = selectedIdxs.map((i: number) => paymentModal.feeItems[i]).filter(Boolean);
      setLastReceipt({
        ...res.data,
        _selectedFeeItems: selectedFeeItems,
        _fineAmount: parseFloat(paymentForm.fineAmount) || 0,
      });
      setPaymentModal(null);

      if (student?.enrollmentId) {
        handleSearchByEnrollment(student.enrollmentId);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (!lastReceipt || !student) return;
    let receiptFeeItems = lastReceipt._selectedFeeItems?.length > 0
      ? lastReceipt._selectedFeeItems
      : (lastReceipt.feeInfo?.feeItems || []);
    receiptFeeItems = receiptFeeItems.map((item: any) => ({
      name: item.name || item.feeHead?.name || "Fee",
      amount: item.amount || 0,
      code: item.code || item.feeHead?.code || "",
    })).filter((item: any) => item.name && item.amount > 0);
    await FeeReceiptPrint({
      receiptNo: lastReceipt.receiptNo,
      paymentDate: lastReceipt.payment.paymentDate,
      studentName: student.name,
      admissionNo: student.admissionNo,
      fatherName: student.fatherName,
      className: student.class,
      section: student.section,
      feeHead: lastReceipt.feeInfo.feeHead,
      feeItems: receiptFeeItems,
      installmentNo: lastReceipt.feeInfo.installmentNo,
      amount: lastReceipt.payment.amount,
      method: lastReceipt.payment.method,
      reference: lastReceipt.payment.reference,
      rollNumber: student.rollNumber,
      balance: lastReceipt.remainingBalance ?? lastReceipt.feeInfo.balanceAmount,
      totalPaidTillDate: lastReceipt.feeInfo.paidAmount || 0,
      discountAmount: lastReceipt.payment.discountAmount || lastReceipt.feeInfo.discountAmount || 0,
      feePeriod: lastReceipt.monthsCovered ? `${lastReceipt.monthsCovered.from || ''} to ${lastReceipt.monthsCovered.to || ''}` : undefined,
      pendingFrom: lastReceipt.nextDueMonth || undefined,
    });
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto box-border overflow-x-hidden">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Fee Collection</h1>
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Search by student name, admission number, or class</p>
      </div>

      {/* Search Bar / Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-6">
        {/* Row 1: Text Search (Fully Responsive Stack) */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by Name, Admission No..."
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <button
            id="fee-search-btn"
            onClick={handleSearch}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 font-semibold text-sm transition-all shadow-sm"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Row 2: Dropdown Filters (Fully Responsive Stack) */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center pt-4 border-t border-gray-100 dark:border-slate-700">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider whitespace-nowrap">Or filter by:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:flex-1">
            <select
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(""); }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedClass}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-50"
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleFilterSearch}
            disabled={loading || !selectedClass}
            className="w-full md:w-auto px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 text-sm font-semibold transition-all shadow-sm"
          >
            {loading ? "..." : "Go"}
          </button>
        </div>
      </div>

      {!loading && searchQuery.trim().length >= 3 && !student && searchResults.length === 0 && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-3 text-center mb-6">
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">❌ Student not found</p>
        </div>
      )}

      {/* Multiple Results Found */}
      {searchResults.length > 0 && !student && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-6">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
            Found {searchResults.length} students — select one:
          </h3>
          <div className="w-full overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700 text-left text-gray-600 dark:text-gray-300 font-semibold">
                  <th className="px-3 py-2">Adm No</th>
                  <th className="px-3 py-2">Student Name</th>
                  <th className="px-3 py-2">Father Name</th>
                  <th className="px-3 py-2">Class</th>
                  <th className="px-3 py-2">Section</th>
                  <th className="px-3 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {searchResults.map((s: any) => (
                  <tr key={s.enrollmentId} className="hover:bg-primary-50 dark:hover:bg-slate-700/50">
                    <td className="px-3 py-2 font-mono text-xs dark:text-white">{s.admissionNo}</td>
                    <td className="px-3 py-2 font-semibold dark:text-white">{s.name}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{s.fatherName}</td>
                    <td className="px-3 py-2 dark:text-gray-400">{s.className}</td>
                    <td className="px-3 py-2 dark:text-gray-400">{s.sectionName}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => { setSearchResults([]); handleSearchByEnrollment(s.enrollmentId); }}
                        className="px-3 py-1 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Info Card (Fully Responsive Grid block) */}
      {student && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 md:p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Student Name</p>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5 text-sm md:text-base">{student.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Admission No</p>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5 text-sm md:text-base font-mono">{student.admissionNo}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Class & Section</p>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5 text-sm md:text-base">{student.class} - {student.section}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Father's Name</p>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5 text-sm md:text-base">{student.fatherName}</p>
            </div>
          </div>

          {summary && (
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="text-center p-2.5 bg-gray-50 dark:bg-slate-700/40 rounded-xl">
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total</p>
                <p className="font-bold text-sm md:text-base text-gray-900 dark:text-white mt-0.5">{formatCurrency(summary.totalAmount)}</p>
              </div>
              <div className="text-center p-2.5 bg-gray-50 dark:bg-slate-700/40 rounded-xl">
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Discount</p>
                <p className="font-bold text-sm md:text-base text-purple-600 dark:text-purple-400 mt-0.5">{formatCurrency(summary.totalDiscount)}</p>
              </div>
              <div className="text-center p-2.5 bg-gray-50 dark:bg-slate-700/40 rounded-xl">
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Fine</p>
                <p className="font-bold text-sm md:text-base text-red-600 dark:text-red-400 mt-0.5">{formatCurrency(summary.totalFine)}</p>
              </div>
              <div className="text-center p-2.5 bg-gray-50 dark:bg-slate-700/40 rounded-xl">
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Net</p>
                <p className="font-bold text-sm md:text-base text-gray-900 dark:text-white mt-0.5">{formatCurrency(summary.totalNet)}</p>
              </div>
              <div className="text-center p-2.5 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-100 dark:border-green-900/40">
                <p className="text-[11px] font-semibold text-green-600 dark:text-green-400">Paid</p>
                <p className="font-bold text-sm md:text-base text-green-700 dark:text-green-400 mt-0.5">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <div className="text-center p-2.5 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/40">
                <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">Balance</p>
                <p className="font-bold text-sm md:text-base text-red-700 dark:text-red-400 mt
