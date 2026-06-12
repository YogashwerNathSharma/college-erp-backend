

import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  attendancePercentage: string;
  monthlyTrend: { date: string; present: number; absent: number }[];
}

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

const AttendanceDashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedAcademicYear) {
      fetchDashboard();
    }
  }, [selectedAcademicYear]);

  const fetchAcademicYears = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/academic`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const years = res.data.data || [];
      setAcademicYears(years);
      const current = years.find((y: AcademicYear) => y.isCurrent);
      if (current) setSelectedAcademicYear(current.id);
    } catch (err) {
      console.error("Error fetching academic years:", err);
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/attendance/dashboard`, {
        params: { academicYearId: selectedAcademicYear },
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const percentage = stats ? parseFloat(stats.attendancePercentage) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📋 Attendance Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of today's attendance</p>
        </div>
        <select
          value={selectedAcademicYear}
          onChange={(e) => setSelectedAcademicYear(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Year</option>
          {academicYears.map((ay) => (
            <option key={ay.id} value={ay.id}>
              {ay.name} {ay.isCurrent ? "(Current)" : ""}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading dashboard...</div>
      ) : stats ? (
        <>
          {/* Stats Cards — like image #1 top row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Total Students */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Total Students</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalStudents}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </div>

            {/* Present Today */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Present Today</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{stats.presentToday}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>

            {/* Absent Today */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Absent Today</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{stats.absentToday}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">❌</span>
                </div>
              </div>
            </div>

            {/* Attendance % */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Attendance %</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{stats.attendancePercentage}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid — Donut Chart + Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Attendance Donut — like image #1 */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Today's Attendance</h3>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  {/* SVG Donut */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#f3f4f6" strokeWidth="14" />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="14"
                      strokeDasharray={`${(percentage / 100) * 440} 440`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-800">{percentage}%</span>
                    <span className="text-xs text-gray-500">Present</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-600">
                    Present: {stats.presentToday} ({stats.totalStudents > 0 ? ((stats.presentToday / stats.totalStudents) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs text-gray-600">
                    Absent: {stats.absentToday} ({stats.totalStudents > 0 ? ((stats.absentToday / stats.totalStudents) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Trend — like image #14 */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Attendance Trend (Last 30 Days)</h3>
              {stats.monthlyTrend.length > 0 ? (
                <div className="h-48 flex items-end gap-1 overflow-x-auto">
                  {stats.monthlyTrend.slice(-15).map((day, i) => {
                    const total = day.present + day.absent;
                    const pct = total > 0 ? (day.present / total) * 100 : 0;
                    return (
                      <div key={i} className="flex flex-col items-center flex-1 min-w-[24px]">
                        <div className="w-full flex flex-col items-center">
                          <div
                            className="w-5 bg-green-400 rounded-t"
                            style={{ height: `${(pct / 100) * 120}px` }}
                            title={`${day.date}: ${pct.toFixed(0)}%`}
                          ></div>
                          <div
                            className="w-5 bg-red-300 rounded-b"
                            style={{ height: `${((100 - pct) / 100) * 120}px` }}
                          ></div>
                        </div>
                        <span className="text-[9px] text-gray-400 mt-1 rotate-[-45deg]">
                          {new Date(day.date).getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                  No attendance data available
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/attendance"
              className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">✏️</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Mark Attendance</p>
                <p className="text-xs text-gray-500">Mark today's class attendance</p>
              </div>
            </a>

            <a
              href="/attendance-report"
              className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Reports</p>
                <p className="text-xs text-gray-500">View monthly & yearly reports</p>
              </div>
            </a>

            <a
              href="/attendance-report"
              className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🏫</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">School Report</p>
                <p className="text-xs text-gray-500">Full school attendance overview</p>
              </div>
            </a>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-400">No data available</div>
      )}
    </div>
  );
};

export default AttendanceDashboardPage;

