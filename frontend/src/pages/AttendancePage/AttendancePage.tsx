import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";
import axios from "axios";
import { toast } from "react-hot-toast";

const API = `${API_BASE_URL}/api`;

interface StudentAttendance {
  studentId: string;
  name: string;
  rollNumber: string;
  admissionNo: string;
  status: "PRESENT" | "ABSENT" | null;
}

interface ClassOption {
  id: string;
  name: string;
}

interface SectionOption {
  id: string;
  name: string;
}

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

const AttendancePage = () => {
  // Selectors
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Data
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [isMarked, setIsMarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Stats
  const presentCount = students.filter((s) => s.status === "PRESENT").length;
  const absentCount = students.filter((s) => s.status === "ABSENT").length;
  const unmarkedCount = students.filter((s) => s.status === null).length;

  // Fetch classes & academic years on mount
  useEffect(() => {
    fetchClasses();
    fetchAcademicYears();
  }, []);

  // Fetch sections when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchSections(selectedClass);
      setSelectedSection("");
      setStudents([]);
    }
  }, [selectedClass]);

  const fetchAcademicYears = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/academic`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const years = res.data.data || [];
      setAcademicYears(years);
      const active = years.find((y: AcademicYear) => y.isCurrent);
      if (active) {
        setSelectedAcademicYear(active.id);
      }
    } catch (err) {
      console.error("Error fetching academic years:", err);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/class`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(res.data.data || []);
    } catch (err) {
      console.error("Error fetching classes:", err);
      setClasses([]);
    }
  };

  const fetchSections = async (classId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/section?classId=${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSections(res.data.data || []);
    } catch (err) {
      console.error("Error fetching sections:", err);
      setSections([]);
    }
  };

  // Fetch students attendance for selected class/section/date
  const fetchAttendance = async () => {
    if (!selectedClass || !selectedSection || !selectedDate) {
      toast.error("Please select class, section, and date");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/attendance/class`, {
        params: {
          classId: selectedClass,
          sectionId: selectedSection,
          date: selectedDate,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      setStudents(res.data.students || []);
      setIsMarked(res.data.isMarked || false);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      toast.error("Error fetching attendance data");
    } finally {
      setLoading(false);
    }
  };

  // Set explicit status for a specific student
  const setStudentStatus = (studentId: string, status: "PRESENT" | "ABSENT") => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentId === studentId) {
          return { ...s, status: s.status === status ? null : status };
        }
        return s;
      })
    );
  };

  // Mark all present
  const markAllPresent = () => {
    setStudents((prev) =>
      prev.map((s) => ({ ...s, status: "PRESENT" as const }))
    );
  };

  // Mark all absent
  const markAllAbsent = () => {
    setStudents((prev) =>
      prev.map((s) => ({ ...s, status: "ABSENT" as const }))
    );
  };

  // Save attendance
  const saveAttendance = async () => {
    const unmarked = students.filter((s) => s.status === null);
    if (unmarked.length > 0) {
      toast.error(`${unmarked.length} students are not marked yet!`);
      return;
    }

    if (!selectedAcademicYear) {
      toast.error("Academic year not found. Please refresh.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        classId: selectedClass,
        sectionId: selectedSection,
        academicYearId: selectedAcademicYear,
        date: selectedDate,
        students: students.map((s) => ({
          studentId: s.studentId,
          status: s.status,
        })),
      };

      if (isMarked) {
        await axios.put(`${API}/attendance/update`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Attendance updated successfully!");
      } else {
        await axios.post(`${API}/attendance/mark`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Attendance marked successfully!");
      }

      setIsMarked(true);
    } catch (err) {
      console.error("Error saving attendance:", err);
      toast.error("Error saving attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-3 md:p-6 max-w-6xl mx-auto min-h-screen pb-24">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">📋 Mark Attendance</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">Mark daily attendance class-wise</p>
      </div>

      {/* Filters Row */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
          {/* Academic Year */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Academic Year
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Year</option>
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>
                  {ay.name} {ay.isCurrent ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={!selectedClass}
            >
              <option value="">Select Section</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Load Button */}
          <div className="sm:col-span-2 md:col-span-1">
            <button
              onClick={fetchAttendance}
              disabled={loading || !selectedClass || !selectedSection}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold shadow-sm transition-all"
            >
              {loading ? "Loading..." : "Load Students"}
            </button>
          </div>
        </div>
      </div>

      {/* Students List */}
      {students.length > 0 && (
        <>
          {/* Stats Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:flex sm:gap-6 text-sm">
                <span className="text-gray-600 font-medium">
                  Total: <strong className="text-gray-900">{students.length}</strong>
                </span>
                <span className="text-green-600 font-medium">
                  Present: <strong>{presentCount}</strong>
                </span>
                <span className="text-red-600 font-medium">
                  Absent: <strong>{absentCount}</strong>
                </span>
                {unmarkedCount > 0 && (
                  <span className="text-amber-600 font-medium col-span-2 sm:col-span-1">
                    Unmarked: <strong>{unmarkedCount}</strong>
                  </span>
                )}
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={markAllPresent}
                  className="flex-1 sm:flex-none text-center px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors"
                >
                  ✓ All Present
                </button>
                <button
                  onClick={markAllAbsent}
                  className="flex-1 sm:flex-none text-center px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                >
                  ✕ All Absent
                </button>
              </div>
            </div>

            {isMarked && (
              <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-1.5">
                <span>⚠️</span> 
                <span>Attendance already marked for this date. Changes will dynamically update records.</span>
              </div>
            )}
          </div>

          {/* Responsive Register Table Container */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="w-full overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[600px] table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-[8%]">
                      #
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-[15%]">
                      Roll No
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-[45%]">
                      Student Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-[20%]">
                      Adm. No
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-[22%]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student, index) => (
                    <tr
                      key={student.studentId}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        student.status === "PRESENT"
                          ? "bg-green-50/30"
                          : student.status === "ABSENT"
                          ? "bg-red-50/30"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 text-sm text-gray-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-700">
                        {student.rollNumber || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-900 font-semibold truncate">
                        {student.name}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-gray-500">
                        {student.admissionNo || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {/* Two-State Pill Design (Perfect for mobile touch-targets) */}
                        <div className="inline-flex p-0.5 bg-gray-100 rounded-full border border-gray-200/60 shadow-inner">
                          <button
                            type="button"
                            onClick={() => setStudentStatus(student.studentId, "PRESENT")}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 ${
                              student.status === "PRESENT"
                                ? "bg-green-600 text-white shadow"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            P
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentStatus(student.studentId, "ABSENT")}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 ${
                              student.status === "ABSENT"
                                ? "bg-red-600 text-white shadow"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            A
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-5 flex justify-end">
            <button
              onClick={saveAttendance}
              disabled={saving || unmarkedCount > 0}
              className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-sm transition-all"
            >
              {saving
                ? "Saving..."
                : isMarked
                ? "Update Attendance"
                : "Save Attendance"}
            </button>
          </div>
        </>
      )}

      {/* Empty State */}
      {students.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12 text-center">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Select class, section & date, then click "Load Students" to start marking attendance
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
