
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FeeReceiptPrint } from "./FeeReceiptPrint";

const API = import.meta.env.VITE_API_URL || "/api";

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
  feeItems: { name: string; amount: number; code?: string }[];
}

// Discount from database
interface FeeDiscountOption {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  description?: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PARTIAL: "bg-orange-100 text-orange-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
};

const FeeCollectionPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<StudentInfo | null>(null);
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
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [assigning, setAssigning] = useState(false);

  // Discounts from database
  const [discounts, setDiscounts] = useState<FeeDiscountOption[]>([]);

  // Fetch discounts on mount
  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const res = await axios.get(`${API}/fees/discounts`);
      const data = res.data.data || res.data;
      setDiscounts(Array.isArray(data) ? data.filter((d: any) => d.isActive !== false) : []);
    } catch (error) {
      console.error("Failed to fetch discounts:", error);
    }
  };

  // Auto-search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        handleSearch();
      }
      if (searchQuery.trim().length === 0) {
        setStudent(null);
        setFees([]);
        setSummary(null);
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
    try {
      const res = await axios.get(`${API}/fees/collection/student/${enrollmentId}`);
      setStudent(res.data.student);
      setFees(res.data.fees);
      setSummary(res.data.summary);
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

  // Open payment modal — extract fee items from feeStructure
  const openPaymentModal = (fee: FeeRecord) => {
    const feeItems = fee.feeStructure?.items?.map((item) => ({
      name: item.feeHead?.name || "Fee",
      amount: item.amount || 0,
      code: item.feeHead?.code || "",
    })) || [];

    const feeHeadStr =
      feeItems.length > 0
        ? feeItems.map((i) => i.name).join(", ")
        : fee.feeStructure?.name || "Fee";

    setPaymentModal({
      studentFeeId: fee.id,
      balance: fee.balanceAmount,
      feeHead: feeHeadStr,
      installmentNo: fee.installmentNo,
      feeItems,
    });
    setPaymentForm({
      amount: fee.balanceAmount.toString(),
      method: "CASH",
      reference: "",
      remarks: "",
      discountId: "",
      discountAmount: "",
    });
  };

  // Handle discount selection from dropdown
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

    // Cap at balance
    if (discountAmt > paymentModal.balance) discountAmt = paymentModal.balance;

    const newPayAmount = paymentModal.balance - discountAmt;

    setPaymentForm((prev) => ({
      ...prev,
      discountId,
      discountAmount: discountAmt.toString(),
      amount: newPayAmount.toString(),
    }));
  };

  // Collect payment
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
      setLastReceipt(res.data);
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

  // Print receipt
  const handlePrintReceipt = () => {
    if (!lastReceipt || !student) return;
    FeeReceiptPrint({
      receiptNo: lastReceipt.receiptNo,
      paymentDate: lastReceipt.payment.paymentDate,
      studentName: student.name,
      admissionNo: student.admissionNo,
      fatherName: student.fatherName,
      className: student.class,
      section: student.section,
      feeHead: lastReceipt.feeInfo.feeHead,
      feeItems: lastReceipt.feeInfo.feeItems || undefined,
      installmentNo: lastReceipt.feeInfo.installmentNo,
      amount: lastReceipt.payment.amount,
      method: lastReceipt.payment.method,
      reference: lastReceipt.payment.reference,
      rollNumber: student.rollNumber,
      balance: lastReceipt.feeInfo.balanceAmount,
      totalDue: summary?.totalBalance,
      discountAmount: lastReceipt.payment.discountAmount || lastReceipt.feeInfo.discountAmount || 0,
    });
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fee Collection</h1>
        <p className="text-gray-600 mt-1">Search by student name, admission number, or class</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by Name, Admission No, or Class..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {!loading && searchQuery.trim().length >= 3 && !student && searchResults.length === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center mb-6">
          <p className="text-red-600 text-sm font-medium">❌ Student not found</p>
        </div>
      )}

      {/* Search Results - Multiple Students */}
      {searchResults.length > 0 && !student && (
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Found {searchResults.length} students — select one:
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-3 py-2 font-medium text-gray-600">Adm No</th>
                  <th className="px-3 py-2 font-medium text-gray-600">Student Name</th>
                  <th className="px-3 py-2 font-medium text-gray-600">Father Name</th>
                  <th className="px-3 py-2 font-medium text-gray-600">Class</th>
                  <th className="px-3 py-2 font-medium text-gray-600">Section</th>
                  <th className="px-3 py-2 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((s: any) => (
                  <tr key={s.enrollmentId} className="border-t hover:bg-blue-50">
                    <td className="px-3 py-2 font-mono text-xs">{s.admissionNo}</td>
                    <td className="px-3 py-2 font-medium">{s.name}</td>
                    <td className="px-3 py-2 text-gray-600">{s.fatherName}</td>
                    <td className="px-3 py-2">{s.className}</td>
                    <td className="px-3 py-2">{s.sectionName}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => { setSearchResults([]); handleSearchByEnrollment(s.enrollmentId); }}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        View Fees
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Info Card */}
      {student && (
        <div className="bg-white rounded-lg shadow-sm border p-5 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Student Name</p>
              <p className="font-semibold text-gray-900 mt-0.5">{student.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Admission No</p>
              <p className="font-semibold text-gray-900 mt-0.5">{student.admissionNo}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Class & Section</p>
              <p className="font-semibold text-gray-900 mt-0.5">{student.class} - {student.section}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Father's Name</p>
              <p className="font-semibold text-gray-900 mt-0.5">{student.fatherName}</p>
            </div>
          </div>

          {summary && (
            <div className="mt-4 pt-4 border-t grid grid-cols-3 md:grid-cols-6 gap-3">
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-bold text-sm">{formatCurrency(summary.totalAmount)}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="text-xs text-gray-500">Discount</p>
                <p className="font-bold text-sm text-purple-600">{formatCurrency(summary.totalDiscount)}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="text-xs text-gray-500">Fine</p>
                <p className="font-bold text-sm text-red-600">{formatCurrency(summary.totalFine)}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="text-xs text-gray-500">Net</p>
                <p className="font-bold text-sm">{formatCurrency(summary.totalNet)}</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <p className="text-xs text-gray-500">Paid</p>
                <p className="font-bold text-sm text-green-600">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded">
                <p className="text-xs text-gray-500">Balance</p>
                <p className="font-bold text-sm text-red-600">{formatCurrency(summary.totalBalance)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assign Fees */}
      {student && fees.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center mb-6">
          <p className="text-yellow-800 mb-3">No fees assigned for this student yet.</p>
          <button onClick={handleAssignFees} disabled={assigning} className="px-6 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 font-medium">
            {assigning ? "Assigning..." : "Assign Fees"}
          </button>
        </div>
      )}

      {/* Fee Table */}
      {fees.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Head</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fine</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{fee.installmentNo}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {fee.feeStructure?.items?.map((i) => i.feeHead?.name).join(", ") || fee.feeStructure?.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(fee.dueDate)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(fee.totalAmount)}</td>
                    <td className="px-4 py-3 text-sm text-right text-purple-600">
                      {fee.discountAmount > 0 ? formatCurrency(fee.discountAmount) : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">
                      {fee.fineAmount > 0 ? formatCurrency(fee.fineAmount) : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(fee.netAmount)}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(fee.paidAmount)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-red-600">{formatCurrency(fee.balanceAmount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[fee.status]}`}>
                        {fee.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(fee.status === "PENDING" || fee.status === "PARTIAL" || fee.status === "OVERDUE") && (
                        <button onClick={() => openPaymentModal(fee)} className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700">
                          Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Last Receipt Print Button */}
      {lastReceipt && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-green-800 font-medium">Payment Successful! Receipt No: {lastReceipt.receiptNo}</p>
            <p className="text-green-600 text-sm">Amount: {formatCurrency(lastReceipt.payment.amount)} via {lastReceipt.payment.method}</p>
          </div>
          <button onClick={handlePrintReceipt} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm">
            🖨️ Print Receipt
          </button>
        </div>
      )}

      {/* ===== PAYMENT MODAL ===== */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 mx-4 my-auto max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Collect Payment</h3>
            <p className="text-sm text-gray-600 mb-4">
              Installment #{paymentModal.installmentNo}
            </p>

            {/* Fee Head Breakdown (read-only) */}
            {paymentModal.feeItems.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Fee Heads Included:</p>
                <table className="w-full text-sm">
                  <tbody>
                    {paymentModal.feeItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100 last:border-0">
                        <td className="py-1.5 text-gray-800">{item.name} <span className="text-xs text-gray-400">({item.code})</span></td>
                        <td className="py-1.5 text-right font-medium text-gray-900">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Balance Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 mb-4 flex items-center justify-between">
              <span className="text-sm text-blue-700 font-medium">Outstanding Balance</span>
              <span className="text-lg font-bold text-blue-900">{formatCurrency(paymentModal.balance)}</span>
            </div>

            <div className="space-y-4">
              {/* Discount Selection (from DB) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apply Discount</label>
                <select
                  value={paymentForm.discountId}
                  onChange={(e) => handleDiscountSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                >
                  <option value="">-- No Discount --</option>
                  {discounts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.type === "PERCENTAGE" ? `${d.value}%` : `₹${d.value}`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Discount Info */}
              {paymentForm.discountId && parseFloat(paymentForm.discountAmount) > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-800">Discount Applied</span>
                    <span className="text-lg font-bold text-purple-900">- {formatCurrency(parseFloat(paymentForm.discountAmount))}</span>
                  </div>
                  <div>
                    <label className="text-xs text-purple-700 font-medium">Adjust if needed:</label>
                    <input
                      type="number"
                      value={paymentForm.discountAmount}
                      onChange={(e) => {
                        const newDiscount = parseFloat(e.target.value) || 0;
                        const newPay = Math.max(0, paymentModal.balance - newDiscount);
                        setPaymentForm((prev) => ({ ...prev, discountAmount: e.target.value, amount: newPay.toString() }));
                      }}
                      min={0}
                      max={paymentModal.balance}
                      className="mt-1 w-full px-3 py-1.5 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Paying Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paying Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg font-semibold"
                  placeholder="₹ 0"
                  min={0}
                />
                {paymentForm.discountId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Balance {formatCurrency(paymentModal.balance)} - Discount {formatCurrency(parseFloat(paymentForm.discountAmount) || 0)} = {formatCurrency(parseFloat(paymentForm.amount) || 0)} payable
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method <span className="text-red-500">*</span></label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online</option>
                  <option value="UPI">UPI</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="DD">Demand Draft</option>
                </select>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Transaction ID</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Transaction ID, Cheque No, etc."
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={paymentForm.remarks}
                  onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows={2}
                  placeholder="Optional remarks..."
                />
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Paying</span>
                <span className="font-bold text-gray-900">{formatCurrency(parseFloat(paymentForm.amount) || 0)}</span>
              </div>
              {parseFloat(paymentForm.discountAmount) > 0 && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-purple-600">Discount</span>
                  <span className="font-bold text-purple-700">{formatCurrency(parseFloat(paymentForm.discountAmount))}</span>
                </div>
              )}
              <div className="flex justify-between text-sm mt-1 pt-1 border-t border-gray-200">
                <span className="text-gray-700 font-medium">Total Settled</span>
                <span className="font-bold text-green-700">
                  {formatCurrency((parseFloat(paymentForm.amount) || 0) + (parseFloat(paymentForm.discountAmount) || 0))}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setPaymentModal(null)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                Cancel
              </button>
              <button
                onClick={handleCollectPayment}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {submitting ? "Processing..." : "Collect Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeCollectionPage;

