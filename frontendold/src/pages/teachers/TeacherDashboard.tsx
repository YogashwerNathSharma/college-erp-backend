

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiUsers, FiUserCheck, FiUser } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL;

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

const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];

const TeacherDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [recentTeachers, setRecentTeachers] = useState<RecentTeacher[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchData = async () => {
    try {
      const [statsRes, chartRes, overviewRes, recentRes] = await Promise.all([
        axios.get(`${API}/teacher-dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/teacher-dashboard/department-chart`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/teacher-dashboard/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/teacher-dashboard/recent`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (chartRes.data.success) setChartData(chartRes.data.data);
      if (overviewRes.data.success) setMonthlyData(overviewRes.data.data);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Teacher Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <FiUsers className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Teachers</p>
            <p className="text-2xl font-bold text-gray-800">{stats?.totalTeachers || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-lg">
            <FiUser className="text-indigo-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Male Teachers</p>
            <p className="text-2xl font-bold text-gray-800">{stats?.maleTeachers || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="bg-pink-100 p-3 rounded-lg">
            <FiUser className="text-pink-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Female Teachers</p>
            <p className="text-2xl font-bold text-gray-800">{stats?.femaleTeachers || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-lg">
            <FiUserCheck className="text-green-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Teachers</p>
            <p className="text-2xl font-bold text-gray-800">{stats?.activeTeachers || 0}</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart - Teachers by Department */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Teachers by Department</h2>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
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
                      strokeWidth="20"
                      strokeDasharray={`${percentage * 2.51} ${251 - percentage * 2.51}`}
                      strokeDashoffset={`${-offset * 2.51}`}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </div>
          </div>
          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-sm text-gray-600">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Overview - Monthly Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Overview</h2>
          <div className="flex items-end gap-2 h-48">
            {monthlyData.map((item, index) => {
              const maxCount = Math.max(...monthlyData.map((m) => m.count), 1);
              const height = (item.count / maxCount) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <span className="text-xs text-gray-500 mb-1">{item.count || ""}</span>
                  <div
                    className="w-full bg-blue-500 rounded-t-sm transition-all"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-1">{item.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-xs text-gray-500">Total Teachers</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-500">Active Teachers</span>
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

