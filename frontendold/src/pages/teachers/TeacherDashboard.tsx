import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import { FiUsers, FiUserCheck, FiUser } from "react-icons/fi";

const API = `${API_BASE_URL}/api`;

interface Stats {
  totalTeachers: number;
  maleTeachers: number;
  femaleTeachers: number;
  activeTeachers: number;
}

interface ChartItem {
  name: string;
  value: number;
}

interface RecentTeacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  createdAt: string;
}

interface LeaveItem {
  id: string;
  teacherName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
}

const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];

const TeacherDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [leaveData, setLeaveData] = useState<LeaveItem[]>([]);
  const [recentTeachers, setRecentTeachers] = useState<RecentTeacher[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchData = async () => {
    try {
      const [statsRes, chartRes, leaveRes, recentRes] = await Promise.all([
        axios.get(`${API}/teacher-dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/teacher-dashboard/department-chart`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/teacher-dashboard/leaves`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: { success: false, data: [] } })),
        axios.get(`${API}/teacher-dashboard/recent`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (chartRes.data.success) setChartData(chartRes.data.data);
      if (leaveRes.data.success) setLeaveData(leaveRes.data.data || []);
      if (recentRes.data.success) setRecentTeachers(recentRes.data.data);
    } catch (err: any) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="p-1">

      {/* Stats Cards — Colorful + Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium opacity-80">Total Teachers</p>
            <FiUsers size={16} className="opacity-70" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats?.totalTeachers || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium opacity-80">Male Teachers</p>
            <FiUser size={16} className="opacity-70" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats?.maleTeachers || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium opacity-80">Female Teachers</p>
            <FiUser size={16} className="opacity-70" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats?.femaleTeachers || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium opacity-80">Active Teachers</p>
            <FiUserCheck size={16} className="opacity-70" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats?.activeTeachers || 0}</p>
        </div>
      </div>

{/* Three cards row */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  
  {/* 1. Teachers by Department */}
  <div className="bg-white rounded-xl shadow p-4">
    <h2 className="text-sm font-semibold text-gray-800 mb-3">Teachers by Department</h2>
    <div className="flex items-center gap-3">
      {/* LEFT — Legend (2 columns, tight) */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 flex-1">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            ></div>
            <span className="text-[11px] text-gray-600 whitespace-nowrap">
              {item.name} ({item.value})
            </span>
          </div>
        ))}
      </div>

      {/* RIGHT — Donut */}
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {chartData.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            const offset = chartData
              .slice(0, index)
              .reduce((sum, i) => sum + (total > 0 ? (i.value / total) * 100 : 0), 0);
            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={COLORS[index % COLORS.length]}
                strokeWidth="18"
                strokeDasharray={`${percentage * 2.51} ${251 - percentage * 2.51}`}
                strokeDashoffset={`${-offset * 2.51}`}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{total}</p>
            <p className="text-[7px] text-gray-500">Assignments</p>
          </div>
        </div>
      </div>
    </div>
  </div>

{/* Gender Distribution */}
<div className="bg-white rounded-xl shadow p-4">
  <h2 className="text-sm font-semibold text-gray-800 mb-3">Gender Distribution</h2>
  {stats && (
    <div className="flex items-center gap-3">
      {/* LEFT — Legend */}
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary-500"></div>
          <span className="text-xs text-gray-700 font-medium">Male ({stats.maleTeachers})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pink-500"></div>
          <span className="text-xs text-gray-700 font-medium">Female ({stats.femaleTeachers})</span>
        </div>
        <div className="mt-1 text-[11px] text-gray-500">
          Total: {stats.totalTeachers} Teachers
        </div>
      </div>

      {/* RIGHT — Donut */}
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {stats.totalTeachers > 0 ? (
            <>
              {/* Male arc */}
              <circle
                cx="50" cy="50" r="40"
                fill="none" stroke="#3B82F6" strokeWidth="18"
                strokeDasharray={`${(stats.maleTeachers / stats.totalTeachers) * 251} ${251 - (stats.maleTeachers / stats.totalTeachers) * 251}`}
                strokeDashoffset="0"
              />
              {/* Female arc */}
              {stats.femaleTeachers > 0 && (
                <circle
                  cx="50" cy="50" r="40"
                  fill="none" stroke="#EC4899" strokeWidth="18"
                  strokeDasharray={`${(stats.femaleTeachers / stats.totalTeachers) * 251} ${251 - (stats.femaleTeachers / stats.totalTeachers) * 251}`}
                  strokeDashoffset={`${-(stats.maleTeachers / stats.totalTeachers) * 251}`}
                />
              )}
            </>
          ) : (
            /* Empty state - grey ring */
            <circle
              cx="50" cy="50" r="40"
              fill="none" stroke="#E5E7EB" strokeWidth="18"
              strokeDasharray="251"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{stats.totalTeachers}</p>
            <p className="text-[7px] text-gray-500">Teachers</p>
          </div>
        </div>
      </div>
    </div>
  )}
</div>

  {/* 3. Recent Leave Requests */}
  <div className="bg-white rounded-xl shadow p-4 flex flex-col">
    <h2 className="text-sm font-semibold text-gray-800 mb-3">Recent Leave Requests</h2>
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      <div className="text-center">
        <p>No leave requests found</p>
        <p className="text-xs mt-1">Leave data will appear here</p>
      </div>
    </div>
  </div>

</div>

      {/* Recent Teachers Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Recent Teachers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Department</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTeachers.map((teacher, index) => (
                <tr key={teacher.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{teacher.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{teacher.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{teacher.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{teacher.department}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;