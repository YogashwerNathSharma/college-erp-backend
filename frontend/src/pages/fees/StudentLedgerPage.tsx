
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import PrintSignature from "../../components/PrintSignature";
import {
  Search, Printer, FileText, User, Hash, GraduationCap, Filter,
  Users as UsersIcon, CalendarDays, Wallet, TrendingUp,
  BadgePercent, AlertCircle, Receipt,
} from "lucide-react";

const API = `${API_BASE_URL}/api`;

interface StudentInfo {
  name: string;
  admissionNo: string;
  fatherName: string;
  phone: string;
  class: string;
  section: string;
  session: string;
  enrollmentId: string;
}

interface LedgerEntry {
  date: string;
  particulars: string;
  receiptNo: string;
  debit: number;
  credit: number;
  balance: number;
}

interface LedgerData {
  student: StudentInfo;
  summary: { totalFee: number; totalPaid: number; totalDiscount: number; balance: number };
  entries: LedgerEntry[];
}

interface SearchResult {
  enrollmentId: string;
  name: string;
  admissionNo: string;
  fatherName: string;
  className: string;
  sectionName: string;
}

const StudentLedgerPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [ledgerData, setLedgerData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // ─── Class / Section filter state ───
  const [academicYearId, setAcademicYearId] = useState("");
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [filterStudents, setFilterStudents] = useState<SearchResult[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── Fetch active academic year on mount ───
  useEffect(() => {
    const fetchYear = async () => {
      try {
        const res = await axios.get(`${API}/academic`);
        const years = res.data?.data || res.data || [];
        const active = years.find((y: any) => y.isActive) || years[0];
        if (active) setAcademicYearId(active.id);
      } catch { /* ignore */ }
    };
    fetchYear();
  }, []);

  // ─── Fetch classes (scoped to active academic year) ───
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${API}/class`, {
          params: academicYearId ? { academicYearId } : {},
        });
        setClasses(res.data?.data || res.data || []);
      } catch { setClasses([]); }
    };
    fetchClasses();
  }, [academicYearId]);

  // ─── Fetch sections when class changes ───
  useEffect(() => {
    if (!selectedClass) { setSections([]); setFilterStudents([]); return; }
    const fetchSections = async () => {
      try {
        const res = await axios.get(`${API}/section?classId=${selectedClass}`);
        setSections(res.data?.data || res.data || []);
      } catch { setSections([]); }
    };
    fetchSections();
    setSelectedSection("");
    setFilterStudents([]);
  }, [selectedClass]);

  // ─── Fetch students when section changes ───
  useEffect(() => {
    if (!selectedClass || !selectedSection) { setFilterStudents([]); return; }
    const fetchStudents = async () => {
      setStudentsLoading(true);
      try {
        const res = await axios.get(`${API}/students?classId=${selectedClass}&sectionId=${selectedSection}&limit=500`);
        const raw: any[] = res.data?.data?.students || res.data?.data || [];
        setFilterStudents(raw.map((s: any) => ({
          enrollmentId: s.enrollments?.[0]?.id || s.enrollmentId || s.id,
          name: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
          admissionNo: s.admissionNo || "",
          fatherName: s.fatherName || "",
          className: s.enrollments?.[0]?.class?.name || s.className || "",
          sectionName: s.enrollments?.[0]?.section?.name || s.sectionName || "",
        })));
      } catch { setFilterStudents([]); }
      finally { setStudentsLoading(false); }
    };
    fetchStudents();
  }, [selectedSection]);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const res = await axios.get(`${API}/fees/ledger/search`, {
        params: { q: searchQuery.trim() },
      });
      if (res.data.success) {
        setSearchResults(res.data.data);
      }
    } catch (error: any) {
      console.error("Search failed:", error);
    } finally {
      setSearching(false);
    }
  };

  const loadLedger = async (enrollmentId: string) => {
    setLoading(true);
    setSearchResults([]);
    try {
      const res = await axios.get(`${API}/fees/ledger/${enrollmentId}`);
      if (res.data.success) {
        setLedgerData(res.data.data);
        setSearchQuery("");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <FileText size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Student Fee Ledger</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Complete fee transaction history of a student</p>
          </div>
        </div>
        {ledgerData && (
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 hover:to-violet-700 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 active:scale-95 no-print"
          >
            <Printer size={16} />
            Print Ledger
          </button>
        )}
      </div>

      {/* ═══ Search Bar ═══ */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6 relative no-print">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Student Name or Admission No..."
            className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 dark:text-white placeholder-slate-400 transition-all"
          />
          {searching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* Search Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-20 max-h-72 overflow-y-auto">
            {searchResults.map((s) => (
              <button
                key={s.enrollmentId}
                onClick={() => loadLedger(s.enrollmentId)}
                className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border-b border-slate-100 dark:border-slate-700/60 last:border-b-0 transition-colors group"
              >
                <div className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-300">
                        {s.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{s.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Father: {s.fatherName}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">{s.admissionNo}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{s.className} - {s.sectionName}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Class / Section Filter ═══ */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6 no-print">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={15} className="text-indigo-500" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Filter by Class &amp; Section</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Class dropdown */}
          <div className="flex-1">
            <label className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium mb-1 block">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-slate-800 dark:text-white"
            >
              <option value="">Select Class</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {/* Section dropdown */}
          <div className="flex-1">
            <label className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium mb-1 block">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedClass}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-slate-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All Sections</option>
              {sections.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          {/* Clear button */}
          {(selectedClass || selectedSection) && (
            <div className="flex items-end">
              <button
                onClick={() => { setSelectedClass(""); setSelectedSection(""); setFilterStudents([]); }}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Student list from filter */}
        {studentsLoading && (
          <div className="flex items-center gap-2 mt-4 text-sm text-slate-400">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
            Loading students...
          </div>
        )}
        {!studentsLoading && filterStudents.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
            {filterStudents.map((s) => (
              <button
                key={s.enrollmentId}
                onClick={() => loadLedger(s.enrollmentId)}
                className="flex items-center gap-3 text-left px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors group"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-300">{s.name?.charAt(0)?.toUpperCase() || "?"}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{s.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {s.admissionNo}{s.fatherName ? ` • ${s.fatherName}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
        {!studentsLoading && selectedClass && selectedSection && filterStudents.length === 0 && (
          <p className="mt-4 text-sm text-slate-400 text-center py-3">No students found in this class/section</p>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-9 w-9 border-2 border-indigo-500 border-t-transparent"></div>
          <span className="ml-3 text-slate-500 dark:text-slate-400 font-medium">Loading ledger...</span>
        </div>
      )}

      {ledgerData && (
        <div id="ledger-print-area">
          {/* ═══ Student Info Card ═══ */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
            {/* Student banner */}
            <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold text-white shrink-0 ring-2 ring-white/30">
                  {ledgerData.student.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-white truncate">{ledgerData.student.name}</h2>
                  <p className="text-sm text-indigo-100">
                    {ledgerData.student.class} - {ledgerData.student.section} &nbsp;•&nbsp; Adm. No: {ledgerData.student.admissionNo}
                  </p>
                </div>
              </div>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6">
              {[
                { icon: User, label: "Student Name", value: ledgerData.student.name },
                { icon: Hash, label: "Admission No", value: ledgerData.student.admissionNo },
                { icon: GraduationCap, label: "Class", value: `${ledgerData.student.class} - ${ledgerData.student.section}` },
                { icon: UsersIcon, label: "Father's Name", value: ledgerData.student.fatherName },
                { icon: CalendarDays, label: "Session", value: ledgerData.student.session },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon size={15} className="text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">{item.label}</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 truncate">{item.value || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ Summary Cards ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/10 rounded-full -mr-8 -mt-8"></div>
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mb-3">
                <Wallet size={18} className="text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Fee</p>
              <p className="text-xl font-bold text-violet-700 dark:text-violet-300 mt-1">{formatCurrency(ledgerData.summary.totalFee)}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-8 -mt-8"></div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-3">
                <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Paid</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{formatCurrency(ledgerData.summary.totalPaid)}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full -mr-8 -mt-8"></div>
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-3">
                <BadgePercent size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Discount</p>
              <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">{formatCurrency(ledgerData.summary.totalDiscount)}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full -mr-8 -mt-8"></div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center mb-3">
                <AlertCircle size={18} className="text-rose-600 dark:text-rose-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Balance</p>
              <p className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-1">{formatCurrency(ledgerData.summary.balance)}</p>
            </div>
          </div>

          {/* ═══ Ledger Table ═══ */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
              <Receipt size={16} className="text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Transaction History</h3>
              <span className="ml-auto px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold">
                {ledgerData.entries.length} entr{ledgerData.entries.length !== 1 ? "ies" : "y"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">#</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Particulars</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Receipt No.</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Debit (₹)</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Credit (₹)</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.entries.map((entry, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-slate-100 dark:border-slate-700/50 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 ${entry.credit > 0 ? "bg-emerald-50/40 dark:bg-emerald-900/10" : ""}`}
                    >
                      <td className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDate(entry.date)}</td>
                      <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-200 max-w-xs truncate">{entry.particulars}</td>
                      <td className="px-4 py-3 text-sm">
                        {entry.receiptNo !== "-"
                          ? <span className="font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400">{entry.receiptNo}</span>
                          : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-rose-600 dark:text-rose-400 font-medium whitespace-nowrap">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                        {formatCurrency(entry.balance)}
                      </td>
                    </tr>
                  ))}

                  {ledgerData.entries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">No transactions found</td>
                    </tr>
                  )}
                </tbody>
                {ledgerData.entries.length > 0 && (
                  <tfoot className="bg-slate-50 dark:bg-slate-900/60 border-t-2 border-slate-300 dark:border-slate-600">
                    <tr>
                      <td colSpan={4} className="px-4 py-3.5 text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">Closing Balance</td>
                      <td className="px-4 py-3.5 text-sm text-right font-bold text-rose-700 dark:text-rose-400 whitespace-nowrap">
                        {formatCurrency(ledgerData.entries.reduce((s, e) => s + e.debit, 0))}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-right font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        {formatCurrency(ledgerData.entries.reduce((s, e) => s + e.credit, 0))}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(ledgerData.summary.balance)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Principal Signature — visible only on print */}
      {ledgerData && <PrintSignature />}

      {/* ═══ Empty state ═══ */}
      {!ledgerData && !loading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-14 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 flex items-center justify-center mx-auto mb-5">
            <Search size={34} className="text-indigo-400 dark:text-indigo-500" />
          </div>
          <p className="text-slate-700 dark:text-slate-200 text-lg font-semibold">Search a student to view their fee ledger</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1.5">Enter student name or admission number in the search bar above</p>
        </div>
      )}
    </div>
  );
};

export default StudentLedgerPage;
