

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiCheckCircle, FiXCircle, FiPercent, FiCalendar } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL;



const TeacherAttendance = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalClasses: 0,
    present: 0,
    absent: 0,
    percentage: 0,
  });

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

  const fetchAttendance = async () => {
    if (!selectedTeacher) return;
    setLoading(true);
    try {
      // Get timetable for the day
      const dayOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const dayIndex = new Date(selectedDate).getDay();
      const day = dayOfWeek[dayIndex];

      const res = await axios.get(
        `${API}/timetable?teacherId=${selectedTeacher}&day=${day}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const data = res.data.data?.data || res.data.data || [];
        setTimetable(data);

        // Calculate stats (simulated - in real app, compare with attendance records)
        const total = data.length;
        const present = total; // All present by default
        const absent = 0;
        setStats({
          totalClasses: total,
          present,
          absent,
          percentage: total > 0 ? Math.round((present / total) * 100) : 0,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedTeacher, selectedDate]);

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Attendance</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
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
        </div>
      </div>

      {/* Stats Cards */}
      {selectedTeacher && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FiCalendar className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Classes</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalClasses}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <FiCheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <FiXCircle className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FiPercent className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Percentage</p>
                <p className="text-2xl font-bold text-purple-600">{stats.percentage}%</p>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">#</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Class</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Subject</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Time</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timetable.map((entry: any, index: number) => (
                      <tr key={entry.id || index} className="border-b hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">
                          {entry.class?.name || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {entry.subject?.name || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {TIME_SLOTS[entry.period - 1] || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Present
                          </span>
                        </td>
                      </tr>
                    ))}
                    {timetable.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No classes scheduled for this day
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherAttendance;

