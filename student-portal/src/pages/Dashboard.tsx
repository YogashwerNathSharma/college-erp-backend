import { useState, useEffect } from "react";
import { portalService } from "../services/portal.service";
import { useAuth } from "../hooks/useAuth";
import { HiAcademicCap, HiCalendar, HiCurrencyRupee, HiClipboardList } from "react-icons/hi";

//////////////////////////////////////////////////////
// 📊 STUDENT DASHBOARD
//////////////////////////////////////////////////////

interface DashboardData {
  student: {
    name: string;
    class: string;
    section: string;
    rollNo: string;
    admissionNo: string;
  };
  attendance: {
    percentage: number;
    present: number;
    absent: number;
    total: number;
  };
  fees: {
    totalFee: number;
    paid: number;
    pending: number;
  };
  recentResults: Array<{
    examName: string;
    percentage: number;
    rank: number;
  }>;
  notices: Array<{
    id: string;
    title: string;
    date: string;
  }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const result = await portalService.getDashboard();
        setData(result);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name || "Student"} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {data?.student?.class} - {data?.student?.section} | Roll No: {data?.student?.rollNo}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<HiCalendar className="w-6 h-6" />}
          label="Attendance"
          value={`${data?.attendance?.percentage || 0}%`}
          color="blue"
        />
        <StatCard
          icon={<HiAcademicCap className="w-6 h-6" />}
          label="Last Exam"
          value={`${data?.recentResults?.[0]?.percentage || 0}%`}
          color="green"
        />
        <StatCard
          icon={<HiCurrencyRupee className="w-6 h-6" />}
          label="Fee Pending"
          value={`₹${data?.fees?.pending?.toLocaleString("en-IN") || 0}`}
          color="red"
        />
        <StatCard
          icon={<HiClipboardList className="w-6 h-6" />}
          label="Notices"
          value={`${data?.notices?.length || 0}`}
          color="purple"
        />
      </div>

      {/* Recent Results */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Results</h2>
        {data?.recentResults?.length ? (
          <div className="space-y-3">
            {data.recentResults.map((result, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{result.examName}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">Rank: #{result.rank}</span>
                  <span className="font-semibold text-primary-600">{result.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No results available</p>
        )}
      </div>

      {/* Recent Notices */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Notices</h2>
        {data?.notices?.length ? (
          <div className="space-y-3">
            {data.notices.slice(0, 5).map((notice) => (
              <div key={notice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{notice.title}</span>
                <span className="text-sm text-gray-400">{notice.date}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No notices</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-sm text-gray-500 mt-3">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
