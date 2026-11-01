import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { FiBook, FiUsers, FiClock, FiCalendar, FiBell } from "react-icons/fi";

interface TimetableEntry {
  id?: string;
  day: string;
  period: number;
  subject?: { id: string; name: string };
  class?: { id: string; name: string };
  section?: { id: string; name: string };
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function normalizeId(item: any): string {
  return item?.id || item?._id || "";
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "N/A";
  try { return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return dateStr; }
}

const TIME_SLOTS = ["08:00 - 09:00","09:00 - 10:00","10:00 - 11:00","11:00 - 12:00","12:00 - 01:00","01:00 - 02:00","02:00 - 03:00","03:00 - 04:00"];

function getTodayDayCode(): string {
  const days = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
  return days[new Date().getDay()];
}

export default function TeacherDashboardPage() {
  const { selectedAcademicYearId } = useAcademicYear();
  const user = useMemo(() => getCurrentUser(), []);
  const isPrincipal = user?.role === "PRINCIPAL";

  const [stats, setStats] = useState({ todayClasses: 0, totalStudents: 0, pendingAttendance: 0 });
  const [todaySchedule, setTodaySchedule] = useState<TimetableEntry[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const todayCode = getTodayDayCode();
        const academicYearId = selectedAcademicYearId || undefined;

        const [timetableRes, studentRes, notifRes] = await Promise.allSettled([
          axios.get(getFullUrl("/api/timetable"), {
            headers: getAuthHeaders(),
            params: { day: todayCode, ...(academicYearId ? { academicYearId } : {}) },
          }),
          axios.get(getFullUrl("/api/students"), { headers: getAuthHeaders(), params: academicYearId ? { academicYearId } : undefined }),
          axios.get(getFullUrl("/api/notifications"), { headers: getAuthHeaders(), params: { limit: 5 } }),
        ]);

        let schedule: TimetableEntry[] = [];
        if (timetableRes.status === "fulfilled") {
          const ttData = timetableRes.value.data?.data?.data || timetableRes.value.data?.data || [];
          schedule = Array.isArray(ttData) ? ttData : [];
        }
        setTodaySchedule(schedule);

        let studentCount = 0;
        if (studentRes.status === "fulfilled") {
          const stuData = studentRes.value.data?.data || studentRes.value.data || [];
          const stuMeta = studentRes.value.data?.data?.meta;
          studentCount = stuMeta?.total || (Array.isArray(stuData) ? stuData.length : 0);
        }

        if (notifRes.status === "fulfilled") {
          const nData = notifRes.value.data?.data || notifRes.value.data || [];
          setNotifications(Array.isArray(nData) ? nData.slice(0, 5) : []);
        }

        setStats({ todayClasses: schedule.length, totalStudents: studentCount, pendingAttendance: schedule.length });
      } catch { /* silently fail */ } finally { setLoading(false); }
    }
    fetchDashboard();
  }, [selectedAcademicYearId]);

  if (loading) return <Spinner />;

  const statCards = [
    { label: "Today's Classes", value: stats.todayClasses, color: "bg-blue-500", icon: FiBook },
    { label: "Total Students", value: stats.totalStudents, color: "bg-green-500", icon: FiUsers },
    { label: "Pending Attendance", value: stats.pendingAttendance, color: "bg-amber-500", icon: FiClock },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Welcome back, {user?.name || "Teacher"}! 👋</h2>
        <p className="mt-1 text-indigo-100">
          {isPrincipal ? "Manage your school from here. All reports and approvals at your fingertips." : "Here's what's happening in your classes today."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                <Icon className="text-white text-xl" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Schedule</h3>
        {todaySchedule.length === 0 ? (
          <div className="text-center py-8 text-gray-500"><FiCalendar className="mx-auto text-3xl mb-2 text-gray-300" /><p className="text-sm">No classes scheduled for today.</p></div>
        ) : (
          <div className="space-y-3">
            {todaySchedule.map((entry, i) => {
              const timeSlot = TIME_SLOTS[entry.period - 1] || `Period ${entry.period}`;
              return (
                <div key={normalizeId(entry) || i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center"><FiClock className="text-indigo-600" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{entry.subject?.name || "N/A"}</p>
                    <p className="text-xs text-gray-500">{entry.class?.name || "N/A"}{entry.section?.name ? ` (${entry.section.name})` : ""}</p>
                  </div>
                  <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded">{timeSlot}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Notifications</h3>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500"><FiBell className="mx-auto text-3xl mb-2 text-gray-300" /><p className="text-sm">No recent notifications.</p></div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n: any, i: number) => (
              <div key={normalizeId(n) || i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FiBell className="text-indigo-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{n.message || n.title || n.text || "Notification"}</p>
                  {n.createdAt && <p className="text-xs text-gray-400 mt-1">{formatDate(n.createdAt)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
