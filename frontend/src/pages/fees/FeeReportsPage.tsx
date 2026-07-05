
import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import { printDocument } from "../../utils/print";
import {
  FiPrinter,
  FiDownload,
  FiFilter,
  FiCalendar,
  FiUsers,
  FiDollarSign,
  FiBookOpen,
  FiTruck,
  FiHome,
  FiFileText,
  FiCreditCard,
  FiAlertTriangle,
  FiAward,
  FiPercent,
  FiArrowLeft,
  FiBook,
  FiClipboard,
  FiRefreshCw,
} from "react-icons/fi";

const API = `${API_BASE_URL}/api`;

// ═══════════════════════════════════════════════════════════════════════════
// REPORT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

interface ReportDefinition {
  id: string;
  name: string;
  endpoint: string;
  icon: React.ReactNode;
  category: string;
  filters: string[];
  columns: { key: string; label: string; align?: string; format?: string }[];
  summaryKeys?: string[];
}

const REPORT_CATEGORIES = [
  { id: "collection", name: "Collection Reports", icon: <FiDollarSign /> },
  { id: "outstanding", name: "Outstanding & Defaulter", icon: <FiAlertTriangle /> },
  { id: "module", name: "Module-wise Reports", icon: <FiTruck /> },
  { id: "register", name: "Registers & Ledgers", icon: <FiBookOpen /> },
  { id: "books", name: "Cash & Bank Books", icon: <FiCreditCard /> },
  { id: "other", name: "Other Reports", icon: <FiFileText /> },
];

const REPORTS: ReportDefinition[] = [
  // ─── Collection Reports ────────────────────────────────────────
  {
    id: "daily-collection",
    name: "Daily Collection",
    endpoint: "/fees/reports/daily-collection",
    icon: <FiCalendar className="w-4 h-4" />,
    category: "collection",
    filters: ["date"],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "receiptNo", label: "Receipt No" },
      { key: "studentName", label: "Student Name" },
      { key: "admissionNo", label: "Adm No" },
      { key: "class", label: "Class" },
      { key: "amount", label: "Amount (₹)", align: "right", format: "currency" },
      { key: "method", label: "Mode" },
      { key: "reference", label: "Reference" },
    ],
    summaryKeys: ["totalReceipts", "totalAmount", "totalCash", "totalOnline"],
  },
  {
    id: "monthly-collection",
    name: "Monthly Collection",
    endpoint: "/fees/reports/monthly-collection",
    icon: <FiCalendar className="w-4 h-4" />,
    category: "collection",
    filters: ["year", "month"],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "month", label: "Month" },
      { key: "receipts", label: "Receipts", align: "center" },
      { key: "cash", label: "Cash (₹)", align: "right", format: "currency" },
      { key: "online", label: "Online (₹)", align: "right", format: "currency" },
      { key: "total", label: "Total (₹)", align: "right", format: "currency" },
    ],
    summaryKeys: ["totalReceipts", "totalAmount"],
  },
  {
    id: "head-wise",
    name: "Head-wise Collection",
    endpoint: "/fees/reports/head-wise",
    icon: <FiClipboard className="w-4 h-4" />,
    category: "collection",
    filters: ["dateRange"],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "headName", label: "Fee Head" },
      { key: "code", label: "Code" },
      { key: "category", label: "Category" },
      { key: "receipts", label: "Receipts", align: "center" },
      { key: "collected", label: "Collected (₹)", align: "right", format: "currency" },
    ],
    summaryKeys: ["totalHeads", "totalCollected"],
  },
  {
    id: "category-wise",
    name: "Category-wise Collection",
    endpoint: "/fees/reports/category-wise",
    icon: <FiClipboard className="w-4 h-4" />,
    category: "collection",
    filters: ["dateRange"],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "category", label: "Category" },
      { key: "heads", label: "Fee Heads", align: "center" },
      { key: "collected", label: "Collected (₹)", align: "right", format: "currency" },
    ],
    summaryKeys: ["totalCategories", "totalCollected"],
  },

  // ─── Outstanding & Defaulter ──────────────────────────────────
  {
    id: "pending",
    name: "Pending Fee",
    endpoint: "/fees/reports/pending",
    icon: <FiAlertTriangle className="w-4 h-4" />,
    category: "outstanding",
    filters: ["class", "section", "academicYear"],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "studentName", label: "Student Name" },
      { key: "admissionNo", label: "Adm No" },
      { key: "fatherName", label: "Father Name" },
      { key: "class", label: "Class" },
      { key: "phone", label: "Phone" },
      { key: "totalDue", label: "Total Due (₹)", align: "right", format: "currency" },
      { key: "totalPaid", label: "Paid (₹)", align: "right", format: "currency" },
      { key: "totalBalance", label: "Balance (₹)", align: "right", format: "currency" },
      { key: "pendingInstallments", label: "Pending Inst.", align: "center" },
    ],
    summaryKeys: ["totalStudents", "totalPending"],
  },
  {
    id: "defaulter",
    name: "Defaulter Report",
    endpoint: "/fees/reports/defaulter",
    icon: <FiAlertTriangle className="w-4 h-4" />,
    category: "outstanding",
    filters: ["class", "section", "academicYear", "monthYear", "feeCategory"],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "studentName", label: "Student Name" },
      { key: "admissionNo", label: "Adm No" },
      { key: "fatherName", label: "Father Name" },
      { key: "phone", label: "Phone" },
      { key: "class", label: "Class" },
      { key: "installmentNo", label: "Inst#", align: "center" },
      { key: "totalAmount", label: "Amount (₹)", align: "right", format: "currency" },
      { key: "paidAmount", label: "Paid (₹)", align: "right", format: "currency" },
      { key: "balance", label: "Balance (₹)", align: "right", format: "currency" },
      { key: "daysPending", label: "Days", align: "center" },
      { key: "status", label: "Status" },
    ],
    summaryKeys: ["totalDefaulters", "totalPending"],
  },
  {
    id: "fine",
    name: "Fine Report",
    endpoint: "/fees/reports/fine",
    icon: <FiAlertTriangle className="w-4 h-4" />,
    category: "outstanding",
    filters: ["dateRange", "class"],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "studentName", label: "Student Name" },
      { key: "admissionNo", label: "Adm No" },
      { key: "class", label: "Class" },
      { key: "installmentNo", label: "Inst#", align: "center" },
      { key: "fineAmount", label: "Fine (₹)", align: "right", format: "currency" },
      { key: "dueDate", label: "Due Date", format: "date" },
    ],
    summaryKeys: ["totalStudents", "totalFineCollected"],
  },
  {
    id: "concession",
    name: "Concession Report",
    endpoint: "/fees/reports/concession",
    icon: <FiPercent className="w-4 h-4" />,
    category: "outstanding",
    filters: ["academicYear", "class"],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "studentName", label: "Student Name" },
      { key: "admissionNo", label: "Adm No" },
      { key: "class", label: "Class" },
      { key: "discountName", label: "Concession" },
      { key: "discountType", label: "Type" },
      { key: "amountGiven", label: "Amount (₹)", align: "right", format: "currency" },
    ],
    summaryKeys: ["totalConcessions", "totalAmount"],
  },
  {
    id: "scholarship",
    name: "Scholarship Report",
    endpoint: "/fees/reports/scholarship",
    icon: <FiAward className="w-4 h-4" />,
    category: "outstanding",
    filters: ["academicYear"],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "studentName", label: "Student Name" },
      { key: "admissionNo", label: "Adm No" },
      { key: "class", label: "Class" },
      { key: "scholarshipName", label: "Scholarship" },
      { key: "amount", label: "Amount (₹)", align: "right", format: "currency" },
    ],
    summaryKeys: ["totalScholarships", "totalAmount"],
  },

  // ─── Module-wise Reports ──────────────────────────────────────
  {
    id: "transport",
    name: "Transport Fee Report",
    endpoint: "/fees/reports/transport",
    icon: <FiTruck className="w-4 h-4" />,
    category: "module",
    filters: ["class", "academicYear"],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "studentName", label: "Student Name" },
      { key: "admissionNo", label: "Adm No" },
      { key: "class", label: "Class" },
      { key: "installmentNo", label: "Inst#", align: "center" },
      { key: "feeAmount", label: "Fee (₹)", align: "right", format: "currency" },
      { key: "paidAmount", label: "Paid (₹)", align: "right", format: "currency" },
      { key: "balance", label: "Balance (₹)", align: "right", format: "currency" },
      { key: "status", label: "Status" },
    ],
    summaryKeys: ["totalStudents", "totalFee", "totalCollected", "totalPending"],
  },
  {
    id: "hostel",
    name: "Hostel Fee Report",
    endpoint: "/fees/reports/hostel",
    icon: <FiHome className="w-4 h-4" />,
    category: "module",
    filters: ["class", "academicYear"],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "studentName", label: "Student Name" },
      { key: "admissionNo", label: "Adm No" },
      { key: "class", label: "Class" },
      { key: "installmentNo", label: "Inst#", align: "center" },
      { key: "feeAmount", label: "Fee (₹)", align: "right", format: "currency" },
      { key: "paidAmount", label: "Paid (₹)", align: "right", format: "currency" },
      { key: "balance", label: "Balance (₹)", align: "right", format: "currency" },
      { key: "status", label: "Status" },
    ],
    summaryKeys: ["totalStudents", "totalFee", "totalCollected", "totalPending"],
  },
  {
    id: "exam",
    name: "Exam Fee Report",
    endpoint: "/fees/reports/exam",
    icon: <FiBook className="w-4 h-4" />,
    category: "module",
    filters: ["class", "academicYear"],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "studentName", label: "Student Name" },
      { key: "admissionNo", label: "Adm No" },
      { key: "class", label: "Class" },
      { key: "installmentNo", label: "Inst#", align: "center" },
      { key: "feeAmount", label: "Fee (₹)", align: "right", format: "currency" },
      { key: "paidAmount", label: "Paid (₹)", align: "right", format: "currency" },
      { key: "balance", label: "Balance (₹)", align: "right", format: "currency" },
      { key: "status", label: "Status" },
    ],
    summaryKeys: ["totalStudents", "totalFee", "totalCollected", "totalPending"],
  },

  // ─── Registers & Ledgers ──────────────────────────────────────
  {
    id: "collection-register",
    name: "Collection Register",
    endpoint: "/fees/reports/collection-register",
    icon: <FiBookOpen className="w-4 h-4" />,
    category: "register",
    filters: ["dateRange", "method"],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "date", label: "Date", format: "date" },
      { key: "receiptNo", label: "Receipt No" },
      { key: "studentName", label: "Student Name" },
      { key: "admissionNo", label: "Adm No" },
      { key: "class", label: "Class" },
      { key: "amount", label: "Amount (₹)", align: "right", format: "currency" },
      { key: "method", label: "Mode" },
      { key: "reference", label: "Reference" },
    ],
    summaryKeys: ["totalReceipts", "totalAmount"],
  },
  {
    id: "receipt-register",
    name: "Receipt Register",
    endpoint: "/fees/reports/receipt-register",
    icon: <FiFileText className="w-4 h-4" />,
    category: "register",
    filters: ["dateRange"],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "date", label: "Date", format: "date" },
      { key: "receiptNo", label: "Receipt No" },
      { key: "studentName", label: "Student Name" },
      { key: "admissionNo", label: "Adm No" },
      { key: "class", label: "Class" },
      { key: "amount", label: "Amount (₹)", align: "right", format: "currency" },
      { key: "method", label: "Mode" },
      { key: "reference", label: "Reference" },
    ],
    summaryKeys: ["totalReceipts", "totalAmount"],
  },
  {
    id: "student-ledger",
    name: "Student Ledger",
    endpoint: "/fees/reports/student-ledger",
    icon: <FiUsers className="w-4 h-4" />,
    category: "register",
    filters: ["studentSearch"],
    columns: [
      { key: "date", label: "Date", format: "date" },
      { key: "particular", label: "Particular" },
      { key: "debit", label: "Debit (₹)", align: "right", format: "currency" },
      { key: "credit", label: "Credit (₹)", align: "right", format: "currency" },
      { key: "balance", label: "Balance (₹)", align: "right", format: "currency" },
      { key: "type", label: "Type" },
      { key: "reference", label: "Reference" },
    ],
    summaryKeys: ["totalCharged", "totalPaid", "currentBalance"],
  },
  {
    id: "class-ledger",
    name: "Class Ledger",
    endpoint: "/fees/reports/class-ledger",
    icon: <FiBookOpen className="w-4 h-4" />,
    category: "register",
    filters: ["academicYear"],
    columns: [
      { key: "className", label: "Class" },
      { key: "students", label: "Students", align: "center" },
      { key: "totalDemand", label: "Demand (₹)", align: "right", format: "currency" },
      { key: "totalCollected", label: "Collected (₹)", align: "right", format: "currency" },
      { key: "totalPending", label: "Pending (₹)", align: "right", format: "currency" },
      { key: "totalFine", label: "Fine (₹)", align: "right", format: "currency" },
      { key: "totalDiscount", label: "Discount (₹)", align: "right", format: "currency" },
    ],
    summaryKeys: ["totalClasses", "totalDemand", "totalCollected", "totalPending"],
  },

  // ─── Cash & Bank Books ────────────────────────────────────────
  {
    id: "cash-book",
    name: "Cash Book",
    endpoint: "/fees/reports/cash-book",
    icon: <FiDollarSign className="w-4 h-4" />,
    category: "books",
    filters: ["dateRange"],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "date", label: "Date", format: "date" },
      { key: "receiptNo", label: "Receipt No" },
      { key: "studentName", label: "Student Name" },
      { key: "admissionNo", label: "Adm No" },
      { key: "class", label: "Class" },
      { key: "amount", label: "Amount (₹)", align: "right", format: "currency" },
      { key: "reference", label: "Reference" },
    ],
    summaryKeys: ["totalReceipts", "totalAmount"],
  },
  {
    id: "bank-book",
    name: "Bank Book",
    endpoint: "/fees/reports/bank-book",
    icon: <FiCreditCard className="w-4 h-4" />,
    category: "books",
    filters: ["dateRange"],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "date", label: "Date", format: "date" },
      { key: "receiptNo", label: "Receipt No" },
      { key: "studentName", label: "Student Name" },
      { key: "admissionNo", label: "Adm No" },
      { key: "class", label: "Class" },
      { key: "amount", label: "Amount (₹)", align: "right", format: "currency" },
      { key: "method", label: "Mode" },
      { key: "reference", label: "Reference" },
    ],
    summaryKeys: ["totalReceipts", "totalAmount"],
  },

  // ─── Other Reports ────────────────────────────────────────────
  {
    id: "advance-balance",
    name: "Advance Balance",
    endpoint: "/fees/reports/advance-balance",
    icon: <FiRefreshCw className="w-4 h-4" />,
    category: "other",
    filters: [],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "studentName", label: "Student Name" },
      { key: "admissionNo", label: "Adm No" },
      { key: "class", label: "Class" },
      { key: "totalPaid", label: "Paid (₹)", align: "right", format: "currency" },
      { key: "totalDue", label: "Due (₹)", align: "right", format: "currency" },
      { key: "advanceBalance", label: "Advance (₹)", align: "right", format: "currency" },
    ],
    summaryKeys: ["totalStudents", "totalAdvance"],
  },
  {
    id: "refund",
    name: "Refund Report",
    endpoint: "/fees/reports/refund",
    icon: <FiRefreshCw className="w-4 h-4" />,
    category: "other",
    filters: [],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "studentName", label: "Student Name" },
      { key: "amount", label: "Amount (₹)", align: "right", format: "currency" },
    ],
    summaryKeys: ["totalRefunds", "totalAmount"],
  },
  {
    id: "adjustment",
    name: "Adjustment Report",
    endpoint: "/fees/reports/adjustment",
    icon: <FiRefreshCw className="w-4 h-4" />,
    category: "other",
    filters: [],
    columns: [
      { key: "sNo", label: "S.No", align: "center" },
      { key: "studentName", label: "Student Name" },
      { key: "amount", label: "Amount (₹)", align: "right", format: "currency" },
    ],
    summaryKeys: ["totalAdjustments", "totalAmount"],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const FeeReportsPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  // Filter states
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | "">("");
  const [filterClassId, setFilterClassId] = useState("");
  const [filterSectionId, setFilterSectionId] = useState("");
  const [filterAcademicYearId, setFilterAcademicYearId] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [filterFeeCategory, setFilterFeeCategory] = useState("");
  const [filterStudentQuery, setFilterStudentQuery] = useState("");
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("");

  // Dropdown data
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string }[]>([]);

  const currentReport = REPORTS.find((r) => r.id === selectedReport) || REPORTS[0];

  // ─── Load dropdowns ────────────────────────────────────────────
  useEffect(() => {
    fetchClasses();
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (filterClassId) fetchSections(filterClassId);
    else setSections([]);
  }, [filterClassId]);

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API}/class`);
      if (res.data.success) setClasses(res.data.data || []);
      else setClasses(res.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchSections = async (classId: string) => {
    try {
      const res = await axios.get(`${API}/section`, { params: { classId } });
      if (res.data.success) setSections(res.data.data || []);
      else setSections(res.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await axios.get(`${API}/academic`);
      if (res.data.success) setAcademicYears(res.data.data || []);
      else setAcademicYears(res.data || []);
    } catch (e) { console.error(e); }
  };

  // ─── Fetch Report Data ─────────────────────────────────────────
  const fetchReport = useCallback(async () => {
    if (!currentReport) return;

    setLoading(true);
    setData(null);

    try {
      let endpoint = `${API}${currentReport.endpoint}`;
      const params: any = {};

      // Build params based on filters
      if (currentReport.filters.includes("date")) {
        params.date = filterDate;
      }
      if (currentReport.filters.includes("dateRange")) {
        if (filterFromDate) params.fromDate = filterFromDate;
        if (filterToDate) params.toDate = filterToDate;
      }
      if (currentReport.filters.includes("year")) {
        params.year = filterYear;
        if (filterMonth) params.month = filterMonth;
      }
      if (currentReport.filters.includes("month")) {
        if (filterMonth) params.month = filterMonth;
      }
      if (currentReport.filters.includes("class") && filterClassId) {
        params.classId = filterClassId;
      }
      if (currentReport.filters.includes("section") && filterSectionId) {
        params.sectionId = filterSectionId;
      }
      if (currentReport.filters.includes("academicYear") && filterAcademicYearId) {
        params.academicYearId = filterAcademicYearId;
      }
      if (currentReport.filters.includes("method") && filterMethod) {
        params.method = filterMethod;
      }
      if (currentReport.filters.includes("feeCategory") && filterFeeCategory) {
        params.feeCategory = filterFeeCategory;
      }
      if (currentReport.filters.includes("monthYear")) {
        if (filterMonth) params.month = filterMonth;
        if (filterYear) params.year = filterYear;
      }

      // Student ledger — needs enrollmentId in path
      if (currentReport.id === "student-ledger" && selectedEnrollmentId) {
        endpoint = `${API}${currentReport.endpoint}/${selectedEnrollmentId}`;
      }

      const res = await axios.get(endpoint, { params });
      const responseData = res.data.success ? res.data.data : res.data;
      setData(responseData);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [currentReport, filterDate, filterFromDate, filterToDate, filterYear, filterMonth, filterClassId, filterSectionId, filterAcademicYearId, filterMethod, filterFeeCategory, selectedEnrollmentId]);

  // Auto-fetch on report change or filter change
  useEffect(() => {
    if (!selectedReport) {
      setData(null);
      return;
    }
    // For student-ledger, only fetch if enrollmentId is selected
    if (currentReport?.id === "student-ledger" && !selectedEnrollmentId) {
      setData(null);
      return;
    }
    fetchReport();
  }, [selectedReport]); // eslint-disable-line

  // ─── Student Search (for Student Ledger) ───────────────────────
  const handleStudentSearch = async () => {
    if (!filterStudentQuery.trim()) return;
    try {
      const res = await axios.get(`${API}/fees/ledger/search`, {
        params: { q: filterStudentQuery.trim() },
      });
      const results = res.data.results || res.data.data || [];
      setStudentSearchResults(Array.isArray(results) ? results : []);
    } catch (error: any) {
      toast.error("Student not found");
      setStudentSearchResults([]);
    }
  };

  // ─── Format helpers ────────────────────────────────────────────
  const formatCurrency = (amount: number) => {
    if (amount === 0) return "—";
    return new Intl.NumberFormat("en-IN").format(Math.round(amount));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCellValue = (value: any, format?: string) => {
    if (value === null || value === undefined) return "—";
    if (format === "currency") return formatCurrency(value);
    if (format === "date") return formatDate(value);
    return String(value);
  };

  // ─── CSV Export ────────────────────────────────────────────────
  const exportCSV = () => {
    if (!data?.records?.length) {
      toast.error("No data to export");
      return;
    }

    const headers = currentReport.columns.map((c) => c.label);
    const rows = data.records.map((row: any) =>
      currentReport.columns.map((col) => {
        const val = row[col.key];
        if (col.format === "date" && val) return formatDate(val);
        return val ?? "";
      })
    );

    const csv = [headers.join(","), ...rows.map((r: any) => r.map((v: any) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentReport.id}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  // ─── Print (LOCKED FORMAT) ─────────────────────────────────────
  const handlePrint = () => {
    if (!data?.records?.length) {
      toast.error("No data to print");
      return;
    }

    const tenant = JSON.parse(localStorage.getItem("tenant") || "{}");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const schoolName = tenant.name || tenant.schoolName || "School Name";
    const address = tenant.address || "";
    const logoUrl = tenant.logoUrl || "";
    const printedBy = user.name || user.firstName || "Admin";
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

    // Build table rows
    const tableHeaders = currentReport.columns
      .map((col) => `<th style="border:1px solid #000; padding:4px 6px; font-size:9px; text-align:${col.align || "left"}; white-space:nowrap;">${col.label}</th>`)
      .join("");

    const tableRows = data.records
      .map((row: any) => {
        const cells = currentReport.columns
          .map((col) => `<td style="border:1px solid #000; padding:3px 6px; font-size:9px; text-align:${col.align || "left"};">${formatCellValue(row[col.key], col.format)}</td>`)
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    // Summary row
    let summaryHTML = "";
    if (data.summary) {
      const summaryItems = Object.entries(data.summary)
        .map(([key, value]) => {
          const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
          const formatted = typeof value === "number" ? `₹${formatCurrency(value as number)}` : value;
          return `<span style="margin-right:20px;"><strong>${label}:</strong> ${formatted}</span>`;
        })
        .join("");
      summaryHTML = `<div style="margin-top:8px; padding:6px; background:#f0f0f0; border:1px solid #000; font-size:9px;">${summaryItems}</div>`;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 10px;">
        <!-- LOCKED HEADER -->
        <div style="display:flex; align-items:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:8px;">
          <!-- Logo LEFT -->
          <div style="width:60px;">
            ${logoUrl ? `<img src="${logoUrl}" style="width:50px; height:50px; object-fit:contain;" />` : ""}
          </div>
          <!-- Center: School Name + Address -->
          <div style="flex:1; text-align:center;">
            <div style="font-size:16px; font-weight:bold; letter-spacing:0.5px;">${schoolName}</div>
            <div style="font-size:10px; color:#333;">${address}</div>
          </div>
          <!-- Right: Printed by + Date/Time -->
          <div style="width:180px; text-align:right; font-size:9px; color:#555;">
            <div>Printed by: <strong>${printedBy}</strong></div>
            <div>Date: ${dateStr}</div>
            <div>Time: ${timeStr}</div>
          </div>
        </div>

        <!-- Report Title + Count -->
        <div style="text-align:center; margin-bottom:10px;">
          <div style="font-size:13px; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">${currentReport.name}</div>
          <div style="font-size:9px; color:#666;">Total Records: ${data.records.length}</div>
        </div>

        <!-- Table -->
        <table style="width:100%; border-collapse:collapse; border:1px solid #000;">
          <thead>
            <tr style="background:#e8e8e8;">${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <!-- Summary -->
        ${summaryHTML}
      </div>
    `;

    printDocument(html);
  };

  // ─── Render Filters ────────────────────────────────────────────
  const renderFilters = () => {
    const filters = currentReport.filters;
    if (filters.length === 0) return null;

    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <FiFilter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 items-end">
          {/* Single Date */}
          {filters.includes("date") && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded text-sm dark:bg-slate-700 dark:text-white"
              />
            </div>
          )}

          {/* Date Range */}
          {filters.includes("dateRange") && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">From Date</label>
                <input
                  type="date"
                  value={filterFromDate}
                  onChange={(e) => setFilterFromDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded text-sm dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">To Date</label>
                <input
                  type="date"
                  value={filterToDate}
                  onChange={(e) => setFilterToDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded text-sm dark:bg-slate-700 dark:text-white"
                />
              </div>
            </>
          )}

          {/* Year */}
          {filters.includes("year") && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Year</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value))}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded text-sm dark:bg-slate-700 dark:text-white"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {/* Month */}
          {(filters.includes("month") || filters.includes("monthYear")) && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Month</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value ? parseInt(e.target.value) : "")}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded text-sm dark:bg-slate-700 dark:text-white"
              >
                <option value="">All Months</option>
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {/* Class */}
          {filters.includes("class") && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Class</label>
              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded text-sm dark:bg-slate-700 dark:text-white"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Section */}
          {filters.includes("section") && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Section</label>
              <select
                value={filterSectionId}
                onChange={(e) => setFilterSectionId(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded text-sm dark:bg-slate-700 dark:text-white"
              >
                <option value="">All Sections</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Academic Year */}
          {filters.includes("academicYear") && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Session</label>
              <select
                value={filterAcademicYearId}
                onChange={(e) => setFilterAcademicYearId(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded text-sm dark:bg-slate-700 dark:text-white"
              >
                <option value="">All Sessions</option>
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Method */}
          {filters.includes("method") && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mode</label>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded text-sm dark:bg-slate-700 dark:text-white"
              >
                <option value="">All</option>
                <option value="CASH">Cash</option>
                <option value="ONLINE">Online</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="DD">DD</option>
              </select>
            </div>
          )}

          {/* Fee Category (for defaulter) */}
          {filters.includes("feeCategory") && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fee Category</label>
              <select
                value={filterFeeCategory}
                onChange={(e) => setFilterFeeCategory(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded text-sm dark:bg-slate-700 dark:text-white"
              >
                <option value="">All</option>
                <option value="Transport">Transport</option>
                <option value="Hostel">Hostel</option>
                <option value="Examination">Examination</option>
                <option value="Academic">Academic</option>
              </select>
            </div>
          )}

          {/* Student Search (for Student Ledger) */}
          {filters.includes("studentSearch") && (
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Search Student</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={filterStudentQuery}
                  onChange={(e) => setFilterStudentQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStudentSearch()}
                  placeholder="Name or Admission No..."
                  className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded text-sm dark:bg-slate-700 dark:text-white"
                />
                <button
                  onClick={handleStudentSearch}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                >
                  Search
                </button>
              </div>
              {/* Student search results */}
              {studentSearchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded max-h-32 overflow-y-auto">
                  {studentSearchResults.map((s: any) => (
                    <button
                      key={s.enrollmentId || s.id}
                      onClick={() => {
                        setSelectedEnrollmentId(s.enrollmentId || s.id);
                        setStudentSearchResults([]);
                        setFilterStudentQuery(s.name || `${s.firstName || ""} ${s.lastName || ""}`.trim());
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-slate-700 border-b last:border-b-0"
                    >
                      <span className="font-medium">{s.name || `${s.firstName || ""} ${s.lastName || ""}`}</span>
                      <span className="text-gray-500 ml-2">({s.admissionNo})</span>
                      {s.className && <span className="text-gray-400 ml-2">- {s.className}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fetch Button */}
          <div>
            <button
              onClick={fetchReport}
              disabled={loading}
              className="w-full px-4 py-1.5 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Loading..." : "Fetch"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render Data Table ─────────────────────────────────────────
  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-gray-500">Loading report...</span>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="text-center py-20 text-gray-400">
          <FiFileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select filters and click "Fetch" to load report</p>
        </div>
      );
    }

    const records = data.records || data.entries || [];

    if (records.length === 0) {
      return (
        <div className="text-center py-20 text-gray-400">
          <p>No records found for the selected filters</p>
          {data.message && <p className="text-xs mt-2">{data.message}</p>}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
              {currentReport.columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 font-semibold text-gray-600 dark:text-gray-300 text-${col.align || "left"} text-xs whitespace-nowrap`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {records.map((row: any, idx: number) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                {currentReport.columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2 text-${col.align || "left"} text-xs whitespace-nowrap`}
                  >
                    {col.key === "status" ? (
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          row[col.key] === "PAID"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : row[col.key] === "PARTIAL"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                            : row[col.key] === "OVERDUE"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {row[col.key]}
                      </span>
                    ) : (
                      formatCellValue(row[col.key], col.format)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Bar */}
        {data.summary && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600">
            <div className="flex flex-wrap gap-4 text-xs">
              {Object.entries(data.summary).map(([key, value]) => {
                const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
                const formatted = typeof value === "number" && key.toLowerCase().includes("amount") || key.toLowerCase().includes("total") && typeof value === "number"
                  ? `₹${formatCurrency(value as number)}`
                  : value;
                return (
                  <span key={key} className="text-gray-600 dark:text-gray-300">
                    <strong>{label}:</strong> {String(formatted)}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Student info for Student Ledger */}
        {data.student && (
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t text-xs">
            <strong>Student:</strong> {data.student.name} | <strong>Adm No:</strong> {data.student.admissionNo} | <strong>Class:</strong> {data.student.class} | <strong>Father:</strong> {data.student.fatherName}
          </div>
        )}
      </div>
    );
  };

  // ─── RENDER ────────────────────────────────────────────────────
  const CATEGORY_COLORS: Record<string, string> = {
    collection: "emerald",
    outstanding: "red",
    module: "amber",
    register: "blue",
    books: "purple",
    other: "slate",
  };

  const colorClasses: Record<string, { bg: string; bgLight: string }> = {
    emerald: { bg: "bg-emerald-500", bgLight: "bg-emerald-50" },
    red: { bg: "bg-red-500", bgLight: "bg-red-50" },
    amber: { bg: "bg-amber-500", bgLight: "bg-amber-50" },
    blue: { bg: "bg-blue-500", bgLight: "bg-blue-50" },
    purple: { bg: "bg-purple-500", bgLight: "bg-purple-50" },
    slate: { bg: "bg-slate-500", bgLight: "bg-slate-50" },
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* ─── HEADER ─────────────────────────────────────────── */}
      {!selectedReport ? (
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Fee Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select a report to generate</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedReport(""); setData(null); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Reports
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                {currentReport.icon}
                {currentReport.name}
              </h1>
              {data?.records && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {data.records.length} record{data.records.length !== 1 ? "s" : ""} found
                </p>
              )}
              {data?.entries && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {data.entries.length} entr{data.entries.length !== 1 ? "ies" : "y"} found
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={!data?.records?.length && !data?.entries?.length}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-40 transition-colors"
            >
              <FiPrinter className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={exportCSV}
              disabled={!data?.records?.length && !data?.entries?.length}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-40 transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>
      )}

      {/* ─── REPORT CARDS (when no report selected) ───────── */}
      {!selectedReport && (
        <div className="space-y-5">
          {REPORT_CATEGORIES.map((cat) => {
            const catReports = REPORTS.filter((r) => r.category === cat.id);
            const color = CATEGORY_COLORS[cat.id] || "slate";
            const cls = colorClasses[color] || colorClasses.slate;
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500 dark:text-gray-400">{cat.icon}</span>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{cat.name}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">({catReports.length})</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1.5">
                  {catReports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => { setSelectedReport(report.id); setData(null); }}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg ${cls.bgLight} hover:scale-105 transition-all`}
                    >
                      <div className={`w-7 h-7 rounded-md ${cls.bg} flex items-center justify-center`}>
                        <span className="text-white [&>svg]:w-3.5 [&>svg]:h-3.5">{report.icon}</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate w-full text-center">{report.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── FILTERS + TABLE (when report selected) ───────── */}
      {selectedReport && (
        <div>
          {renderFilters()}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            {renderTable()}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeReportsPage;
