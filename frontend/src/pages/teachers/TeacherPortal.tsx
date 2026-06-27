import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";
import {
  FiHome,
  FiBook,
  FiCheckSquare,
  FiEdit3,
  FiUsers,
  FiCalendar,
  FiFileText,
  FiDollarSign,
  FiUser,
  FiMenu,
  FiX,
  FiSearch,
  FiBell,
  FiClock,
  FiChevronDown,
  FiCheck,
  FiAlertCircle,
  FiLogOut,
  FiShield,
  FiClipboard,
} from "react-icons/fi";

const API = `${API_BASE_URL}/api`;

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

interface ClassItem {
  _id: string;
  name: string;
  section?: string;
  students?: string[];
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  rollNumber?: string;
  phone?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  classId?: string;
  className?: string;
  email?: string;
}

interface Exam {
  _id: string;
  name: string;
  classId?: string;
  subjects?: { subjectId: string; subjectName: string; maxMarks: number }[];
}

interface AttendanceRecord {
  studentId: string;
  status: "present" | "absent" | "late";
}

interface MarkRecord {
  studentId: string;
  marks: number;
}

interface TeacherPortalProps {
  isPrincipal?: boolean;
}

// ─────────────────────────────────────────────────────────
// Utility: Auth Headers
// ─────────────────────────────────────────────────────────

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// Sidebar Component
// ─────────────────────────────────────────────────────────

type SectionId =
  | "dashboard"
  | "classes"
  | "attendance"
  | "marks"
  | "students"
  | "timetable"
  | "leave"
  | "salary"
  | "profile"
  | "approve-leave"
  | "reports";

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  principalOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: FiHome },
  { id: "classes", label: "My Classes", icon: FiBook },
  { id: "attendance", label: "Mark Attendance", icon: FiCheckSquare },
  { id: "marks", label: "Enter Marks", icon: FiEdit3 },
  { id: "students", label: "Student Records", icon: FiUsers },
  { id: "timetable", label: "Timetable", icon: FiCalendar },
  { id: "leave", label: "My Leave", icon: FiFileText },
  { id: "salary", label: "My Salary/Payslip", icon: FiDollarSign },
  { id: "profile", label: "Profile", icon: FiUser },
  { id: "approve-leave", label: "Approve Leave", icon: FiShield, principalOnly: true },
  { id: "reports", label: "View Reports", icon: FiClipboard, principalOnly: true },
];

function Sidebar({
  activeSection,
  onNavigate,
  isOpen,
  onClose,
  isPrincipal,
  user,
}: {
  activeSection: SectionId;
  onNavigate: (id: SectionId) => void;
  isOpen: boolean;
  onClose: () => void;
  isPrincipal: boolean;
  user: User | null;
}) {
  const filteredItems = navItems.filter(
    (item) => !item.principalOnly || isPrincipal
  );

  return (
    <>
      {/* Overlay on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <FiBook className="text-white text-sm" />
            </div>
            <span className="font-bold text-gray-800 text-sm">
              {isPrincipal ? "Principal Portal" : "Teacher Portal"}
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700">
            <FiX size={20} />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
              <FiUser className="text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user?.name || "Teacher"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {isPrincipal ? "Principal" : "Teacher"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`text-lg ${isActive ? "text-indigo-600" : "text-gray-400"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="px-3 py-4 border-t border-gray-200">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("tenant");
              window.location.href = "/";
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <FiLogOut className="text-lg" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Loading Spinner
// ─────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Dashboard Section
// ─────────────────────────────────────────────────────────

function DashboardSection({ user, isPrincipal }: { user: User | null; isPrincipal: boolean }) {
  const [stats, setStats] = useState({ todayClasses: 0, totalStudents: 0, pendingAttendance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [classRes, studentRes] = await Promise.all([
          axios.get(`${API}/class`, { headers: getAuthHeaders() }),
          axios.get(`${API}/students`, { headers: getAuthHeaders() }),
        ]);
        const classes = classRes.data?.data || classRes.data || [];
        const students = studentRes.data?.data || studentRes.data || [];
        setStats({
          todayClasses: Array.isArray(classes) ? classes.length : 0,
          totalStudents: Array.isArray(students) ? students.length : 0,
          pendingAttendance: Array.isArray(classes) ? classes.length : 0,
        });
      } catch {
        // silently fail — show zeros
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <Spinner />;

  const statCards = [
    { label: "Today's Classes", value: stats.todayClasses, color: "bg-blue-500", icon: FiBook },
    { label: "Total Students", value: stats.totalStudents, color: "bg-green-500", icon: FiUsers },
    { label: "Pending Attendance", value: stats.pendingAttendance, color: "bg-amber-500", icon: FiClock },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">
          Welcome back, {user?.name || "Teacher"}! 👋
        </h2>
        <p className="mt-1 text-indigo-100">
          {isPrincipal
            ? "Manage your school from here. All reports and approvals at your fingertips."
            : "Here's what's happening in your classes today."}
        </p>
      </div>

      {/* Stats grid */}
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

      {/* Today's Schedule (placeholder) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Schedule</h3>
        <div className="space-y-3">
          {[
            { time: "9:00 AM", subject: "Mathematics", class: "Class 10-A" },
            { time: "10:30 AM", subject: "Physics", class: "Class 11-B" },
            { time: "12:00 PM", subject: "Mathematics", class: "Class 9-A" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FiClock className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{item.subject}</p>
                <p className="text-xs text-gray-500">{item.class}</p>
              </div>
              <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Notifications</h3>
        <div className="space-y-3">
          {[
            { msg: "Staff meeting scheduled for tomorrow at 3 PM", time: "2h ago" },
            { msg: "Exam schedule updated for Class 10", time: "5h ago" },
            { msg: "Parent-teacher meeting next Monday", time: "1d ago" },
          ].map((n, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <FiBell className="text-indigo-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-700">{n.msg}</p>
                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// My Classes Section
// ─────────────────────────────────────────────────────────

function ClassesSection() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/class`, { headers: getAuthHeaders() })
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setClasses(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error("Failed to load classes"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">My Classes</h2>
      {classes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FiBook className="mx-auto text-4xl mb-3 text-gray-300" />
          <p>No classes assigned yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FiBook className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{cls.name}</h3>
                  {cls.section && <p className="text-xs text-gray-500">Section {cls.section}</p>}
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {cls.students?.length || 0} students
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Mark Attendance Section
// ─────────────────────────────────────────────────────────

function AttendanceSection() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [classLoading, setClassLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/class`, { headers: getAuthHeaders() })
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setClasses(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error("Failed to load classes"))
      .finally(() => setClassLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    axios
      .get(`${API}/students`, {
        headers: getAuthHeaders(),
        params: { classId: selectedClass },
      })
      .then((res) => {
        const data = res.data?.data || res.data || [];
        const studentList = Array.isArray(data) ? data : [];
        setStudents(studentList);
        setRecords(
          studentList.map((s: Student) => ({ studentId: s._id, status: "present" as const }))
        );
      })
      .catch(() => toast.error("Failed to load students"))
      .finally(() => setLoading(false));
  }, [selectedClass]);

  function updateStatus(studentId: string, status: "present" | "absent" | "late") {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  }

  async function handleSubmit() {
    if (!selectedClass || records.length === 0) {
      toast.error("Please select a class and mark attendance");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(
        `${API}/attendance`,
        {
          classId: selectedClass,
          date: selectedDate,
          academicYearId: "current",
          records,
        },
        { headers: getAuthHeaders() }
      );
      toast.success("Attendance marked successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit attendance");
    } finally {
      setSubmitting(false);
    }
  }

  const statusColors = {
    present: "bg-green-100 text-green-700 border-green-300",
    absent: "bg-red-100 text-red-700 border-red-300",
    late: "bg-amber-100 text-amber-700 border-amber-300",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Mark Attendance</h2>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
            {classLoading ? (
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <select
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">-- Select Class --</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name} {cls.section ? `(${cls.section})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Student list */}
      {loading ? (
        <Spinner />
      ) : students.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              {students.length} student{students.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setRecords(records.map((r) => ({ ...r, status: "present" })))}
                className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
              >
                All Present
              </button>
              <button
                onClick={() => setRecords(records.map((r) => ({ ...r, status: "absent" })))}
                className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
              >
                All Absent
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {students.map((student) => {
              const record = records.find((r) => r.studentId === student._id);
              return (
                <div key={student._id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">
                      {student.firstName?.[0] || "S"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {student.firstName} {student.lastName}
                      </p>
                      {student.rollNumber && (
                        <p className="text-xs text-gray-500">Roll: {student.rollNumber}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {(["present", "absent", "late"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateStatus(student._id, status)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium capitalize transition-all ${
                          record?.status === status
                            ? statusColors[status]
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit button */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Attendance"}
            </button>
          </div>
        </div>
      ) : selectedClass ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
          <FiUsers className="mx-auto text-4xl mb-3 text-gray-300" />
          <p>No students found in this class.</p>
        </div>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Enter Marks Section
// ─────────────────────────────────────────────────────────

function MarksSection() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/class`, { headers: getAuthHeaders() }),
      axios.get(`${API}/exam`, { headers: getAuthHeaders() }),
    ])
      .then(([classRes, examRes]) => {
        const classData = classRes.data?.data || classRes.data || [];
        const examData = examRes.data?.data || examRes.data || [];
        setClasses(Array.isArray(classData) ? classData : []);
        setExams(Array.isArray(examData) ? examData : []);
      })
      .catch(() => toast.error("Failed to load data"));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    axios
      .get(`${API}/students`, {
        headers: getAuthHeaders(),
        params: { classId: selectedClass },
      })
      .then((res) => {
        const data = res.data?.data || res.data || [];
        const studentList = Array.isArray(data) ? data : [];
        setStudents(studentList);
        const initial: Record<string, number> = {};
        studentList.forEach((s: Student) => { initial[s._id] = 0; });
        setMarks(initial);
      })
      .catch(() => toast.error("Failed to load students"))
      .finally(() => setLoading(false));
  }, [selectedClass]);

  const selectedExamObj = useMemo(
    () => exams.find((e) => e._id === selectedExam),
    [exams, selectedExam]
  );

  async function handleSubmit() {
    if (!selectedClass || !selectedExam || !selectedSubject) {
      toast.error("Please select class, exam, and subject");
      return;
    }
    setSubmitting(true);
    try {
      const records: MarkRecord[] = Object.entries(marks).map(([studentId, m]) => ({
        studentId,
        marks: m,
      }));
      await axios.post(
        `${API}/exam/marks`,
        {
          examId: selectedExam,
          classId: selectedClass,
          subjectId: selectedSubject,
          marks: records,
        },
        { headers: getAuthHeaders() }
      );
      toast.success("Marks submitted successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit marks");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Enter Marks</h2>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
            <select
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">-- Select Class --</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} {cls.section ? `(${cls.section})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam</label>
            <select
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
            >
              <option value="">-- Select Exam --</option>
              {exams.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Subject</label>
            <select
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">-- Select Subject --</option>
              {selectedExamObj?.subjects?.map((sub) => (
                <option key={sub.subjectId} value={sub.subjectId}>
                  {sub.subjectName} (Max: {sub.maxMarks})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Marks entry */}
      {loading ? (
        <Spinner />
      ) : students.length > 0 && selectedSubject ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-700">
              Enter marks for {students.length} student{students.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {students.map((student) => (
              <div key={student._id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">
                    {student.firstName?.[0] || "S"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {student.firstName} {student.lastName}
                    </p>
                    {student.rollNumber && (
                      <p className="text-xs text-gray-500">Roll: {student.rollNumber}</p>
                    )}
                  </div>
                </div>
                <input
                  type="number"
                  min={0}
                  max={selectedExamObj?.subjects?.find((s) => s.subjectId === selectedSubject)?.maxMarks || 100}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={marks[student._id] ?? 0}
                  onChange={(e) =>
                    setMarks((prev) => ({ ...prev, [student._id]: Number(e.target.value) }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Marks"}
            </button>
          </div>
        </div>
      ) : selectedClass && selectedExam && selectedSubject ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
          <FiUsers className="mx-auto text-4xl mb-3 text-gray-300" />
          <p>No students found in this class.</p>
        </div>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Student Records Section
// ─────────────────────────────────────────────────────────

function StudentRecordsSection() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({ phone: "", address: "", guardianName: "", guardianPhone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios
      .get(`${API}/class`, { headers: getAuthHeaders() })
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setClasses(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error("Failed to load classes"));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    axios
      .get(`${API}/students`, {
        headers: getAuthHeaders(),
        params: { classId: selectedClass },
      })
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setStudents(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error("Failed to load students"))
      .finally(() => setLoading(false));
  }, [selectedClass]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const lower = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.firstName?.toLowerCase().includes(lower) ||
        s.lastName?.toLowerCase().includes(lower) ||
        s.rollNumber?.toLowerCase().includes(lower)
    );
  }, [students, searchTerm]);

  function openEdit(student: Student) {
    setEditingStudent(student);
    setEditForm({
      phone: student.phone || "",
      address: student.address || "",
      guardianName: student.guardianName || "",
      guardianPhone: student.guardianPhone || "",
    });
  }

  async function saveEdit() {
    if (!editingStudent) return;
    setSaving(true);
    try {
      await axios.put(
        `${API}/students/${editingStudent._id}`,
        editForm,
        { headers: getAuthHeaders() }
      );
      toast.success("Student updated successfully!");
      setStudents((prev) =>
        prev.map((s) => (s._id === editingStudent._id ? { ...s, ...editForm } : s))
      );
      setEditingStudent(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update student");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Student Records</h2>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Class</label>
            <select
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">-- All Classes --</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} {cls.section ? `(${cls.section})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or roll number..."
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Student list */}
      {loading ? (
        <Spinner />
      ) : filteredStudents.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 hidden sm:table-cell">Roll No</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">Phone</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 hidden lg:table-cell">Guardian</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">
                          {student.firstName?.[0] || "S"}
                        </div>
                        <span className="font-medium text-gray-800">
                          {student.firstName} {student.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600 hidden sm:table-cell">
                      {student.rollNumber || "-"}
                    </td>
                    <td className="px-5 py-3 text-gray-600 hidden md:table-cell">
                      {student.phone || "-"}
                    </td>
                    <td className="px-5 py-3 text-gray-600 hidden lg:table-cell">
                      {student.guardianName || "-"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => openEdit(student)}
                        className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedClass ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
          <FiUsers className="mx-auto text-4xl mb-3 text-gray-300" />
          <p>No students found.</p>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
          <FiSearch className="mx-auto text-4xl mb-3 text-gray-300" />
          <p>Select a class to view students.</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Edit Student: {editingStudent.firstName} {editingStudent.lastName}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={2}
                  value={editForm.address}
                  onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={editForm.guardianName}
                  onChange={(e) => setEditForm((p) => ({ ...p, guardianName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Phone</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={editForm.guardianPhone}
                  onChange={(e) => setEditForm((p) => ({ ...p, guardianPhone: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Timetable Section
// ─────────────────────────────────────────────────────────

function TimetableSection() {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const periods = [
    { time: "9:00 - 9:45", label: "Period 1" },
    { time: "9:45 - 10:30", label: "Period 2" },
    { time: "10:45 - 11:30", label: "Period 3" },
    { time: "11:30 - 12:15", label: "Period 4" },
    { time: "1:00 - 1:45", label: "Period 5" },
    { time: "1:45 - 2:30", label: "Period 6" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Timetable</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                {days.map((day) => (
                  <th key={day} className="text-center px-4 py-3 font-medium text-gray-600">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {periods.map((period, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{period.label}</p>
                    <p className="text-xs text-gray-500">{period.time}</p>
                  </td>
                  {days.map((day) => (
                    <td key={day} className="px-4 py-3 text-center">
                      <span className="text-xs text-gray-400">-</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500">
            <FiAlertCircle className="inline mr-1" />
            Timetable data will be populated when configured by administration.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Leave Section
// ─────────────────────────────────────────────────────────

function LeaveSection() {
  const [leaves] = useState([
    { id: "1", type: "Casual Leave", from: "2025-01-10", to: "2025-01-11", status: "approved", reason: "Family function" },
    { id: "2", type: "Sick Leave", from: "2025-02-05", to: "2025-02-06", status: "pending", reason: "Fever" },
  ]);

  const statusBadge = {
    approved: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">My Leave</h2>
        <button className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
          Apply Leave
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {leaves.map((leave) => (
            <div key={leave.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800">{leave.type}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      statusBadge[leave.status as keyof typeof statusBadge]
                    }`}
                  >
                    {leave.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {leave.from} to {leave.to} • {leave.reason}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Salary Section
// ─────────────────────────────────────────────────────────

function SalarySection() {
  const payslips = [
    { month: "June 2025", basic: 45000, allowances: 12000, deductions: 5000, net: 52000 },
    { month: "May 2025", basic: 45000, allowances: 12000, deductions: 5000, net: 52000 },
    { month: "April 2025", basic: 45000, allowances: 12000, deductions: 5000, net: 52000 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">My Salary & Payslips</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Basic Salary</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">₹45,000</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Allowances</p>
          <p className="text-2xl font-bold text-green-600 mt-1">₹12,000</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Net Pay</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">₹52,000</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Recent Payslips</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {payslips.map((slip, i) => (
            <div key={i} className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{slip.month}</p>
                <p className="text-xs text-gray-500">
                  Basic: ₹{slip.basic.toLocaleString()} | Allowances: ₹{slip.allowances.toLocaleString()} | Ded: ₹{slip.deductions.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-indigo-600">₹{slip.net.toLocaleString()}</p>
                <button className="text-xs text-indigo-500 hover:underline mt-1">Download</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Profile Section
// ─────────────────────────────────────────────────────────

function ProfileSection({ user }: { user: User | null }) {
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleChangePassword() {
    if (!passwords.current || !passwords.newPass) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      toast.error("New passwords don't match");
      return;
    }
    if (passwords.newPass.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    try {
      await axios.put(
        `${API}/auth/change-password`,
        { currentPassword: passwords.current, newPassword: passwords.newPass },
        { headers: getAuthHeaders() }
      );
      toast.success("Password changed successfully!");
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">My Profile</h2>

      {/* Profile info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.[0] || "T"}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{user?.name || "Teacher"}</h3>
            <p className="text-sm text-gray-500">{user?.email || "teacher@school.com"}</p>
            <span className="inline-block mt-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium capitalize">
              {user?.role || "teacher"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
            <p className="text-sm font-medium text-gray-800 mt-1">{user?.name || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
            <p className="text-sm font-medium text-gray-800 mt-1">{user?.email || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Role</p>
            <p className="text-sm font-medium text-gray-800 mt-1 capitalize">{user?.role || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">User ID</p>
            <p className="text-sm font-medium text-gray-800 mt-1 font-mono text-xs">{user?.id || "-"}</p>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={passwords.current}
              onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={passwords.newPass}
              onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {changingPassword ? "Changing..." : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Approve Leave Section (Principal Only)
// ─────────────────────────────────────────────────────────

function ApproveLeaveSection() {
  const pendingLeaves = [
    { id: "1", teacher: "Priya Sharma", type: "Casual Leave", from: "2025-06-20", to: "2025-06-21", reason: "Personal work" },
    { id: "2", teacher: "Rahul Kumar", type: "Sick Leave", from: "2025-06-25", to: "2025-06-26", reason: "Medical appointment" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Approve Leave Requests</h2>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {pendingLeaves.map((leave) => (
            <div key={leave.id} className="px-5 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{leave.teacher}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {leave.type} • {leave.from} to {leave.to}
                  </p>
                  <p className="text-xs text-gray-500">Reason: {leave.reason}</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium border border-green-200">
                    Approve
                  </button>
                  <button className="px-4 py-2 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium border border-red-200">
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Reports Section (Principal Only)
// ─────────────────────────────────────────────────────────

function ReportsSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">School Reports</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: "Attendance Report", desc: "Class-wise attendance summary", icon: FiCheckSquare },
          { title: "Exam Results", desc: "Performance analytics across classes", icon: FiEdit3 },
          { title: "Teacher Performance", desc: "Attendance & workload tracking", icon: FiUsers },
          { title: "Fee Collection", desc: "Monthly fee collection status", icon: FiDollarSign },
        ].map((report, i) => {
          const Icon = report.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Icon className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{report.title}</h3>
                  <p className="text-xs text-gray-500">{report.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <FiClipboard className="mx-auto text-4xl text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm">Select a report type above to generate detailed analytics.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main TeacherPortal Component
// ─────────────────────────────────────────────────────────

export default function TeacherPortal({ isPrincipal = false }: TeacherPortalProps) {
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useMemo(() => getCurrentUser(), []);

  function renderSection() {
    switch (activeSection) {
      case "dashboard":
        return <DashboardSection user={user} isPrincipal={isPrincipal} />;
      case "classes":
        return <ClassesSection />;
      case "attendance":
        return <AttendanceSection />;
      case "marks":
        return <MarksSection />;
      case "students":
        return <StudentRecordsSection />;
      case "timetable":
        return <TimetableSection />;
      case "leave":
        return <LeaveSection />;
      case "salary":
        return <SalarySection />;
      case "profile":
        return <ProfileSection user={user} />;
      case "approve-leave":
        return isPrincipal ? <ApproveLeaveSection /> : <DashboardSection user={user} isPrincipal={isPrincipal} />;
      case "reports":
        return isPrincipal ? <ReportsSection /> : <DashboardSection user={user} isPrincipal={isPrincipal} />;
      default:
        return <DashboardSection user={user} isPrincipal={isPrincipal} />;
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isPrincipal={isPrincipal}
        user={user}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <FiMenu size={20} />
            </button>
            <h1 className="text-lg font-bold text-gray-800 hidden sm:block">
              {navItems.find((n) => n.id === activeSection)?.label || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <FiBell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("tenant");
                window.location.href = "/";
              }}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <FiLogOut size={18} />
            </button>
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <FiUser className="text-indigo-600 text-sm" />
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
