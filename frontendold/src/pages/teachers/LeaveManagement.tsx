

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiPlus, FiCheckCircle, FiClock, FiXCircle, FiX } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL;

interface LeaveRecord {
  id: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: string;
  teacher?: { name: string };
  createdAt: string;
}

interface LeaveStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [stats, setStats] = useState<LeaveStats>({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    teacherId: "",
    leaveType: "CASUAL",
    fromDate: "",
    toDate: "",
    reason: "",
    academicYearId: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const token = localStorage.getItem("token");

  const fetchData = async () => {
    try {
      const [leavesRes, statsRes, teacherRes, yearRes] = await Promise.all([
        axios.get(`${API}/teacher-leave`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/teacher-leave/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/teacher`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/academic`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (leavesRes.data.success) setLeaves(leavesRes.data.data?.data || []);
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (teacherRes.data.success) setTeachers(teacherRes.data.data?.data || []);
      setAcademicYears(yearRes.data.data?.data || yearRes.data.data || []);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacherId) return toast.error("Select a teacher");
    if (!formData.fromDate || !formData.toDate) return toast.error("Select dates");
    if (!formData.reason.trim()) return toast.error("Reason is required");
    if (!formData.academicYearId) return toast.error("Select academic year");

    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/teacher-leave`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        toast.success("Leave applied successfully");
        setShowModal(false);
        setFormData({
          teacherId: "",
          leaveType: "CASUAL",
          fromDate: "",
          toDate: "",
          reason: "",
          academicYearId: "",
        });
        fetchData();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to apply leave");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await axios.put(
        `${API}/teacher-leave/${id}/approve`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(`Leave ${status.toLowerCase()}`);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Action failed");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus size={18} /> Apply Leave
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <FiClock className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Leave</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-lg">
            <FiCheckCircle className="text-green-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="bg-yellow-100 p-3 rounded-lg">
            <FiClock className="text-yellow-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-lg">
            <FiXCircle className="text-red-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Leave Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Teacher</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Leave Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">From Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">To Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Days</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave, index) => (
                <tr key={leave.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {leave.teacher?.name || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{leave.leaveType}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(leave.fromDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(leave.toDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{leave.days}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(leave.status)}`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {leave.status === "PENDING" && (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleApprove(leave.id, "APPROVED")}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApprove(leave.id, "REJECTED")}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No leave records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Apply Leave</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleApply} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="MEDICAL">Medical Leave</option>
                  <option value="EARNED">Earned Leave</option>
                  <option value="MATERNITY">Maternity Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date *</label>
                  <input
                    type="date"
                    value={formData.fromDate}
                    onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date *</label>
                  <input
                    type="date"
                    value={formData.toDate}
                    onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                <select
                  value={formData.academicYearId}
                  onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Year</option>
                  {academicYears.map((y: any) => (
                    <option key={y.id} value={y.id}>{y.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  placeholder="Enter reason for leave"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? "Applying..." : "Apply Leave"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;

