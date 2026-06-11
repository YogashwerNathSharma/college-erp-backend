

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiCalendar } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL;

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_SLOTS = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 01:00",
  "01:00 - 02:00",
  "02:00 - 03:00",
  "03:00 - 04:00",
];

interface TimetableEntry {
  id: string;
  day: string;
  period: number;
  subject: { name: string };
  class: { name: string };
  section?: { name: string };
}

const TeacherTimetable = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [viewMode, setViewMode] = useState<"Weekly" | "Daily">("Weekly");
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API}/teacher`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setTeachers(res.data.data?.data || []);
      }
    } catch (err) {
      toast.error("Failed to load teachers");
    }
  };

  const fetchTimetable = async () => {
    if (!selectedTeacher) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/timetable?teacherId=${selectedTeacher}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setTimetable(res.data.data?.data || res.data.data || []);
      }
    } catch (err) {
      toast.error("Failed to load timetable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [selectedTeacher]);

  const getEntry = (day: string, period: number): TimetableEntry | undefined => {
    return timetable.find((t) => t.day === day && t.period === period);
  };

  const selectedTeacherName = teachers.find((t) => t.id === selectedTeacher)?.name || "";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Timetable</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Select Teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="Weekly">Weekly</option>
              <option value="Daily">Daily</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Week</label>
            <input
              type="week"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      {selectedTeacher && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex items-center gap-2">
            <FiCalendar className="text-blue-600" />
            <span className="font-medium text-gray-700">{selectedTeacherName}</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600 w-32">
                      Time
                    </th>
                    {DAYS.map((day, i) => (
                      <th
                        key={day}
                        className="px-3 py-3 text-center text-sm font-semibold text-gray-600"
                      >
                        {DAY_LABELS[i]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot, periodIndex) => (
                    <tr key={periodIndex} className="border-b">
                      <td className="px-3 py-4 text-sm text-gray-600 font-medium">{slot}</td>
                      {DAYS.map((day) => {
                        const entry = getEntry(day, periodIndex + 1);
                        const isBreak = slot === "12:00 - 01:00";
                        return (
                          <td key={day} className="px-2 py-2 text-center">
                            {isBreak ? (
                              <div className="bg-gray-100 rounded-lg p-2">
                                <span className="text-sm text-gray-500 font-medium">Break</span>
                              </div>
                            ) : entry ? (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                <p className="text-sm font-medium text-blue-700">
                                  {entry.subject?.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {entry.class?.name}
                                  {entry.section ? ` - ${entry.section.name}` : ""}
                                </p>
                              </div>
                            ) : (
                              <div className="bg-gray-50 rounded-lg p-2">
                                <span className="text-xs text-gray-400">Free Period</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selectedTeacher && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FiCalendar className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">Select a teacher to view their timetable</p>
        </div>
      )}
    </div>
  );
};

export default TeacherTimetable;

