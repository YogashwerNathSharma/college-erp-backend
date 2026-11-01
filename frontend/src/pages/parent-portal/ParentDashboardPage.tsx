import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getFullUrl } from "../../utils/url";
import {
  Users,
  ClipboardCheck,
  FileText,
  IndianRupee,
  Bell,
  TrendingUp,
  Calendar,
  AlertCircle,
} from "lucide-react";

// ─── Types ───
interface Child {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  admissionNo: string;
  className: string;
  sectionName: string;
  academicYear: string;
  photoUrl?: string;
  relation: string;
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

interface FeeSummary {
  totalDue: number;
  totalPaid: number;
  totalBalance: number;
}

function ParentDashboardPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch children on mount
  useEffect(() => {
    fetchChildren();
    fetchNotices();
  }, []);

  // Fetch child-specific data when child is selected
  useEffect(() => {
    if (selectedChild) {
      fetchChildAttendance(selectedChild.id);
      fetchChildFees(selectedChild.id);
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/parent/my-children"));
      if (res.data?.success && res.data.data?.length > 0) {
        setChildren(res.data.data);
        setSelectedChild(res.data.data[0]);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load children");
    } finally {
      setLoading(false);
    }
  };

  const fetchChildAttendance = async (studentId: string) => {
    try {
      const res = await axios.get(getFullUrl(`/api/parent/child/${studentId}/attendance`));
      if (res.data?.success) {
        setAttendanceSummary(res.data.data.summary);
      }
    } catch {}
  };

  const fetchChildFees = async (studentId: string) => {
    try {
      const res = await axios.get(getFullUrl(`/api/parent/child/${studentId}/fees`));
      if (res.data?.success) {
        setFeeSummary(res.data.data.summary);
      }
    } catch {}
  };

  const fetchNotices = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/parent/notices?limit=5"));
      if (res.data?.success) {
        setNotices(res.data.data.notices || []);
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="text-gray-400 mb-3" size={48} />
        <h2 className="text-lg font-semibold text-gray-600">No Children Linked</h2>
        <p className="text-sm text-gray-400 mt-1">
          Contact your school admin to link your account to your child.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Welcome Banner ─── */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome back! 👋
        </h1>
        <p className="text-teal-100 mt-1 text-sm">
          Stay updated on your child's progress, attendance, and fee status.
        </p>
      </div>

      {/* ─── Child Selector (if multiple children) ─── */}
      {children.length > 1 && (
        <div className="flex gap-3 flex-wrap">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                selectedChild?.id === child.id
                  ? "bg-teal-50 border-teal-500 text-teal-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Users size={16} />
              {child.firstName} {child.lastName}
            </button>
          ))}
        </div>
      )}

      {/* ─── Selected Child Info Card ─── */}
      {selectedChild && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xl font-bold flex-shrink-0">
              {selectedChild.firstName?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedChild.firstName} {selectedChild.lastName}
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                <span className="text-sm text-gray-500">
                  Admission: <span className="font-medium text-gray-700">{selectedChild.admissionNo}</span>
                </span>
                <span className="text-sm text-gray-500">
                  Class: <span className="font-medium text-gray-700">{selectedChild.className} - {selectedChild.sectionName}</span>
                </span>
                <span className="text-sm text-gray-500">
                  Year: <span className="font-medium text-gray-700">{selectedChild.academicYear}</span>
                </span>
                <span className="text-sm text-gray-500">
                  Relation: <span className="font-medium text-gray-700 capitalize">{selectedChild.relation.toLowerCase()}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Stats Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <ClipboardCheck className="text-green-600" size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">Attendance</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {attendanceSummary?.percentage ?? "—"}%
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {attendanceSummary ? `${attendanceSummary.present}/${attendanceSummary.total} days present` : "This month"}
          </p>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">Results</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">View</p>
          <p className="text-xs text-gray-400 mt-1">Check latest results</p>
        </div>

        {/* Fee Paid */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <IndianRupee className="text-emerald-600" size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">Fee Paid</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            ₹{feeSummary ? feeSummary.totalPaid.toLocaleString("en-IN") : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-1">Total paid this year</p>
        </div>

        {/* Fee Due */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertCircle className="text-red-600" size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">Fee Due</span>
          </div>
          <p className="text-2xl font-bold text-red-600">
            ₹{feeSummary ? feeSummary.totalBalance.toLocaleString("en-IN") : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-1">Pending balance</p>
        </div>
      </div>

      {/* ─── Recent Notices ─── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Bell size={18} className="text-teal-600" />
            Recent Notices
          </h3>
        </div>
        {notices.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No notices yet.</p>
        ) : (
          <div className="space-y-3">
            {notices.map((notice: any) => (
              <div
                key={notice.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bell size={14} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{notice.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notice.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notice.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ParentDashboardPage;
