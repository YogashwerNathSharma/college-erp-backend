
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import PrintSignature from "../../components/PrintSignature";

const API = import.meta.env.VITE_API_URL || "/api";

interface ClassReport {
  className: string;
  classId: string;
  receivable: number;
  collected: number;
  outstanding: number;
}

interface ReportData {
  summary: { totalReceivable: number; totalCollected: number; outstanding: number };
  classwise: ClassReport[];
}

const FeeReportsPage: React.FC = () => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string }[]>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedYear]);

  const fetchAcademicYears = async () => {
    try {
      const res = await axios.get(`${API}/academic`);
      if (res.data.success) setAcademicYears(res.data.data);
    } catch (error) {
      console.error("Failed to fetch academic years");
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedYear) params.academicYearId = selectedYear;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const res = await axios.get(`${API}/fees/reports`, { params });
      if (res.data.success) setData(res.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);
  };

  const exportCSV = () => {
    if (!data) return;
    const headers = ["Class", "Receivable (₹)", "Collected (₹)", "Outstanding (₹)"];
    const rows = data.classwise.map((c) => [c.className, c.receivable, c.collected, c.outstanding]);
    rows.push(["TOTAL", data.summary.totalReceivable, data.summary.totalCollected, data.summary.outstanding]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fee-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Report exported!");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fee Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Class-wise fee collection reports</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Sessions</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={fetchReports}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? "Loading..." : "Filter"}
          </button>
          <button
            onClick={exportCSV}
            disabled={!data}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium flex items-center gap-1 justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
              <p className="text-sm text-gray-500">Total Receivable</p>
              <p className="text-xl font-bold text-purple-700 mt-1">{formatCurrency(data.summary.totalReceivable)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
              <p className="text-sm text-gray-500">Total Collected</p>
              <p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(data.summary.totalCollected)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
              <p className="text-sm text-gray-500">Outstanding</p>
              <p className="text-xl font-bold text-red-700 mt-1">{formatCurrency(data.summary.outstanding)}</p>
            </div>
          </div>

          {/* Class-wise Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Receivable (₹)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Collected (₹)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding (₹)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Collection %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.classwise.map((cls, idx) => (
                    <tr key={cls.classId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{cls.className}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(cls.receivable)}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">{formatCurrency(cls.collected)}</td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">{formatCurrency(cls.outstanding)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${cls.receivable > 0 ? (cls.collected / cls.receivable) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8">
                            {cls.receivable > 0 ? Math.round((cls.collected / cls.receivable) * 100) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900" colSpan={2}>TOTAL</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{formatCurrency(data.summary.totalReceivable)}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-green-700">{formatCurrency(data.summary.totalCollected)}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-red-700">{formatCurrency(data.summary.outstanding)}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-700">
                      {data.summary.totalReceivable > 0
                        ? Math.round((data.summary.totalCollected / data.summary.totalReceivable) * 100)
                        : 0}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Principal Signature - visible only on print */}
      <PrintSignature />

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-500">Loading reports...</span>
        </div>
      )}
    </div>
  );
};

export default FeeReportsPage;

