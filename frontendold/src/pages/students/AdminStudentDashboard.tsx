
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUsers, FiUserPlus, FiTrendingUp, FiCalendar, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import DashboardDetailModal from '../../components/dashboard/DashboardDetailModal';

// ──── Type Definitions ──────────────────────────────────────────────────────

interface StatsData {
  totalStudents: number;
  newAdmissions: number;
  boys: number;
  girls: number;
  active: number;
  inactive: number;
}

interface ClassStrength {
  class: string;
  count: number;
}

interface RecentAdmission {
  id: string;
  name: string;
  admNo: string;
  class: string;
  date: string;
}

interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

interface FeePendingStudent {
  id: string;
  name: string;
  class: string;
  pendingAmount: number;
}

interface AttendanceOverview {
  presentPercentage: number;
  absentCount: number;
  totalPresent: number;
  totalStudents: number;
}

// ──── Skeleton Components ──────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div className="animate-pulse bg-white rounded-xl shadow-md p-6">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 bg-gray-200 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-7 bg-gray-200 rounded w-16" />
      </div>
    </div>
  </div>
);

const SkeletonChart: React.FC = () => (
  <div className="animate-pulse bg-white rounded-xl shadow-md p-6 h-72">
    <div className="h-5 bg-gray-200 rounded w-48 mb-6" />
    <div className="flex items-end gap-2 h-44">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-gray-200 rounded-t"
          style={{ height: `${Math.random() * 80 + 20}%` }}
        />
      ))}
    </div>
  </div>
);

const SkeletonTable: React.FC = () => (
  <div className="animate-pulse bg-white rounded-xl shadow-md p-6">
    <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 rounded" />
      ))}
    </div>
  </div>
);

// ──── Main Dashboard Component ──────────────────────────────────────────────

const AdminStudentDashboard: React.FC = () => {
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string; isCurrent: boolean }[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [classStrength, setClassStrength] = useState<ClassStrength[]>([]);
  const [recentAdmissions, setRecentAdmissions] = useState<RecentAdmission[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  const [feePending, setFeePending] = useState<FeePendingStudent[]>([]);
  const [attendance, setAttendance] = useState<AttendanceOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal state for detail view
  const [detailModal, setDetailModal] = useState<{ open: boolean; type: "students" | "classes" | "fees_collected" | "fees_pending" | "receipts" | "recent_payments" }>({ 
    open: false, 
    type: "students" 
  });

  // Fetch academic years from database
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const res = await axios.get('/api/academic');
        const years = res.data.data || res.data || [];
        setAcademicYears(years);
        const current = years.find((y: any) => y.isCurrent);
        if (current) {
          setAcademicYearId(current.id);
        } else if (years.length > 0) {
          setAcademicYearId(years[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch academic years:', err);
      }
    };
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (academicYearId) fetchDashboardData();
  }, [academicYearId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        axios.get('/api/students/stats', { params: { academicYearId } }),
        axios.get('/api/students/class-strength', { params: { academicYearId } }),
        axios.get('/api/students/recent-admissions', { params: { limit: 5 } }),
        axios.get('/api/students/category-distribution', { params: { academicYearId } }),
        axios.get('/api/students/fee-pending', { params: { academicYearId } }),
        axios.get('/api/students/attendance-overview', { params: { academicYearId } }),
      ]);

      if (results[0].status === 'fulfilled') {
        const statsData = results[0].value.data?.data || results[0].value.data;
        setStats({
          totalStudents: statsData?.total || 0,
          newAdmissions: statsData?.newAdmissions || 0,
          boys: statsData?.boys || 0,
          girls: statsData?.girls || 0,
          active: statsData?.active || 0,
          inactive: statsData?.inactive || 0,
        });
      }

      if (results[1].status === 'fulfilled') {
        setClassStrength(results[1].value.data?.data || []);
      }

      if (results[2].status === 'fulfilled') {
        setRecentAdmissions(results[2].value.data?.data || []);
      }

      if (results[3].status === 'fulfilled') {
        setCategoryDistribution(results[3].value.data?.data || []);
      }

      if (results[4].status === 'fulfilled') {
        setFeePending(results[4].value.data?.data || []);
      }

      if (results[5].status === 'fulfilled') {
        setAttendance(results[5].value.data?.data || null);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxClassCount = Math.max(...classStrength.map((c) => c.count), 1);

  // ──── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ──── Dashboard Content ──────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 overflow-x-hidden">
        
        {/* ──── Stats Cards Row (5 COLORFUL CARDS) ──────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-5">
            {/* Academic Year */}
            <div className="rounded-xl shadow-lg p-4 sm:p-6 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" style={{ background: 'linear-gradient(135deg, #0F766E, #14B8A6)' }}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <FiCalendar className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium" style={{ color: '#A7F3D0' }}>Academic Year</p>
                  <select
                    value={academicYearId}
                    onChange={(e) => setAcademicYearId(e.target.value)}
                    className="text-sm sm:text-lg font-bold bg-transparent border-none outline-none text-white cursor-pointer appearance-none w-full truncate"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    <option value="" className="text-gray-800">Select</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id} className="text-gray-800">
                        {year.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Total Students - CLICKABLE */}
            <div 
              onClick={() => setDetailModal({ open: true, type: "students" })}
              className="cursor-pointer rounded-xl shadow-lg p-4 sm:p-6 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" 
              style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <FiUsers className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: '#BFDBFE' }}>Total Students</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {stats?.totalStudents ?? '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* New Admissions - CLICKABLE */}
            <div 
              onClick={() => setDetailModal({ open: true, type: "students" })}
              className="cursor-pointer rounded-xl shadow-lg p-4 sm:p-6 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" 
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <FiUserPlus className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: '#A7F3D0' }}>New Admissions</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {stats?.newAdmissions ?? '—'}
                  </p>
                  <p className="text-xs hidden sm:block" style={{ color: '#6EE7B7' }}>This month</p>
                </div>
              </div>
            </div>

            {/* Boys / Girls Ratio - CLICKABLE */}
            <div 
              onClick={() => setDetailModal({ open: true, type: "students" })}
              className="cursor-pointer rounded-xl shadow-lg p-4 sm:p-6 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" 
              style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <FiTrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: '#E9D5FF' }}>Boys / Girls</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {stats ? `${stats.boys} : ${stats.girls}` : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Active / Inactive - CLICKABLE */}
            <div 
              onClick={() => setDetailModal({ open: true, type: "students" })}
              className="cursor-pointer rounded-xl shadow-lg p-4 sm:p-6 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" 
              style={{ background: 'linear-gradient(135deg, #EA580C, #F97316)' }}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <FiCheckCircle className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: '#FED7AA' }}>Active / Inactive</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {stats ? `${stats.active} / ${stats.inactive}` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──── Row 2: Charts (WHITE cards with data viz) ──────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Class-wise Student Strength (Bar Chart) */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100 overflow-hidden">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6">
                Class-wise Student Strength
              </h3>
              {classStrength.length > 0 ? (
                <div className="overflow-x-auto -mx-2 px-2">
                <div className="flex items-end gap-1.5 sm:gap-2 h-48 min-w-[280px]">
                  {classStrength.map((cls) => (
                    <div
                      key={cls.class}
                      className="flex-1 min-w-[24px] flex flex-col items-center justify-end h-full group"
                    >
                      <span className="text-[10px] sm:text-xs font-medium text-gray-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {cls.count}
                      </span>
                      <div
                        className="w-full rounded-t-md transition-all duration-300 relative min-h-[4px]"
                        style={{
                          height: `${(cls.count / maxClassCount) * 100}%`,
                          background: 'linear-gradient(to top, #3B82F6, #60A5FA)',
                        }}
                      />
                      <span className="text-[9px] sm:text-xs text-gray-500 mt-1.5 sm:mt-2 font-medium truncate max-w-full">
                        {cls.class}
                      </span>
                    </div>
                  ))}
                </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400">
                  <p>No data</p>
                </div>
              )}
              <div className="mt-3 sm:mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                  Hover bars for count
                </p>
              </div>
            </div>

            {/* Gender Distribution (Donut Chart) */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100 overflow-hidden">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6">
                Gender Distribution
              </h3>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                {/* Donut */}
                <div className="relative w-32 h-32 sm:w-44 sm:h-44">
                  {stats && (stats.boys + stats.girls) > 0 ? (
                    <>
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15.9155" fill="none" stroke="#3b82f6" strokeWidth="3"
                          strokeDasharray={`${(stats.boys / (stats.boys + stats.girls)) * 100} ${100 - (stats.boys / (stats.boys + stats.girls)) * 100}`}
                          strokeDashoffset="0" strokeLinecap="round" className="transition-all duration-700"
                        />
                        <circle
                          cx="18" cy="18" r="15.9155" fill="none" stroke="#ec4899" strokeWidth="3"
                          strokeDasharray={`${(stats.girls / (stats.boys + stats.girls)) * 100} ${100 - (stats.girls / (stats.boys + stats.girls)) * 100}`}
                          strokeDashoffset={`${-(stats.boys / (stats.boys + stats.girls)) * 100}`}
                          strokeLinecap="round" className="transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl sm:text-2xl font-bold text-gray-800">{stats.boys + stats.girls}</span>
                        <span className="text-xs text-gray-400">Total</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm text-gray-400">No data</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="flex sm:flex-col gap-6 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-700">Boys</p>
                      <p className="text-base sm:text-lg font-bold text-gray-800">{stats?.boys ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: '#ec4899' }} />
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-700">Girls</p>
                      <p className="text-base sm:text-lg font-bold text-gray-800">{stats?.girls ?? '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──── Row 3: Category + Recent Admissions ───────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonTable />
            <SkeletonTable />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Recent Admissions Table */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Recent Admissions</h3>
                <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                  Last 5
                </span>
              </div>
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table className="w-full text-sm min-w-[400px] sm:min-w-0">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs uppercase tracking-wider">Name</th>
                      <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs uppercase tracking-wider">Adm No</th>
                      <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs uppercase tracking-wider">Class</th>
                      <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAdmissions.length > 0 ? (
                      recentAdmissions.map((student) => (
                        <tr key={student.id} className="border-b border-gray-50 hover:bg-primary-50/50 transition-colors">
                          <td className="py-3 px-2 font-medium text-gray-700">{student.name}</td>
                          <td className="py-3 px-2 text-gray-500 font-mono text-xs">{student.admNo}</td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                              {student.class}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-gray-500">{student.date}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400">
                          No recent admissions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category-wise Distribution */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-5">
                Category-wise Distribution
              </h3>
              <div className="space-y-4">
                {categoryDistribution.length > 0 ? (
                  categoryDistribution.map((cat) => {
                    const colorMap: Record<string, string> = {
                      General: '#3B82F6',
                      OBC: '#10B981',
                      SC: '#8B5CF6',
                      ST: '#F97316',
                      EWS: '#14B8A6',
                    };
                    const barColor = colorMap[cat.category] || '#6B7280';

                    return (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{cat.count} students</span>
                            <span className="text-sm font-semibold text-gray-800">{cat.percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${cat.percentage}%`, backgroundColor: barColor }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-400 py-8">No data available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ──── Row 4: Fee Pending & Attendance Overview ─────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonTable />
            <SkeletonTable />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Fee Pending Students */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Fee Pending Students</h3>
                <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                  Top 5
                </span>
              </div>
              <div className="space-y-3">
                {feePending.length > 0 ? (
                  feePending.map((student, index) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-red-50/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{student.name}</p>
                          <p className="text-xs text-gray-400">Class {student.class}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm font-bold" style={{ color: '#DC2626' }}>
                          ₹{student.pendingAmount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-gray-400">Pending</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-8">No pending fees 🎉</p>
                )}
              </div>
            </div>

            {/* Attendance Overview */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Attendance Overview</h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <FiCalendar className="w-3.5 h-3.5" />
                  <span>Today</span>
                </div>
              </div>

              {attendance ? (
                <div className="space-y-6">
                  {/* Circular Progress */}
                  <div className="flex items-center justify-center">
                    <div className="relative w-28 h-28 sm:w-36 sm:h-36">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
                        <circle
                          cx="18" cy="18" r="15.9155" fill="none"
                          stroke={attendance.presentPercentage >= 90 ? '#10b981' : attendance.presentPercentage >= 75 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="2.5"
                          strokeDasharray={`${attendance.presentPercentage} ${100 - attendance.presentPercentage}`}
                          strokeDashoffset="0" strokeLinecap="round" className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl sm:text-3xl font-bold text-gray-800">{attendance.presentPercentage}%</span>
                        <span className="text-xs text-gray-400">Present</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="text-center p-2 sm:p-3 rounded-lg" style={{ backgroundColor: '#ECFDF5' }}>
                      <FiCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" style={{ color: '#059669' }} />
                      <p className="text-base sm:text-lg font-bold" style={{ color: '#065F46' }}>{attendance.totalPresent}</p>
                      <p className="text-[10px] sm:text-xs" style={{ color: '#059669' }}>Present</p>
                    </div>
                    <div className="text-center p-2 sm:p-3 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
                      <FiAlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" style={{ color: '#DC2626' }} />
                      <p className="text-base sm:text-lg font-bold" style={{ color: '#991B1B' }}>{attendance.absentCount}</p>
                      <p className="text-[10px] sm:text-xs" style={{ color: '#DC2626' }}>Absent</p>
                    </div>
                    <div className="text-center p-2 sm:p-3 rounded-lg" style={{ backgroundColor: '#EFF6FF' }}>
                      <FiUsers className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" style={{ color: '#2563EB' }} />
                      <p className="text-base sm:text-lg font-bold" style={{ color: '#1E40AF' }}>{attendance.totalStudents}</p>
                      <p className="text-[10px] sm:text-xs" style={{ color: '#2563EB' }}>Total</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">No attendance data available</p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ──── Footer ─────────────────────────────────────────────────── */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-400 text-center">
            School ERP • Student Module • Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </footer>

      {/* ──── Dashboard Detail Modal ────────────────────────────────── */}
      <DashboardDetailModal 
        isOpen={detailModal.open} 
        type={detailModal.type} 
        onClose={() => setDetailModal({ ...detailModal, open: false })} 
      />
    </div>
  );
};

export default AdminStudentDashboard;
