

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

  // Toggle individual student status
  const toggleStatus = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentId === studentId) {
          if (s.status === null || s.status === "ABSENT") {
            return { ...s, status: "PRESENT" };
          } else {
            return { ...s, status: "ABSENT" };
          }
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
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📋 Mark Attendance</h1>
        <p className="text-gray-500 mt-1">Mark daily attendance class-wise</p>
      </div>

      {/* Filters Row */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {/* Academic Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Load Button */}
          <div>
            <button
              onClick={fetchAttendance}
              disabled={loading || !selectedClass || !selectedSection}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
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
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-4">
                <span className="text-sm">
                  Total: <strong>{students.length}</strong>
                </span>
                <span className="text-sm text-green-600">
                  Present: <strong>{presentCount}</strong>
                </span>
                <span className="text-sm text-red-600">
                  Absent: <strong>{absentCount}</strong>
                </span>
                {unmarkedCount > 0 && (
                  <span className="text-sm text-yellow-600">
                    Unmarked: <strong>{unmarkedCount}</strong>
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={markAllPresent}
                  className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200"
                >
                  All Present
                </button>
                <button
                  onClick={markAllAbsent}
                  className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
                >
                  All Absent
                </button>
              </div>
            </div>

            {isMarked && (
              <div className="mt-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                ⚠️ Attendance already marked for this date. Changes will update existing records.
              </div>
            )}
          </div>

          {/* Register Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase w-12">
                    #
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase w-20">
                    Roll No
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                    Student Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase w-28">
                    Adm. No
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase w-32">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr
                    key={student.studentId}
                    className={`border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                      student.status === "PRESENT"
                        ? "bg-green-50/50"
                        : student.status === "ABSENT"
                        ? "bg-red-50/50"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">
                      {student.rollNumber || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                      {student.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {student.admissionNo || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleStatus(student.studentId)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                          student.status === "PRESENT"
                            ? "bg-green-500 text-white shadow-sm"
                            : student.status === "ABSENT"
                            ? "bg-red-500 text-white shadow-sm"
                            : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                        }`}
                      >
                        {student.status === "PRESENT"
                          ? "P"
                          : student.status === "ABSENT"
                          ? "A"
                          : "—"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Save Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={saveAttendance}
              disabled={saving || unmarkedCount > 0}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm"
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
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-gray-500">
            Select class, section & date, then click "Load Students" to start marking attendance
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;

