import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getFullUrl } from "../../utils/url";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Users,
} from "lucide-react";

// ─── Types ───
interface Child {
  id: string;
  firstName: string;
  lastName: string;
  className: string;
  sectionName: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  percentage: number;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PRESENT: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  ABSENT: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  LATE: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  HALF_DAY: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  LEAVE: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  HOLIDAY: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
};

function ParentAttendancePage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchAttendance(selectedChild.id);
    }
  }, [selectedChild, currentMonth, currentYear]);

  const fetchChildren = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/parent/my-children"));
      if (res.data?.success && res.data.data?.length > 0) {
        setChildren(res.data.data);
        setSelectedChild(res.data.data[0]);
      }
    } catch {
      toast.error("Failed to load children");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (studentId: string) => {
    try {
      const res = await axios.get(
        getFullUrl(`/api/parent/child/${studentId}/attendance?month=${currentMonth}&year=${currentYear}`)
      );
      if (res.data?.success) {
        setRecords(res.data.data.records || []);
        setSummary(res.data.data.summary || null);
      }
    } catch {
      toast.error("Failed to load attendance");
    }
  };

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const grid: (number | null)[] = [];

    // Leading empty cells for alignment (Mon-start calendar)
    const leadingBlanks = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < leadingBlanks; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);

    return grid;
  }, [currentMonth, currentYear]);

  // Map date → status for quick lookup
  const dateStatusMap = useMemo(() => {
    const map: Record<number, string> = {};
    records.forEach((r) => {
      const d = new Date(r.date).getDate();
      map[d] = r.status;
    });
    return map;
  }, [records]);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <ClipboardCheck className="text-teal-600" size={24} />
        Attendance
      </h1>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="flex gap-3 flex-wrap">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
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

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Total Days</p>
            <p className="text-xl font-bold text-gray-800">{summary.total}</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
            <p className="text-xs text-green-600 mb-1">Present</p>
            <p className="text-xl font-bold text-green-700">{summary.present}</p>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
            <p className="text-xs text-red-600 mb-1">Absent</p>
            <p className="text-xl font-bold text-red-700">{summary.absent}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 text-center">
            <p className="text-xs text-yellow-600 mb-1">Late</p>
            <p className="text-xl font-bold text-yellow-700">{summary.late}</p>
          </div>
          <div className="bg-orange-50 rounded-xl border border-orange-200 p-4 text-center">
            <p className="text-xs text-orange-600 mb-1">Half Day</p>
            <p className="text-xl font-bold text-orange-700">{summary.halfDay}</p>
          </div>
          <div className="bg-teal-50 rounded-xl border border-teal-200 p-4 text-center">
            <p className="text-xs text-teal-600 mb-1">Percentage</p>
            <p className="text-xl font-bold text-teal-700">{summary.percentage}%</p>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-semibold text-gray-800">
            {MONTHS[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`blank-${idx}`} className="aspect-square" />;
            }

            const status = dateStatusMap[day];
            const colors = status ? STATUS_COLORS[status] : null;

            return (
              <div
                key={day}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all ${
                  colors
                    ? `${colors.bg} ${colors.text} font-medium`
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>{day}</span>
                {status && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${colors?.dot}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-100">
          {Object.entries(STATUS_COLORS).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${val.dot}`} />
              <span className="text-xs text-gray-500 capitalize">{key.toLowerCase().replace("_", " ")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ParentAttendancePage;
