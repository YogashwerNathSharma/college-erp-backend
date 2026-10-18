import { useState, useEffect } from "react";
import { portalService } from "../services/portal.service";

//////////////////////////////////////////////////////
// 📅 MY ATTENDANCE PAGE
//////////////////////////////////////////////////////

interface AttendanceData {
  summary: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  records: Array<{
    date: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "HOLIDAY";
    subject?: string;
  }>;
}

export default function MyAttendance() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const result = await portalService.getAttendance({ month, year });
        setData(result);
      } catch (error) {
        console.error("Attendance fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [month, year]);

  const statusColors: Record<string, string> = {
    PRESENT: "bg-green-100 text-green-700",
    ABSENT: "bg-red-100 text-red-700",
    LATE: "bg-yellow-100 text-yellow-700",
    HOLIDAY: "bg-gray-100 text-gray-500",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2024, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
        >
          {[2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 border text-center">
          <p className="text-2xl font-bold text-gray-900">{data?.summary?.totalDays || 0}</p>
          <p className="text-sm text-gray-500">Total Days</p>
        </div>
        <div className="bg-white rounded-lg p-4 border text-center">
          <p className="text-2xl font-bold text-green-600">{data?.summary?.present || 0}</p>
          <p className="text-sm text-gray-500">Present</p>
        </div>
        <div className="bg-white rounded-lg p-4 border text-center">
          <p className="text-2xl font-bold text-red-600">{data?.summary?.absent || 0}</p>
          <p className="text-sm text-gray-500">Absent</p>
        </div>
        <div className="bg-white rounded-lg p-4 border text-center">
          <p className="text-2xl font-bold text-yellow-600">{data?.summary?.late || 0}</p>
          <p className="text-sm text-gray-500">Late</p>
        </div>
        <div className="bg-white rounded-lg p-4 border text-center">
          <p className="text-2xl font-bold text-primary-600">{data?.summary?.percentage || 0}%</p>
          <p className="text-sm text-gray-500">Percentage</p>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.records?.length ? (
              data.records.map((record, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 text-sm text-gray-900">{record.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[record.status]}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{record.subject || "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  No attendance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
