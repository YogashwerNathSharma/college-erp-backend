
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";
import axios from "axios";
import toast from "react-hot-toast";

const API = `${API_BASE_URL}/api`;

interface DashboardData {
  summary: {
    totalStudents: number;
    totalReceivable: number;
    totalCollected: number;
    outstanding: number;
  };
  monthlyCollection: { month: string; receivable: number; collected: number }[];
  classwiseOutstanding: { className: string; outstanding: number }[];
  recentCollections: {
    receiptNo: string;
    date: string;
    studentName: string;
    className: string;
    amount: number;
    collectedBy: string;
    method: string;
  }[];
}

const FeeDashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string }[]>([]);
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [selectedYear]);

  const fetchAcademicYears = async () => {
    try {
      const res = await axios.get(`${API}/academic`);
      if (res.data.success) setAcademicYears(res.data.data);
    } catch (error) {
      console.error("Failed to fetch academic years");
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedYear) params.academicYearId = selectedYear;
      const res = await axios.get(`${API}/fees/dashboard`, { params });
      if (res.data.success) setData(res.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load dashboard");
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-500">Loading dashboard...</span>
      </div>
    );
  }

  const maxMonthlyCollection = data ? Math.max(...data.monthlyCollection.map((m) => Math.max(m.receivable, m.collected)), 1) : 1;
  const maxClassOutstanding = data ? Math.max(...data.classwiseOutstanding.map((c) => c.outstanding), 1) : 1;

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Fee Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of fee collection and outstanding</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Current Session</option>
          {academicYears.map((y) => (
            <option key={y.id} value={y.id}>{y.name}</option>
          ))}
        </select>
      </div>

      {data && (
        <>
          {/* Summary Cards — COLORFUL */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {/* Total Students */}
            <div
              className="rounded-xl shadow-lg p-3 sm:p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-medium" style={{ color: '#BFDBFE' }}>Total Students</p>
                  <p className="text-lg sm:text-2xl font-bold text-white mt-1 truncate">{data.summary.totalStudents.toLocaleString("en-IN")}</p>
                </div>
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Receivable */}
            <div
              className="rounded-xl shadow-lg p-3 sm:p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-medium" style={{ color: '#E9D5FF' }}>Total Receivable</p>
                  <p className="text-lg sm:text-2xl font-bold text-white mt-1 truncate">{formatCurrency(data.summary.totalReceivable)}</p>
                </div>
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Collected */}
            <div
              className="rounded-xl shadow-lg p-3 sm:p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-medium" style={{ color: '#A7F3D0' }}>Total Collected</p>
                  <p className="text-lg sm:text-2xl font-bold text-white mt-1 truncate">{formatCurrency(data.summary.totalCollected)}</p>
                </div>
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Outstanding */}
            <div
              className="rounded-xl shadow-lg p-3 sm:p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #DC2626, #EF4444)' }}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-medium" style={{ color: '#FECACA' }}>Outstanding</p>
                  <p className="text-lg sm:text-2xl font-bold text-white mt-1 truncate">{formatCurrency(data.summary.outstanding)}</p>
                </div>
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section (WHITE cards) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            {/* Collection Overview - Bar Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 overflow-hidden">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Collection Overview</h3>
              <div className="overflow-x-auto">
              <div className="flex items-end gap-1.5 h-48 min-w-[300px]">
                {data.monthlyCollection.map((m) => (
                  <div key={m.month} className="flex-1 min-w-[24px] flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 items-end h-36">
                      {/* Receivable bar */}
                      <div
                        className="flex-1 rounded-t-sm min-h-[4px]"
                        style={{ height: `${(m.receivable / maxMonthlyCollection) * 100}%`, backgroundColor: '#C4B5FD' }}
                        title={`Receivable: ${formatCurrency(m.receivable)}`}
                      />
                      {/* Collected bar */}
                      <div
                        className="flex-1 rounded-t-sm min-h-[4px]"
                        style={{ height: `${(m.collected / maxMonthlyCollection) * 100}%`, backgroundColor: '#22c55e' }}
                        title={`Collected: ${formatCurrency(m.collected)}`}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">{m.month}</span>
                  </div>
                ))}
              </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#C4B5FD' }}></span> Receivable</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#22c55e' }}></span> Collected</span>
              </div>
            </div>

            {/* Outstanding By Class */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Outstanding By Class</h3>
              {/* Donut Circle */}
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="3"
                      strokeDasharray={`${data.summary.totalReceivable > 0 ? (data.summary.outstanding / data.summary.totalReceivable) * 100 : 0}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-gray-500">Total</p>
                      <p className="text-xs sm:text-sm font-bold" style={{ color: '#DC2626' }}>{formatCurrency(data.summary.outstanding)}</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Class list */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {data.classwiseOutstanding.slice(0, 8).map((cls) => (
                  <div key={cls.className} className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-700 truncate max-w-[80px] sm:max-w-none">{cls.className}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 sm:w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(cls.outstanding / maxClassOutstanding) * 100}%`, backgroundColor: '#f87171' }}
                        />
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-gray-900 w-14 sm:w-16 text-right">
                        {formatCurrency(cls.outstanding)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Collections Table (WHITE) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Recent Collections</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt No</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Class</th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Paid By</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.recentCollections.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No recent collections</td>
                    </tr>
                  ) : (
                    data.recentCollections.map((item) => (
                      <tr key={item.receiptNo} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-mono" style={{ color: '#2563EB' }}>{item.receiptNo}</td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">{formatDate(item.date)}</td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-900">{item.studentName}</td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">{item.className}</td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-right font-semibold text-gray-900">{formatCurrency(item.amount)}</td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 hidden md:table-cell">{item.collectedBy}</td>
                        <td className="px-3 sm:px-4 py-3 hidden md:table-cell">
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                            {item.method}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FeeDashboardPage;
