
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUsers, FiUserPlus, FiTrendingUp, FiCalendar, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

// ─── Type Definitions ────────────────────────────────────────────────────────

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

// ─── Skeleton Components ─────────────────────────────────────────────────────

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

// ─── Main Dashboard Component ────────────────────────────────────────────────

const AdminStudentDashboard: React.FC = () => {
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string; isCurrent: boolean }[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [classStrength, setClassStrength] = useState<ClassStrength[]>([]);
  const [recentAdmissions, setRecentAdmissions] = useState<RecentAdmission[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
const [feePending] = useState<FeePendingStudent[]>([]);
const [attendance] = useState<AttendanceOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch academic years from database
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const res = await axios.get('/api/academic');
        const years = res.data.data || res.data || [];
        setAcademicYears(years);
        // Auto-select current academic year
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
        axios.get('/api/students/stats', { params: { academicYearId } }),          // 0
        axios.get('/api/students/class-strength', { params: { academicYearId } }), // 1
        axios.get('/api/students/recent-admissions', { params: { limit: 5 } }),    // 2
        axios.get('/api/students/category-distribution', { params: { academicYearId } }), // 3
      ]);

      // Stats
      if (results[0].status === 'fulfilled') {
        const statsData = results[0].value.data?.data || results[0].value.data;
        setStats({
          totalStudents: statsData?.total || 0,
          newAdmissions: statsData?.active || 0,
          boys: 0,
          girls: 0,
          active: statsData?.active || 0,
          inactive: statsData?.inactive || 0,
        });
      }

      // Class Strength
      if (results[1].status === 'fulfilled') {
        setClassStrength(results[1].value.data?.data || []);
      }

      // Recent Admissions
      if (results[2].status === 'fulfilled') {
        setRecentAdmissions(results[2].value.data?.data || []);
      }

      // Category Distribution
      if (results[3].status === 'fulfilled') {
        setCategoryDistribution(results[3].value.data?.data || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxClassCount = Math.max(...classStrength.map((c) => c.count), 1);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Student Dashboard
              </h1>
              <p className="text-blue-100 text-sm mt-1">
                Comprehensive student analytics &amp; management overview
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-blue-100 text-sm font-medium">Academic Year:</label>
              <select
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                className="bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 appearance-none cursor-pointer hover:bg-white/20 transition-colors"
              >
                <option value="">Select Year</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id} className="text-gray-800">
                    {year.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Dashboard Content ──────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ─── Stats Cards Row ────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Students */}
            <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <FiUsers className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Students</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats?.totalStudents ?? '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* New Admissions */}
            <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <FiUserPlus className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">New Admissions</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats?.newAdmissions ?? '—'}
                  </p>
                  <p className="text-xs text-gray-400">This month</p>
                </div>
              </div>
            </div>

            {/* Boys / Girls Ratio */}
            <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <FiTrendingUp className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Boys / Girls</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats ? `${stats.boys} : ${stats.girls}` : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Active / Inactive */}
            <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                  <FiCheckCircle className="w-7 h-7 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Active / Inactive</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats ? `${stats.active} / ${stats.inactive}` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Row 2: Charts ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Class-wise Student Strength (Bar Chart) */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">
                Class-wise Student Strength
              </h3>
              <div className="flex items-end gap-2 h-48">
                {classStrength.map((cls) => (
                  <div
                    key={cls.class}
                    className="flex-1 flex flex-col items-center justify-end h-full group"
                  >
                    <span className="text-xs font-medium text-gray-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {cls.count}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-300 group-hover:from-blue-700 group-hover:to-blue-500 relative min-h-[4px]"
                      style={{
                        height: `${(cls.count / maxClassCount) * 100}%`,
                      }}
                    >
                      <div className="absolute inset-0 bg-white/10 rounded-t-md" />
                    </div>
                    <span className="text-xs text-gray-500 mt-2 font-medium">
                      {cls.class}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                  Classes 1–12 • Hover bars for count
                </p>
              </div>
            </div>

            {/* Gender Distribution (Donut Chart — CSS only) */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">
                Gender Distribution
              </h3>
              <div className="flex items-center justify-center gap-8">
                {/* CSS Donut */}
                <div className="relative w-44 h-44">
                  {stats && (
                    <>
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        {/* Background ring */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9155"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="3"
                        />
                        {/* Boys segment */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9155"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          strokeDasharray={`${
                            (stats.boys / (stats.boys + stats.girls)) * 100
                          } ${100 - (stats.boys / (stats.boys + stats.girls)) * 100}`}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          className="transition-all duration-700"
                        />
                        {/* Girls segment */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9155"
                          fill="none"
                          stroke="#ec4899"
                          strokeWidth="3"
                          strokeDasharray={`${
                            (stats.girls / (stats.boys + stats.girls)) * 100
                          } ${100 - (stats.girls / (stats.boys + stats.girls)) * 100}`}
                          strokeDashoffset={`${
                            -(stats.boys / (stats.boys + stats.girls)) * 100
                          }`}
                          strokeLinecap="round"
                          className="transition-all duration-700"
                        />
                      </svg>
                      {/* Center text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-gray-800">
                          {stats.boys + stats.girls}
                        </span>
                        <span className="text-xs text-gray-400">Total</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Legend */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Boys</p>
                      <p className="text-lg font-bold text-gray-800">
                        {stats?.boys ?? '—'}
                        <span className="text-sm font-normal text-gray-400 ml-1">
                          ({stats ? ((stats.boys / (stats.boys + stats.girls)) * 100).toFixed(1) : 0}%)
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-pink-500 rounded-full shadow-sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Girls</p>
                      <p className="text-lg font-bold text-gray-800">
                        {stats?.girls ?? '—'}
                        <span className="text-sm font-normal text-gray-400 ml-1">
                          ({stats ? ((stats.girls / (stats.boys + stats.girls)) * 100).toFixed(1) : 0}%)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Row 3: Recent Admissions & Category Distribution ────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonTable />
            <SkeletonTable />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Admissions Table */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-800">Recent Admissions</h3>
                <span className="text-xs bg-blue-50 text-blue-600 font-medium px-3 py-1 rounded-full">
                  Last 5
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs uppercase tracking-wider">
                        Name
                      </th>
                      <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs uppercase tracking-wider">
                        Adm No
                      </th>
                      <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs uppercase tracking-wider">
                        Class
                      </th>
                      <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAdmissions.length > 0 ? (
                      recentAdmissions.map((student) => (
                        <tr
                          key={student.id}
                          className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="py-3 px-2 font-medium text-gray-700">
                            {student.name}
                          </td>
                          <td className="py-3 px-2 text-gray-500 font-mono text-xs">
                            {student.admNo}
                          </td>
                          <td className="py-3 px-2">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
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
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-5">
                Category-wise Distribution
              </h3>
              <div className="space-y-4">
                {categoryDistribution.map((cat) => {
                  const colors: Record<string, string> = {
                    General: 'bg-blue-500',
                    OBC: 'bg-green-500',
                    SC: 'bg-purple-500',
                    ST: 'bg-orange-500',
                    EWS: 'bg-teal-500',
                  };
                  const bgColor = colors[cat.category] || 'bg-gray-500';

                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700">
                          {cat.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{cat.count} students</span>
                          <span className="text-sm font-semibold text-gray-800">
                            {cat.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${bgColor} rounded-full transition-all duration-700`}
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {categoryDistribution.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No data available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Row 4: Fee Pending & Attendance Overview ───────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonTable />
            <SkeletonTable />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fee Pending Students */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-800">Fee Pending Students</h3>
                <span className="text-xs bg-red-50 text-red-600 font-medium px-3 py-1 rounded-full">
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
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-xs font-bold text-red-600 group-hover:bg-red-200 transition-colors">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">{student.name}</p>
                          <p className="text-xs text-gray-400">Class {student.class}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-600">
                          ₹{student.pendingAmount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-gray-400">Pending</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-8">No pending fees</p>
                )}
              </div>
            </div>

            {/* Attendance Overview */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-800">Attendance Overview</h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <FiCalendar className="w-3.5 h-3.5" />
                  <span>Today</span>
                </div>
              </div>

              {attendance ? (
                <div className="space-y-6">
                  {/* Circular Progress */}
                  <div className="flex items-center justify-center">
                    <div className="relative w-36 h-36">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9155"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="2.5"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9155"
                          fill="none"
                          stroke={
                            attendance.presentPercentage >= 90
                              ? '#10b981'
                              : attendance.presentPercentage >= 75
                              ? '#f59e0b'
                              : '#ef4444'
                          }
                          strokeWidth="2.5"
                          strokeDasharray={`${attendance.presentPercentage} ${
                            100 - attendance.presentPercentage
                          }`}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-gray-800">
                          {attendance.presentPercentage}%
                        </span>
                        <span className="text-xs text-gray-400">Present</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <FiCheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-green-700">
                        {attendance.totalPresent}
                      </p>
                      <p className="text-xs text-green-600">Present</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <FiAlertCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-red-700">
                        {attendance.absentCount}
                      </p>
                      <p className="text-xs text-red-600">Absent</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <FiUsers className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-blue-700">
                        {attendance.totalStudents}
                      </p>
                      <p className="text-xs text-blue-600">Total</p>
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

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-400 text-center">
            School ERP • Student Module • Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AdminStudentDashboard;
