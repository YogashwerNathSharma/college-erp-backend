import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import { FiUsers, FiUserCheck, FiUser } from "react-icons/fi";
import { X, Search } from "lucide-react";

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
  status?: string;
  gender?: string;
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

// \u2550\u2550\u2550 TEACHER DETAIL MODAL COMPONENT \u2550\u2550\u2550
interface TeacherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterType?: "all" | "male" | "female" | "active";
}

const TeacherDetailModal = ({ isOpen, onClose, filterType = "all" }: TeacherDetailModalProps) => {
  const [teachers, setTeachers] = useState<RecentTeacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // Fetch all teachers on modal open
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setDepartmentFilter("");
      fetchTeachers();
    }
  }, [isOpen, filterType]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/teachers`, { headers });
      const data = res.data?.data || res.data || [];
      const teachersList = Array.isArray(data) ? data : data?.teachers || [];
      setTeachers(teachersList);

      // Extract unique departments
      const depts = [...new Set(teachersList.map((t: any) => t.department).filter(Boolean))];
      setDepartments(depts as string[]);
    } catch (err: any) {
      console.error("Failed to fetch teachers:", err);
      toast.error("Failed to load teachers");
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const filteredTeachers = teachers.filter((teacher: any) => {
    // Gender filter based on card clicked
    if (filterType === "male" && teacher.gender?.toLowerCase() !== "male") return false;
    if (filterType === "female" && teacher.gender?.toLowerCase() !== "female") return false;
    if (filterType === "active" && teacher.status?.toLowerCase() !== "active") return false;

    // Search filter
    const name = (teacher.name || "").toLowerCase();
    const email = (teacher.email || "").toLowerCase();
    const phone = (teacher.phone || "").toLowerCase();
    const matchSearch = !searchTerm || name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm.toLowerCase());

    // Department filter
    const matchDept = !departmentFilter || teacher.department === departmentFilter;

    return matchSearch && matchDept;
  });

  // Get modal title
  const getTitle = () => {
    switch (filterType) {
      case "male": return "👨‍🏫 Male Teachers";
      case "female": return "👩‍🏫 Female Teachers";
      case "active": return "✅ Active Teachers";
      default: return "👥 All Teachers";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9000] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[100vh] sm:h-auto sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden sm:rounded-2xl rounded-none" onClick={(e) => e.stopPropagation()}>
        
        {/* \u2550\u2550\u2550 HEADER \u2550\u2550\u2550 */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800">{getTitle()}</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 bg-white px-2 py-0.5 rounded">{filteredTeachers.length} records</span>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* \u2550\u2550\u2550 FILTERS \u2550\u2550\u2550 */}
        <div className="px-6 py-3 border-b bg-slate-50 flex-shrink-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[150px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white min-w-[140px]"
            >
              <option value="">All Departments</option>
              {departments.map((dept: string) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* \u2550\u2550\u2550 TABLE \u2550\u2550\u2550 */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center text-slate-400 py-16">
              <p className="text-lg">🔍 No teachers found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-100 z-10">
                <tr className="text-left text-slate-600 text-xs uppercase">
                  <th className="p-2.5 w-8">#</th>
                  <th className="p-2.5">Name</th>
                  <th className="p-2.5">Email</th>
                  <th className="p-2.5">Phone</th>
                  <th className="p-2.5">Department</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Gender</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher: any, i: number) => (
                  <tr key={teacher.id} className="border-b border-slate-50 hover:bg-blue-50/40 transition">
                    <td className="p-2.5 text-slate-400 text-xs">{i + 1}</td>
                    <td className="p-2.5 font-medium text-slate-800">{teacher.name}</td>
                    <td className="p-2.5 text-slate-600 text-xs">{teacher.email}</td>
                    <td className="p-2.5 text-slate-600 text-xs">{teacher.phone || "-"}</td>
                    <td className="p-2.5 text-slate-600">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {teacher.department || "-"}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        teacher.status?.toLowerCase() === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {teacher.status || "Inactive"}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600 capitalize">
                      {teacher.gender || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* \u2550\u2550\u2550 FOOTER \u2550\u2550\u2550 */}
        <div className="px-6 py-2 border-t bg-slate-50 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <span>{filteredTeachers.length} of {teachers.length}</span>
        </div>
      </div>
    </div>
  );
};

// \u2550\u2550\u2550 MAIN DASHBOARD COMPONENT \u2550\u2550\u2550
const TeacherDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [leaveData, setLeaveData] = useState<LeaveItem[]>([]);
  const [recentTeachers, setRecentTeachers] = useState<RecentTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [modalFilterType, setModalFilterType] = useState<"all" | "male" | "female" | "active">("all");

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

  // Handle card clicks
  const handleCardClick = (type: "all" | "male" | "female" | "active") => {
    setModalFilterType(type);
    setShowTeacherModal(true);
  };

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

      {/* Stats Cards — Colorful + Compact + CLICKABLE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Teachers Card */}
        <div 
          className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4 text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
          onClick={() => handleCardClick("all")}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium opacity-80">Total Teachers</p>
            <FiUsers size={16} className="opacity-70" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats?.totalTeachers || 0}</p>
        </div>

        {/* Male Teachers Card */}
        <div 
          className="bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl p-4 text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
          onClick={() => handleCardClick("male")}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium opacity-80">Male Teachers</p>
            <FiUser size={16} className="opacity-70" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats?.maleTeachers || 0}</p>
        </div>

        {/* Female Teachers Card */}
        <div 
          className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-4 text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
          onClick={() => handleCardClick("female")}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium opacity-80">Female Teachers</p>
            <FiUser size={16} className="opacity-70" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats?.femaleTeachers || 0}</p>
        </div>

        {/* Active Teachers Card */}
        <div 
          className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-4 text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
          onClick={() => handleCardClick("active")}
        >
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

      {/* Teacher Detail Modal */}
      <TeacherDetailModal 
        isOpen={showTeacherModal} 
        onClose={() => setShowTeacherModal(false)}
        filterType={modalFilterType}
      />
    </div>
  );
};

export default TeacherDashboard;
