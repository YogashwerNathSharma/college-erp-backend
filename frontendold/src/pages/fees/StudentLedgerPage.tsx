
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "/api";

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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Fee Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">Complete fee transaction history of a student</p>
        </div>
        {ledgerData && (
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Ledger
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6 relative">
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Student Name or Admission No..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          {searching && (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Search Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {searchResults.map((s) => (
              <button
                key={s.enrollmentId}
                onClick={() => loadLedger(s.enrollmentId)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">Father: {s.fatherName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-blue-600">{s.admissionNo}</p>
                    <p className="text-xs text-gray-500">{s.className} - {s.sectionName}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">Loading ledger...</span>
        </div>
      )}

      {ledgerData && (
        <>
          {/* Student Info Card */}
          <div className="bg-white rounded-lg shadow-sm border p-5 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Student Name</p>
                <p className="font-semibold text-gray-900 mt-0.5">{ledgerData.student.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Admission No</p>
                <p className="font-semibold text-gray-900 mt-0.5">{ledgerData.student.admissionNo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Class</p>
                <p className="font-semibold text-gray-900 mt-0.5">{ledgerData.student.class} - {ledgerData.student.section}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Father's Name</p>
                <p className="font-semibold text-gray-900 mt-0.5">{ledgerData.student.fatherName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Session</p>
                <p className="font-semibold text-gray-900 mt-0.5">{ledgerData.student.session}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-gray-500">Total Fee</p>
                <p className="font-bold text-purple-700 mt-1">{formatCurrency(ledgerData.summary.totalFee)}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-500">Total Paid</p>
                <p className="font-bold text-green-700 mt-1">{formatCurrency(ledgerData.summary.totalPaid)}</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-500">Discount</p>
                <p className="font-bold text-blue-700 mt-1">{formatCurrency(ledgerData.summary.totalDiscount)}</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-gray-500">Balance</p>
                <p className="font-bold text-red-700 mt-1">{formatCurrency(ledgerData.summary.balance)}</p>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">Transaction History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Particulars</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt No.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit (₹)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit (₹)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ledgerData.entries.map((entry, idx) => (
                    <tr key={idx} className={`hover:bg-gray-50 ${entry.credit > 0 ? "bg-green-50/30" : ""}`}>
                      <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(entry.date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{entry.particulars}</td>
                      <td className="px-4 py-3 text-sm font-mono text-blue-600">
                        {entry.receiptNo !== "-" ? entry.receiptNo : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(entry.balance)}
                      </td>
                    </tr>
                  ))}

                  {ledgerData.entries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No transactions found</td>
                    </tr>
                  )}
                </tbody>
                {ledgerData.entries.length > 0 && (
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-900">CLOSING BALANCE</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-red-700">
                        {formatCurrency(ledgerData.entries.reduce((s, e) => s + e.debit, 0))}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-700">
                        {formatCurrency(ledgerData.entries.reduce((s, e) => s + e.credit, 0))}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                        {formatCurrency(ledgerData.summary.balance)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!ledgerData && !loading && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-500 text-lg">Search a student to view their fee ledger</p>
          <p className="text-gray-400 text-sm mt-1">Enter student name or admission number in the search bar above</p>
        </div>
      )}
    </div>
  );
};

export default StudentLedgerPage;

