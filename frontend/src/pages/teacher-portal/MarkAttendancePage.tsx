import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getFullUrl } from "../../utils/url";
import { FiUsers } from "react-icons/fi";

interface ClassItem { id: string; name: string; section?: string; }
interface Student { id: string; firstName: string; lastName: string; rollNumber?: string; }
interface AttendanceRecord { studentId: string; status: "present" | "absent" | "late"; }
interface AcademicYear { id: string; name: string; isCurrent?: boolean; isActive?: boolean; status?: string; }

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

export default function MarkAttendancePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [activeAcademicYearId, setActiveAcademicYearId] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [classLoading, setClassLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(getFullUrl("/api/class"), { headers: getAuthHeaders() }),
      axios.get(getFullUrl("/api/academic"), { headers: getAuthHeaders() }),
    ]).then(([classRes, yearRes]) => {
      const classData = classRes.data?.data?.data || classRes.data?.data || [];
      setClasses(Array.isArray(classData) ? classData : []);
      const yearData = yearRes.data?.data?.data || yearRes.data?.data || [];
      const years: AcademicYear[] = Array.isArray(yearData) ? yearData : [];
      setAcademicYears(years);
      const current = years.find((y) => y.isCurrent === true || y.isActive === true || y.status === "ACTIVE");
      if (current) setActiveAcademicYearId(current.id);
      else if (years.length > 0) setActiveAcademicYearId(years[0].id);
    }).catch(() => toast.error("Failed to load data")).finally(() => setClassLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    axios.get(getFullUrl("/api/students"), { headers: getAuthHeaders(), params: { classId: selectedClass } })
      .then((res) => {
        const rawData = res.data?.data?.data || res.data?.data || [];
        const studentList: Student[] = Array.isArray(rawData) ? rawData : [];
        setStudents(studentList);
        setRecords(studentList.map((s) => ({ studentId: normalizeId(s), status: "present" as const })));
      }).catch(() => toast.error("Failed to load students")).finally(() => setLoading(false));
  }, [selectedClass]);

  function updateStatus(studentId: string, status: "present" | "absent" | "late") {
    setRecords((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)));
  }

  async function handleSubmit() {
    if (!selectedClass || records.length === 0) { toast.error("Please select a class and mark attendance"); return; }
    if (!activeAcademicYearId) { toast.error("No active academic year found. Please contact administration."); return; }
    setSubmitting(true);
    try {
      await axios.post(getFullUrl("/api/attendance"), { classId: selectedClass, date: selectedDate, academicYearId: activeAcademicYearId, records }, { headers: getAuthHeaders() });
      toast.success("Attendance marked successfully!");
    } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to submit attendance"); }
    finally { setSubmitting(false); }
  }

  const statusColors: Record<string, string> = {
    present: "bg-green-100 text-green-700 border-green-300",
    absent: "bg-red-100 text-red-700 border-red-300",
    late: "bg-amber-100 text-amber-700 border-amber-300",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Mark Attendance</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
            {classLoading ? <div className="h-10 bg-gray-100 rounded-lg animate-pulse" /> : (
              <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="">-- Select Class --</option>
                {classes.map((cls) => (<option key={normalizeId(cls)} value={normalizeId(cls)}>{cls.name} {cls.section ? `(${cls.section})` : ""}</option>))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? <Spinner /> : students.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">{students.length} student{students.length !== 1 ? "s" : ""}</p>
            <div className="flex gap-2">
              <button onClick={() => setRecords(records.map((r) => ({ ...r, status: "present" })))} className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">All Present</button>
              <button onClick={() => setRecords(records.map((r) => ({ ...r, status: "absent" })))} className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100">All Absent</button>
            </div>
          </div>
          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {students.map((student) => {
              const sid = normalizeId(student);
              const record = records.find((r) => r.studentId === sid);
              return (
                <div key={sid} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">{student.firstName?.[0] || "S"}</div>
                    <div><p className="text-sm font-medium text-gray-800">{student.firstName} {student.lastName}</p>{student.rollNumber && <p className="text-xs text-gray-500">Roll: {student.rollNumber}</p>}</div>
                  </div>
                  <div className="flex gap-1.5">
                    {(["present", "absent", "late"] as const).map((status) => (
                      <button key={status} onClick={() => updateStatus(sid, status)} className={`text-xs px-3 py-1.5 rounded-lg border font-medium capitalize transition-all ${record?.status === status ? statusColors[status] : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"}`}>{status}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
            <button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{submitting ? "Submitting..." : "Submit Attendance"}</button>
          </div>
        </div>
      ) : selectedClass ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200"><FiUsers className="mx-auto text-4xl mb-3 text-gray-300" /><p>No students found in this class.</p></div>
      ) : null}
    </div>
  );
}
