
import React, { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import { printDocument, printMultipleReceipts } from "../../utils/print";
import {
  Search, Printer, FileText, Calendar, Users,
  IndianRupee, ChevronDown, ChevronUp, Filter, X,
} from "lucide-react";

const API = `${API_BASE_URL}/api`;

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

interface ReceiptRecord {
  id: string;
  receiptNo: string;
  studentName: string;
  admissionNo: string;
  fatherName: string;
  rollNumber: string;
  className: string;
  section: string;
  session: string;
  feeHead: string;
  feeItems: { name: string; amount: number }[];
  installmentNo: number;
  amount: number;
  method: string;
  paymentDate: string;
  date: string;
  totalFee: number;
  netAmount: number;
  balance: number;
  totalPaidTillDate: number;
  dueDate: string | null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const FeeReceiptsPage: React.FC = () => {
  // Data
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [classes, setClasses] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [filterClass, setFilterClass] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [viewMode, setViewMode] = useState<"day" | "all">("day");

  // Print
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([]);

  // Expanded date groups
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

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

  // ─── Fetch receipts ──────────────────────────────────────────
  const fetchReceipts = async () => {
    setLoading(true);
    setSelectedReceipts([]);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      let url = `${API}/fees/collection/all-payments`;
      if (viewMode === "day" && filterDate) {
        url = `${API}/fees/collection/daily-collection?date=${filterDate}`;
      }

      const res = await axios.get(url, { headers });

      let data: ReceiptRecord[] = [];
      if (viewMode === "day") {
        // daily-collection returns { date, payments: [...], byMethod, grandTotal }
        const raw = res.data?.payments || res.data?.data?.payments || [];
        data = raw.map((p: any) => ({
          id: p.id || p.receiptNo,
          receiptNo: p.receiptNo || "—",
          studentName: p.studentName || p.student?.name || "Unknown",
          admissionNo: p.admissionNo || p.student?.admissionNo || "",
          fatherName: p.fatherName || p.student?.fatherName || "",
          rollNumber: p.rollNumber || p.student?.rollNumber || "",
          className: p.className || p.student?.class || p.class || "",
          section: p.section || p.student?.section || "",
          session: p.session || "",
          feeHead: p.feeHead || p.feeStructure || "Fee",
          feeItems: p.feeItems || [],
          installmentNo: p.installmentNo || p.studentFee?.installmentNo || 1,
          amount: p.amount || 0,
          method: p.method || "CASH",
          paymentDate: p.paymentDate || p.date || filterDate,
          date: p.date || (p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN") : "—"),
          totalFee: p.totalFee || p.netAmount || 0,
          netAmount: p.netAmount || 0,
          balance: p.balance || 0,
          totalPaidTillDate: p.totalPaidTillDate || 0,
          dueDate: p.dueDate || null,
        }));
      } else {
        // all-payments returns { success, data: [...] }
        const raw = res.data?.data || res.data || [];
        data = (Array.isArray(raw) ? raw : []).map((p: any) => ({
          id: p.id || p.receiptNo,
          receiptNo: p.receiptNo || "—",
          studentName: p.studentName || "Unknown",
          admissionNo: p.admissionNo || "",
          fatherName: p.fatherName || "",
          rollNumber: p.rollNumber || "",
          className: p.className || "",
          section: p.section || "",
          session: p.session || "",
          feeHead: p.feeHead || "Fee",
          feeItems: p.feeItems || [],
          installmentNo: p.installmentNo || 1,
          amount: p.amount || p.paidAmount || 0,
          method: p.method || "CASH",
          paymentDate: p.paymentDate || "",
          date: p.date || (p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN") : "—"),
          totalFee: p.totalFee || p.netAmount || 0,
          netAmount: p.netAmount || 0,
          balance: p.balance || 0,
          totalPaidTillDate: p.totalPaidTillDate || 0,
          dueDate: p.dueDate || null,
        }));
      }

      setReceipts(data);
      // Auto-expand first date group in "all" mode
      if (viewMode === "all" && data.length > 0) {
        const firstDate = data[0].date;
        setExpandedDates(new Set([firstDate]));
      }
    } catch (err) {
      toast.error("Failed to load receipts");
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [viewMode, filterDate]);

  // ─── Filtered receipts ───────────────────────────────────────
  const filteredReceipts = useMemo(() => {
    let result = receipts;
    if (filterClass) {
      result = result.filter((r) => r.className === filterClass);
    }
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase();
      result = result.filter((r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.admissionNo.toLowerCase().includes(q) ||
        r.receiptNo.toLowerCase().includes(q)
      );
    }
    return result;
  }, [receipts, filterClass, filterSearch]);

  // ─── Group by date ───────────────────────────────────────────
  const groupedByDate = useMemo(() => {
    const groups: Record<string, ReceiptRecord[]> = {};
    for (const r of filteredReceipts) {
      const key = r.date || "Unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    return groups;
  }, [filteredReceipts]);

  const dateKeys = Object.keys(groupedByDate);

  // ─── Computed totals ─────────────────────────────────────────
  const totalCollection = filteredReceipts.reduce((s, r) => s + r.amount, 0);
  const totalCash = filteredReceipts.filter((r) => r.method === "CASH").reduce((s, r) => s + r.amount, 0);
  const totalOnline = filteredReceipts.filter((r) => r.method !== "CASH").reduce((s, r) => s + r.amount, 0);

  // ─── Print helpers ───────────────────────────────────────────
  const toggleReceipt = (receiptNo: string) => {
    setSelectedReceipts((prev) =>
      prev.includes(receiptNo) ? prev.filter((r) => r !== receiptNo) : [...prev, receiptNo]
    );
  };

  const selectAll = () => {
    if (selectedReceipts.length === filteredReceipts.length) {
      setSelectedReceipts([]);
    } else {
      setSelectedReceipts(filteredReceipts.map((r) => r.receiptNo));
    }
  };

  const printSingle = (r: ReceiptRecord) => {
    printDocument("fee_receipt", {
      receiptNo: r.receiptNo,
      paymentDate: r.paymentDate,
      studentName: r.studentName,
      admissionNo: r.admissionNo,
      fatherName: r.fatherName,
      className: r.className,
      section: r.section,
      feeHead: r.feeHead,
      feeItems: r.feeItems,
      installmentNo: r.installmentNo,
      amount: r.amount,
      method: r.method,
      totalDue: r.totalFee,
      annualFee: r.totalFee,
      annualBalance: r.balance,
      balance: r.balance,
      totalPaidTillDate: r.totalPaidTillDate,
      rollNumber: r.rollNumber,
      session: r.session,
      dueDate: r.dueDate,
    });
  };

  const bulkPrint = () => {
    if (selectedReceipts.length === 0) { toast.error("Select receipts to print"); return; }
    const selected = filteredReceipts.filter((r) => selectedReceipts.includes(r.receiptNo));
    printMultipleReceipts(selected.map((r) => ({
      receiptNo: r.receiptNo,
      paymentDate: r.paymentDate,
      studentName: r.studentName,
      admissionNo: r.admissionNo,
      fatherName: r.fatherName,
      className: r.className,
      section: r.section,
      feeHead: r.feeHead,
      feeItems: r.feeItems,
      installmentNo: r.installmentNo,
      amount: r.amount,
      method: r.method,
      totalDue: r.totalFee,
      annualFee: r.totalFee,
      annualBalance: r.balance,
      balance: r.balance,
      totalPaidTillDate: r.totalPaidTillDate,
      rollNumber: r.rollNumber,
      session: r.session,
      dueDate: r.dueDate,
    })));
  };

  const toggleDateGroup = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
    } catch { return d; }
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText size={24} className="text-indigo-500" /> Fee Receipts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View all fee receipts — filter by date, student, or class
          </p>
        </div>
      </div>

      {/* ═══ FILTERS ═══ */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          {/* View Mode Toggle */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">View</label>
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
              <button
                onClick={() => setViewMode("day")}
                className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === "day" ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50"}`}
              >
                <Calendar size={12} className="inline mr-1" /> Day Wise
              </button>
              <button
                onClick={() => setViewMode("all")}
                className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === "all" ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50"}`}
              >
                <FileText size={12} className="inline mr-1" /> All Receipts
              </button>
            </div>
          </div>

          {/* Date Picker (day mode) */}
          {viewMode === "day" && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white"
              />
            </div>
          )}

          {/* Class Filter */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Class</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white min-w-[120px]"
            >
              <option value="">All Classes</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-500 mb-1 block">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Student name, admission no, receipt no..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white placeholder-slate-400"
              />
              {filterSearch && (
                <button onClick={() => setFilterSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchReceipts}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ═══ SUMMARY CARDS ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
          <p className="text-xs text-slate-500">Total Receipts</p>
          <p className="text-xl font-bold text-indigo-600">{filteredReceipts.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
          <p className="text-xs text-slate-500">Total Collection</p>
          <p className="text-xl font-bold text-emerald-600">₹{totalCollection.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
          <p className="text-xs text-slate-500">Cash</p>
          <p className="text-xl font-bold text-green-600">₹{totalCash.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
          <p className="text-xs text-slate-500">Online / Other</p>
          <p className="text-xl font-bold text-blue-600">₹{totalOnline.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* ═══ BULK PRINT BAR ═══ */}
      {filteredReceipts.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              {selectedReceipts.length === filteredReceipts.length ? "Deselect All" : "Select All"}
            </button>
            <span className="text-xs text-slate-500">{selectedReceipts.length} selected</span>
          </div>
          <button
            onClick={bulkPrint}
            disabled={selectedReceipts.length === 0}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Printer size={12} /> Bulk Print ({selectedReceipts.length})
          </button>
        </div>
      )}

      {/* ═══ RECEIPTS TABLE ═══ */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2" />
          Loading receipts...
        </div>
      ) : filteredReceipts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
          <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">No Receipts Found</h3>
          <p className="text-sm text-slate-400 mt-2">
            {viewMode === "day"
              ? `No payments recorded on ${formatDate(filterDate)}`
              : "No receipts match your filters"}
          </p>
        </div>
      ) : viewMode === "day" ? (
        /* ─── Day View: Single flat table ─── */
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-950/30 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500" />
              {formatDate(filterDate)} — {filteredReceipts.length} receipt{filteredReceipts.length !== 1 ? "s" : ""}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <th className="py-2.5 px-2 w-8"><input type="checkbox" checked={selectedReceipts.length === filteredReceipts.length && filteredReceipts.length > 0} onChange={selectAll} className="rounded border-slate-300" /></th>
                  <th className="text-left py-2.5 px-2 text-xs font-semibold text-slate-500">Receipt No</th>
                  <th className="text-left py-2.5 px-2 text-xs font-semibold text-slate-500">Student</th>
                  <th className="text-left py-2.5 px-2 text-xs font-semibold text-slate-500">Class</th>
                  <th className="text-right py-2.5 px-2 text-xs font-semibold text-slate-500">Amount</th>
                  <th className="text-center py-2.5 px-2 text-xs font-semibold text-slate-500">Mode</th>
                  <th className="text-center py-2.5 px-2 text-xs font-semibold text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.map((r, idx) => (
                  <tr key={r.id || idx} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-2.5 px-2">
                      <input type="checkbox" checked={selectedReceipts.includes(r.receiptNo)} onChange={() => toggleReceipt(r.receiptNo)} className="rounded border-slate-300" />
                    </td>
                    <td className="py-2.5 px-2 font-mono text-xs font-medium text-slate-800 dark:text-slate-200">{r.receiptNo}</td>
                    <td className="py-2.5 px-2">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.studentName}</p>
                      <p className="text-[11px] text-slate-400">{r.admissionNo}{r.fatherName ? ` • F/O: ${r.fatherName}` : ""}</p>
                    </td>
                    <td className="py-2.5 px-2 text-sm text-slate-600 dark:text-slate-300">{r.className}{r.section ? ` - ${r.section}` : ""}</td>
                    <td className="py-2.5 px-2 text-right font-bold text-emerald-600">₹{r.amount.toLocaleString("en-IN")}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        r.method === "CASH" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      }`}>{r.method}</span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button onClick={() => printSingle(r)} className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-medium rounded-md hover:bg-indigo-700 inline-flex items-center gap-1">
                        <Printer size={10} /> Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ─── All View: Grouped by date (collapsible) ─── */
        <div className="space-y-3">
          {dateKeys.map((dateKey) => {
            const group = groupedByDate[dateKey];
            const isExpanded = expandedDates.has(dateKey);
            const groupTotal = group.reduce((s, r) => s + r.amount, 0);

            return (
              <div key={dateKey} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {/* Date Group Header */}
                <button
                  onClick={() => toggleDateGroup(dateKey)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-indigo-500" />
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{dateKey}</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full text-xs font-medium">
                      {group.length} receipt{group.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-emerald-600">₹{groupTotal.toLocaleString("en-IN")}</span>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </button>

                {/* Receipts Table (collapsible) */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="py-2 px-2 w-8"><input type="checkbox" onChange={() => {
                            const groupNos = group.map(r => r.receiptNo);
                            const allSelected = groupNos.every(n => selectedReceipts.includes(n));
                            if (allSelected) setSelectedReceipts(prev => prev.filter(n => !groupNos.includes(n)));
                            else setSelectedReceipts(prev => [...new Set([...prev, ...groupNos])]);
                          }} checked={group.every(r => selectedReceipts.includes(r.receiptNo))} className="rounded border-slate-300" /></th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">Receipt</th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">Student</th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">Class</th>
                          <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500">Amount</th>
                          <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500">Mode</th>
                          <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.map((r, idx) => (
                          <tr key={r.id || idx} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                            <td className="py-2.5 px-2">
                              <input type="checkbox" checked={selectedReceipts.includes(r.receiptNo)} onChange={() => toggleReceipt(r.receiptNo)} className="rounded border-slate-300" />
                            </td>
                            <td className="py-2.5 px-2 font-mono text-xs font-medium text-slate-800 dark:text-slate-200">{r.receiptNo}</td>
                            <td className="py-2.5 px-2">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.studentName}</p>
                              <p className="text-[11px] text-slate-400">{r.admissionNo}</p>
                            </td>
                            <td className="py-2.5 px-2 text-sm text-slate-600 dark:text-slate-300">{r.className}{r.section ? ` - ${r.section}` : ""}</td>
                            <td className="py-2.5 px-2 text-right font-bold text-emerald-600">₹{r.amount.toLocaleString("en-IN")}</td>
                            <td className="py-2.5 px-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                r.method === "CASH" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                              }`}>{r.method}</span>
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <button onClick={() => printSingle(r)} className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-medium rounded-md hover:bg-indigo-700 inline-flex items-center gap-1">
                                <Printer size={10} /> Print
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FeeReceiptsPage;
