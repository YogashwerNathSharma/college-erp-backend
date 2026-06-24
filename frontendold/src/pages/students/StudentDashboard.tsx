
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  FiHome,
  FiUser,
  FiBook,
  FiSun,
  FiCheckCircle,
  FiFileText,
  FiAward,
  FiDollarSign,
  FiCalendar,
  FiBookOpen,
  FiSettings,
  FiSearch,
  FiBell,
  FiClock,
  FiMapPin,
  FiTrendingUp,
  FiPercent,
  FiAlertCircle,
  FiChevronDown,
  FiChevronRight,
  FiDownload,
  FiLogOut,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  bloodGroup: string;
  address: string;
  photoUrl: string;
  admissionNo: string;
  rollNumber: string;
  className: string;
  sectionName: string;
  academicYear: string;
  fatherName: string;
  motherName: string;
  fatherPhone: string;
  motherPhone: string;
  guardianName: string;
  guardianPhone: string;
}

interface DashboardData {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string;
    rollNumber: string;
    className: string;
    sectionName: string;
    academicYear: string;
  };
  overview: {
    totalSubjects: number;
    attendancePercentage: number;
    pendingInstallments: number;
    pendingFees: number;
    totalFees: number;
    paidFees: number;
    todayClasses: number;
  };
  upcomingExams: Array<{
    id: string;
    name: string;
    type: string;
    startDate: string;
    endDate: string;
  }>;
}

interface TimetableEntry {
  id: string;
  period: number;
  subject: string;
  teacher: string;
  day: string;
}

interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  percentage: number;
  monthlyBreakdown: Array<{
    month: string;
    present: number;
    absent: number;
    total: number;
    percentage: number;
  }>;
}

interface FeeSummary {
  totalAmount: number;
  totalPaid: number;
  totalBalance: number;
  totalDiscount: number;
  totalFine: number;
  installmentStats: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    partial: number;
  };
  nextDue: {
    installmentNo: number;
    amount: number;
    dueDate: string;
    status: string;
  } | null;
}

interface FeeDetail {
  id: string;
  installmentNo: number;
  structureName: string;
  totalAmount: number;
  discountAmount: number;
  fineAmount: number;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  status: string;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    reference: string;
    receiptNo: string;
    paymentDate: string;
  }>;
}

interface ExamData {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  schedule: Array<{
    subject: string;
    date: string;
    startTime: string;
    endTime: string;
    room: string;
  }>;
}

interface MarksData {
  examId: string;
  examName: string;
  examType: string;
  examDate: string;
  marks: Array<{
    subject: string;
    marksObtained: number;
    isAbsent: boolean;
  }>;
  summary: {
    totalMarks: number;
    totalMaxMarks: number;
    percentage: number;
    grade: string;
    rank: number;
    division: string;
    status: string;
  } | null;
}

interface SubjectData {
  id: string;
  name: string;
  periodsPerWeek: number;
  teachers: Array<{
    id: string;
    name: string;
    photoUrl: string;
  }>;
}

interface LibraryData {
  isMember: boolean;
  membershipId: string | null;
  issuedBooks: Array<{
    id: string;
    book: { id: string; title: string; author: string; isbn: string };
    issueDate: string;
    dueDate: string;
    returnDate: string | null;
    status: string;
    fineAmount: number;
  }>;
  stats: {
    totalIssued: number;
    currentlyIssued: number;
    returned: number;
    overdue: number;
  };
}

// ─────────────────────────────────────────────────────────────────
// Sidebar Navigation Items
// ─────────────────────────────────────────────────────────────────

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome },
  { id: 'profile', label: 'Profile', icon: FiUser },
  { id: 'subjects', label: 'Subjects', icon: FiBook },
  { id: 'timetable', label: 'Timetable', icon: FiCalendar },
  { id: 'attendance', label: 'Attendance', icon: FiCheckCircle },
  { id: 'exams', label: 'Exams', icon: FiFileText },
  { id: 'marks', label: 'Marks & Results', icon: FiAward },
  { id: 'fees', label: 'Fees', icon: FiDollarSign },
  { id: 'library', label: 'Library', icon: FiBookOpen },
];

// ─────────────────────────────────────────────────────────────────
// Sidebar Component
// ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  activeItem: string;
  onItemClick: (id: string) => void;
  student: DashboardData['student'] | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onItemClick, student }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    navigate('/');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#1a237e] text-white flex flex-col z-50">
      {/* Logo Section */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <FiBookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">EduERP</h1>
            <p className="text-xs text-blue-200 opacity-80">Student Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = item.id === activeItem;
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg shadow-blue-900/30'
                      : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-200/60'}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-blue-300 rounded-full animate-pulse" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden">
            {student?.photoUrl ? (
              <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              student?.firstName?.charAt(0) || 'S'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {student ? `${student.firstName} ${student.lastName}` : 'Student'}
            </p>
            <p className="text-[10px] text-blue-200 truncate">
              {student?.className} - {student?.sectionName}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-200 hover:bg-red-500/20 rounded-lg transition-colors"
        >
          <FiLogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────

const StudentDashboard: React.FC = () => {
  const [activeNavItem, setActiveNavItem] = useState<string>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [timetable, setTimetable] = useState<Record<string, TimetableEntry[]> | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [feeDetails, setFeeDetails] = useState<FeeDetail[]>([]);
  const [exams, setExams] = useState<ExamData[]>([]);
  const [marks, setMarks] = useState<MarksData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [library, setLibrary] = useState<LibraryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sectionLoading, setSectionLoading] = useState<boolean>(false);

  // ─────────────────────────────────────────
  // Greeting
  // ─────────────────────────────────────────

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // ─────────────────────────────────────────
  // Fetch Dashboard Data
  // ─────────────────────────────────────────

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/student-portal/dashboard');
        setDashboardData(res.data.data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // ─────────────────────────────────────────
  // Fetch section-specific data
  // ─────────────────────────────────────────

  useEffect(() => {
    const fetchSectionData = async () => {
      if (activeNavItem === 'dashboard') return;

      setSectionLoading(true);
      try {
        switch (activeNavItem) {
          case 'profile':
            if (!profile) {
              const res = await axios.get('/api/student-portal/me');
              setProfile(res.data.data);
            }
            break;

          case 'timetable':
            if (!timetable) {
              const res = await axios.get('/api/student-portal/timetable');
              setTimetable(res.data.data.timetable);
            }
            break;

          case 'attendance':
            if (!attendanceSummary) {
              const res = await axios.get('/api/student-portal/attendance/summary');
              setAttendanceSummary(res.data.data);
            }
            break;

          case 'fees':
            if (!feeSummary) {
              const [summaryRes, detailsRes] = await Promise.all([
                axios.get('/api/student-portal/fees/summary'),
                axios.get('/api/student-portal/fees/details'),
              ]);
              setFeeSummary(summaryRes.data.data);
              setFeeDetails(detailsRes.data.data);
            }
            break;

          case 'exams':
            if (exams.length === 0) {
              const res = await axios.get('/api/student-portal/exams');
              setExams(res.data.data);
            }
            break;

          case 'marks':
            if (marks.length === 0) {
              const res = await axios.get('/api/student-portal/marks');
              setMarks(res.data.data);
            }
            break;

          case 'subjects':
            if (subjects.length === 0) {
              const res = await axios.get('/api/student-portal/subjects');
              setSubjects(res.data.data);
            }
            break;

          case 'library':
            if (!library) {
              const res = await axios.get('/api/student-portal/library');
              setLibrary(res.data.data);
            }
            break;
        }
      } catch (error) {
        console.error(`Error fetching ${activeNavItem} data:`, error);
      } finally {
        setSectionLoading(false);
      }
    };
    fetchSectionData();
  }, [activeNavItem]);

  // ─────────────────────────────────────────
  // Loading skeleton
  // ─────────────────────────────────────────

  const LoadingSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 bg-gray-200 rounded-2xl" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  );

  // ─────────────────────────────────────────
  // RENDER: Dashboard Section
  // ─────────────────────────────────────────

  const renderDashboard = () => {
    if (loading || !dashboardData) return <LoadingSkeleton />;

    const { student, overview, upcomingExams } = dashboardData;

    return (
      <div className="space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {greeting}, {student.firstName}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {student.className} - {student.sectionName} | {student.academicYear}
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Attendance */}
          <div className="bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium mb-1">Attendance</p>
                <p className="text-3xl font-bold">{overview.attendancePercentage}%</p>
                <p className="text-green-100 text-[10px] mt-1">
                  {overview.attendancePercentage >= 75 ? '✓ Good Standing' : '⚠ Below 75%'}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FiCheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Subjects */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium mb-1">Subjects</p>
                <p className="text-3xl font-bold">{overview.totalSubjects}</p>
                <p className="text-blue-100 text-[10px] mt-1">Enrolled Courses</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FiBook className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Today's Classes */}
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs font-medium mb-1">Today</p>
                <p className="text-3xl font-bold">{overview.todayClasses}</p>
                <p className="text-orange-100 text-[10px] mt-1">Classes Today</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FiClock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Pending Fees */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs font-medium mb-1">Fees Due</p>
                <p className="text-3xl font-bold">₹{overview.pendingFees.toLocaleString()}</p>
                <p className="text-purple-100 text-[10px] mt-1">
                  {overview.pendingInstallments} installment(s) pending
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FiDollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Exams */}
        {upcomingExams.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiFileText className="w-5 h-5 text-indigo-500" />
              Upcoming Exams
            </h3>
            <div className="space-y-3">
              {upcomingExams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{exam.name}</p>
                    <p className="text-xs text-gray-500">{exam.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-indigo-600">
                      {new Date(exam.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                    {exam.endDate && (
                      <p className="text-xs text-gray-400">
                        to {new Date(exam.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────
  // RENDER: Profile Section
  // ─────────────────────────────────────────

  const renderProfile = () => {
    if (sectionLoading || !profile) return <LoadingSkeleton />;

    const InfoRow = ({ label, value }: { label: string; value: string | undefined | null }) => (
      <div className="flex justify-between py-2 border-b border-gray-50">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-sm font-medium text-gray-800">{value || '—'}</span>
      </div>
    );

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800">My Profile</h2>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                profile.firstName.charAt(0)
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{profile.fullName}</h3>
              <p className="text-sm text-gray-500">
                {profile.className} - {profile.sectionName} | Roll: {profile.rollNumber}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Admission No: {profile.admissionNo} | {profile.academicYear}
              </p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Personal Information</h4>
            <InfoRow label="Email" value={profile.email} />
            <InfoRow label="Phone" value={profile.phone} />
            <InfoRow label="Gender" value={profile.gender} />
            <InfoRow label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString('en-IN') : undefined} />
            <InfoRow label="Blood Group" value={profile.bloodGroup} />
            <InfoRow label="Address" value={profile.address} />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Parent / Guardian</h4>
            <InfoRow label="Father's Name" value={profile.fatherName} />
            <InfoRow label="Father's Phone" value={profile.fatherPhone} />
            <InfoRow label="Mother's Name" value={profile.motherName} />
            <InfoRow label="Mother's Phone" value={profile.motherPhone} />
            <InfoRow label="Guardian Name" value={profile.guardianName} />
            <InfoRow label="Guardian Phone" value={profile.guardianPhone} />
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────
  // RENDER: Timetable Section
  // ─────────────────────────────────────────

  const renderTimetable = () => {
    if (sectionLoading || !timetable) return <LoadingSkeleton />;

    const dayOrder = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayLabels: Record<string, string> = {
      MON: 'Monday',
      TUE: 'Tuesday',
      WED: 'Wednesday',
      THU: 'Thursday',
      FRI: 'Friday',
      SAT: 'Saturday',
    };

    const colors = [
      'from-blue-500 to-indigo-500',
      'from-emerald-500 to-teal-500',
      'from-purple-500 to-pink-500',
      'from-amber-500 to-orange-500',
      'from-cyan-500 to-blue-500',
      'from-rose-500 to-red-500',
    ];

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800">My Timetable</h2>

        <div className="space-y-4">
          {dayOrder.map((day, dayIndex) => {
            const entries = timetable[day] || [];
            if (entries.length === 0) return null;

            return (
              <div key={day} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  {dayLabels[day]}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {entries
                    .sort((a, b) => a.period - b.period)
                    .map((entry, i) => (
                      <div
                        key={entry.id}
                        className={`bg-gradient-to-br ${colors[i % colors.length]} rounded-xl p-3 text-white`}
                      >
                        <p className="text-[10px] opacity-80 font-medium">Period {entry.period}</p>
                        <p className="text-sm font-semibold mt-1 truncate">{entry.subject}</p>
                        <p className="text-[11px] opacity-80 mt-1 flex items-center gap-1">
                          <FiUser className="w-3 h-3" />
                          {entry.teacher}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────
  // RENDER: Attendance Section
  // ─────────────────────────────────────────

  const renderAttendance = () => {
    if (sectionLoading || !attendanceSummary) return <LoadingSkeleton />;

    const { totalDays, presentDays, absentDays, percentage, monthlyBreakdown } = attendanceSummary;

    const getProgressColor = (pct: number) => {
      if (pct >= 90) return 'bg-emerald-500';
      if (pct >= 75) return 'bg-blue-500';
      if (pct >= 60) return 'bg-amber-500';
      return 'bg-red-500';
    };

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800">My Attendance</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <p className="text-3xl font-bold text-indigo-600">{percentage}%</p>
            <p className="text-xs text-gray-500 mt-1">Overall</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <p className="text-3xl font-bold text-emerald-600">{presentDays}</p>
            <p className="text-xs text-gray-500 mt-1">Present</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <p className="text-3xl font-bold text-red-500">{absentDays}</p>
            <p className="text-xs text-gray-500 mt-1">Absent</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <p className="text-3xl font-bold text-gray-700">{totalDays}</p>
            <p className="text-xs text-gray-500 mt-1">Total Days</p>
          </div>
        </div>

        {/* Monthly Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Monthly Breakdown</h3>
          <div className="space-y-3">
            {monthlyBreakdown.map((m) => (
              <div key={m.month} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-24 flex-shrink-0">{m.month}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full ${getProgressColor(m.percentage)} transition-all duration-500`}
                    style={{ width: `${m.percentage}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                    {m.present}/{m.total} ({m.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────
  // RENDER: Fees Section
  // ─────────────────────────────────────────

  const renderFees = () => {
    if (sectionLoading || !feeSummary) return <LoadingSkeleton />;

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'PAID': return 'bg-emerald-100 text-emerald-700';
        case 'PENDING': return 'bg-amber-100 text-amber-700';
        case 'OVERDUE': return 'bg-red-100 text-red-700';
        case 'PARTIAL': return 'bg-blue-100 text-blue-700';
        default: return 'bg-gray-100 text-gray-700';
      }
    };

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800">My Fees</h2>

        {/* Fee Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl p-5 text-white">
            <p className="text-green-100 text-xs font-medium">Total Paid</p>
            <p className="text-2xl font-bold mt-1">₹{feeSummary.totalPaid.toLocaleString()}</p>
            <p className="text-green-100 text-[10px] mt-1">{feeSummary.installmentStats.paid} installments</p>
          </div>
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white">
            <p className="text-orange-100 text-xs font-medium">Balance Due</p>
            <p className="text-2xl font-bold mt-1">₹{feeSummary.totalBalance.toLocaleString()}</p>
            <p className="text-orange-100 text-[10px] mt-1">{feeSummary.installmentStats.pending + feeSummary.installmentStats.overdue} pending</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-400 to-purple-600 rounded-2xl p-5 text-white">
            <p className="text-purple-100 text-xs font-medium">Total Fees</p>
            <p className="text-2xl font-bold mt-1">₹{feeSummary.totalAmount.toLocaleString()}</p>
            <p className="text-purple-100 text-[10px] mt-1">{feeSummary.installmentStats.total} installments</p>
          </div>
        </div>

        {/* Next Due Alert */}
        {feeSummary.nextDue && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Next Due: Installment #{feeSummary.nextDue.installmentNo} — ₹{feeSummary.nextDue.amount.toLocaleString()}
              </p>
              <p className="text-xs text-amber-600">
                Due Date: {new Date(feeSummary.nextDue.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        )}

        {/* Installment Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Installment Details</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {feeDetails.map((fee) => (
              <div key={fee.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Installment #{fee.installmentNo}
                    </p>
                    <p className="text-xs text-gray-500">{fee.structureName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Due: {new Date(fee.dueDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">₹{fee.netAmount.toLocaleString()}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${getStatusColor(fee.status)}`}>
                      {fee.status}
                    </span>
                  </div>
                </div>
                {fee.payments.length > 0 && (
                  <div className="mt-2 pl-4 border-l-2 border-green-200 space-y-1">
                    {fee.payments.map((p) => (
                      <p key={p.id} className="text-[11px] text-gray-500">
                        ₹{p.amount} via {p.method} • Receipt: {p.receiptNo} • {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────
  // RENDER: Exams Section
  // ─────────────────────────────────────────

  const renderExams = () => {
    if (sectionLoading || exams.length === 0) {
      if (sectionLoading) return <LoadingSkeleton />;
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800">My Exams</h2>
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No exams scheduled yet</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800">My Exams</h2>

        <div className="space-y-4">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">{exam.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{exam.type}</p>
                  </div>
                  <div className="text-right text-sm">
                    {exam.startDate && (
                      <p className="text-indigo-600 font-medium">
                        {new Date(exam.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {exam.endDate && ` — ${new Date(exam.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {exam.schedule.length > 0 && (
                <div className="p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase">
                        <th className="text-left py-2">Subject</th>
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Time</th>
                        <th className="text-left py-2">Room</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {exam.schedule.map((s, i) => (
                        <tr key={i} className="text-gray-700">
                          <td className="py-2 font-medium">{s.subject}</td>
                          <td className="py-2">{new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                          <td className="py-2">{s.startTime} - {s.endTime}</td>
                          <td className="py-2">{s.room}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────
  // RENDER: Marks Section
  // ─────────────────────────────────────────

  const renderMarks = () => {
    if (sectionLoading || marks.length === 0) {
      if (sectionLoading) return <LoadingSkeleton />;
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800">My Marks & Results</h2>
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <FiAward className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No published results yet</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800">My Marks & Results</h2>

        <div className="space-y-4">
          {marks.map((exam) => (
            <div key={exam.examId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-800">{exam.examName}</h3>
                  <p className="text-xs text-gray-500">{exam.examType}</p>
                </div>
                {exam.summary && (
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-indigo-600">{exam.summary.percentage}%</p>
                      <p className="text-[10px] text-gray-500">Percentage</p>
                    </div>
                    {exam.summary.grade && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{exam.summary.grade}</p>
                        <p className="text-[10px] text-gray-500">Grade</p>
                      </div>
                    )}
                    {exam.summary.rank && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-amber-600">#{exam.summary.rank}</p>
                        <p className="text-[10px] text-gray-500">Rank</p>
                      </div>
                    )}
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      exam.summary.status === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {exam.summary.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Marks Table */}
              <div className="p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                      <th className="text-left py-2">Subject</th>
                      <th className="text-right py-2">Marks Obtained</th>
                      <th className="text-right py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {exam.marks.map((m, i) => (
                      <tr key={i} className="text-gray-700">
                        <td className="py-2 font-medium">{m.subject}</td>
                        <td className="py-2 text-right">
                          {m.isAbsent ? (
                            <span className="text-red-500">Absent</span>
                          ) : (
                            <span className="font-semibold">{m.marksObtained}</span>
                          )}
                        </td>
                        <td className="py-2 text-right">
                          {m.isAbsent ? '—' : m.marksObtained >= 33 ? '✓' : '✗'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {exam.summary && (
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 font-semibold text-gray-800">
                        <td className="py-2">Total</td>
                        <td className="py-2 text-right">{exam.summary.totalMarks} / {exam.summary.totalMaxMarks}</td>
                        <td className="py-2 text-right">{exam.summary.percentage}%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────
  // RENDER: Subjects Section
  // ─────────────────────────────────────────

  const renderSubjects = () => {
    if (sectionLoading || subjects.length === 0) {
      if (sectionLoading) return <LoadingSkeleton />;
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800">My Subjects</h2>
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <FiBook className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No subjects assigned yet</p>
          </div>
        </div>
      );
    }

    const subjectColors = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-purple-500 to-pink-600',
      'from-amber-500 to-orange-600',
      'from-cyan-500 to-blue-600',
      'from-rose-500 to-red-600',
      'from-violet-500 to-purple-600',
      'from-lime-500 to-green-600',
    ];

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800">My Subjects</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject, i) => (
            <div key={subject.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
              <div className={`h-2 bg-gradient-to-r ${subjectColors[i % subjectColors.length]}`} />
              <div className="p-5">
                <h3 className="text-base font-semibold text-gray-800">{subject.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{subject.periodsPerWeek} periods/week</p>

                {subject.teachers.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Teachers</p>
                    {subject.teachers.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 overflow-hidden">
                          {t.photoUrl ? (
                            <img src={t.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            t.name.charAt(0)
                          )}
                        </div>
                        <span className="text-xs text-gray-700">{t.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────
  // RENDER: Library Section
  // ─────────────────────────────────────────

  const renderLibrary = () => {
    if (sectionLoading || !library) {
      if (sectionLoading) return <LoadingSkeleton />;
      return <LoadingSkeleton />;
    }

    if (!library.isMember) {
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800">Library</h2>
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <FiBookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">You are not registered as a library member yet</p>
            <p className="text-xs text-gray-400 mt-1">Contact the librarian to get a membership</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800">Library</h2>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-blue-600">{library.stats.currentlyIssued}</p>
            <p className="text-xs text-gray-500">Currently Issued</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-emerald-600">{library.stats.returned}</p>
            <p className="text-xs text-gray-500">Returned</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-red-500">{library.stats.overdue}</p>
            <p className="text-xs text-gray-500">Overdue</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-gray-700">{library.stats.totalIssued}</p>
            <p className="text-xs text-gray-500">Total Issued</p>
          </div>
        </div>

        {/* Book List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Issued Books</h3>
          </div>
          {library.issuedBooks.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No books issued currently</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {library.issuedBooks.map((issue) => (
                <div key={issue.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{issue.book.title}</p>
                    <p className="text-xs text-gray-500">by {issue.book.author}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Issued: {new Date(issue.issueDate).toLocaleDateString('en-IN')} | Due: {new Date(issue.dueDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                      issue.status === 'ISSUED' ? 'bg-blue-100 text-blue-700' :
                      issue.status === 'RETURNED' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {issue.status}
                    </span>
                    {issue.fineAmount > 0 && (
                      <p className="text-[10px] text-red-500 mt-1">Fine: ₹{issue.fineAmount}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────
  // RENDER: Content Router
  // ─────────────────────────────────────────

  const renderContent = () => {
    switch (activeNavItem) {
      case 'dashboard': return renderDashboard();
      case 'profile': return renderProfile();
      case 'subjects': return renderSubjects();
      case 'timetable': return renderTimetable();
      case 'attendance': return renderAttendance();
      case 'exams': return renderExams();
      case 'marks': return renderMarks();
      case 'fees': return renderFees();
      case 'library': return renderLibrary();
      default: return renderDashboard();
    }
  };

  // ─────────────────────────────────────────
  // Main Render
  // ─────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeItem={activeNavItem}
        onItemClick={setActiveNavItem}
        student={dashboardData?.student || null}
      />

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Page Title */}
            <h2 className="text-lg font-semibold text-gray-700 capitalize">
              {activeNavItem === 'dashboard' ? `${greeting} 👋` : activeNavItem.replace('-', ' ')}
            </h2>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                <FiBell className="w-5 h-5 text-gray-600" />
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">
                    {dashboardData
                      ? `${dashboardData.student.firstName} ${dashboardData.student.lastName}`
                      : '...'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {dashboardData?.student.className} - {dashboardData?.student.sectionName}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20 overflow-hidden">
                  {dashboardData?.student.photoUrl ? (
                    <img
                      src={dashboardData.student.photoUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    dashboardData?.student.firstName?.charAt(0) || 'S'
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
