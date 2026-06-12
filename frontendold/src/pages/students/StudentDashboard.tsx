
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  FiHome,
  FiUser,
  FiBook,
  FiSun,
  FiClipboard,
  FiCheckCircle,
  FiFileText,
  FiAward,
  FiDollarSign,
  FiCalendar,
  FiBookOpen,
  FiMessageSquare,
  FiSettings,
  FiSearch,
  FiBell,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiMapPin,
  FiTrendingUp,
} from 'react-icons/fi';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  rollNumber?: string;
  department?: string;
  semester?: number;
}

interface OverviewData {
  totalCourses: number;
  attendancePercentage: number;
  pendingAssignments: number;
  overallGPA: number;
}

interface ScheduleItem {
  id: string;
  time: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string;
  room: string;
  color: string;
}

interface Assignment {
  id: string;
  name: string;
  subject: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'overdue';
}

interface CalendarEvent {
  date: number;
  type: 'exam' | 'event' | 'holiday';
}

// ─────────────────────────────────────────────
// Sidebar Navigation Items
// ─────────────────────────────────────────────

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome },
  { id: 'profile', label: 'Profile', icon: FiUser },
  { id: 'courses', label: 'Courses', icon: FiBook },
  { id: 'day-routine', label: 'Day Routine', icon: FiSun },
  { id: 'assignments', label: 'Assignments', icon: FiClipboard },
  { id: 'attendance', label: 'Attendance', icon: FiCheckCircle },
  { id: 'exams', label: 'Exams', icon: FiFileText },
  { id: 'marks', label: 'Marks', icon: FiAward },
  { id: 'fees', label: 'Fees', icon: FiDollarSign },
  { id: 'timetable', label: 'Time Table', icon: FiCalendar },
  { id: 'library', label: 'Library', icon: FiBookOpen },
  { id: 'messages', label: 'Messages', icon: FiMessageSquare },
  { id: 'settings', label: 'Settings', icon: FiSettings },
];

// ─────────────────────────────────────────────
// Sidebar Component
// ─────────────────────────────────────────────

interface SidebarProps {
  activeItem: string;
  onItemClick: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onItemClick }) => {
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
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold">
            S
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Student</p>
            <p className="text-xs text-blue-200/60 truncate">Online</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

// ─────────────────────────────────────────────
// Skeleton Loader Components
// ─────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
        <div className="h-8 w-16 bg-gray-200 rounded" />
      </div>
      <div className="w-12 h-12 bg-gray-200 rounded-xl" />
    </div>
  </div>
);

const SkeletonScheduleItem: React.FC = () => (
  <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 animate-pulse">
    <div className="w-16 h-12 bg-gray-200 rounded-lg" />
    <div className="flex-1">
      <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-24 bg-gray-200 rounded" />
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Progress Ring Component
// ─────────────────────────────────────────────

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 48,
  strokeWidth = 4,
  color,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-200"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
};

// ─────────────────────────────────────────────
// Calendar Widget Component
// ─────────────────────────────────────────────

interface CalendarWidgetProps {
  events: CalendarEvent[];
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ events }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const hasEvent = (day: number): CalendarEvent | undefined => {
    return events.find((e) => e.date === day);
  };

  const isToday = (day: number): boolean => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {monthNames[month]} {year}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={goToPrevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FiChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FiChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-9" />;
          }

          const event = hasEvent(day);
          const todayClass = isToday(day);

          return (
            <div
              key={day}
              className={`relative h-9 flex items-center justify-center rounded-lg text-sm cursor-pointer transition-all ${
                todayClass
                  ? 'bg-[#1E3A8A] text-white font-bold shadow-md shadow-blue-900/20'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              {day}
              {event && (
                <div
                  className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                    event.type === 'exam'
                      ? 'bg-red-400'
                      : event.type === 'holiday'
                      ? 'bg-green-400'
                      : 'bg-blue-400'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="text-xs text-gray-500">Exam</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          <span className="text-xs text-gray-500">Event</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="text-xs text-gray-500">Holiday</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────

const StudentDashboard: React.FC = () => {
  const [activeNavItem, setActiveNavItem] = useState<string>('dashboard');
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ─────────────────────────────────────────
  // Greeting based on time of day
  // ─────────────────────────────────────────

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // ─────────────────────────────────────────
  // Fetch Data
  // ─────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Try to get student info from localStorage first
        const storedUser = localStorage.getItem('user');
        let studentData: StudentInfo | null = null;

        if (storedUser) {
          studentData = JSON.parse(storedUser);
        }

        // Fetch from API
        const [studentRes, scheduleRes, assignmentsRes, attendanceRes] = await Promise.allSettled([
          !studentData ? axios.get<StudentInfo>('/api/students/me') : Promise.resolve(null),
          axios.get<ScheduleItem[]>('/api/timetable/my-schedule', {
            params: { day: 'today' },
          }),
          axios.get<Assignment[]>('/api/assignments/my', {
            params: { status: 'pending' },
          }),
          axios.get<{ percentage: number; totalCourses: number; gpa: number }>(
            '/api/attendance/my-summary'
          ),
        ]);

        // Student Info
        if (!studentData && studentRes.status === 'fulfilled' && studentRes.value) {
          studentData = (studentRes.value as any).data;
        }
        if (studentData) {
          setStudent(studentData);
        } else {
          // Fallback mock data
          setStudent({
            id: '1',
            firstName: 'Alex',
            lastName: 'Johnson',
            email: 'alex.johnson@university.edu',
            avatarUrl: '',
            rollNumber: 'CS2024001',
            department: 'Computer Science',
            semester: 4,
          });
        }

        // Schedule
        if (scheduleRes.status === 'fulfilled' && scheduleRes.value) {
          setSchedule((scheduleRes.value as any).data || []);
        } else {
          // Mock schedule data
          setSchedule([
            {
              id: '1',
              time: '09:00 - 10:00',
              startTime: '09:00',
              endTime: '10:00',
              subject: 'Data Structures & Algorithms',
              teacher: 'Dr. Sarah Miller',
              room: 'Room 301',
              color: '#3B82F6',
            },
            {
              id: '2',
              time: '10:15 - 11:15',
              startTime: '10:15',
              endTime: '11:15',
              subject: 'Operating Systems',
              teacher: 'Prof. James Wilson',
              room: 'Room 205',
              color: '#8B5CF6',
            },
            {
              id: '3',
              time: '11:30 - 12:30',
              startTime: '11:30',
              endTime: '12:30',
              subject: 'Database Management',
              teacher: 'Dr. Emily Chen',
              room: 'Lab 102',
              color: '#10B981',
            },
            {
              id: '4',
              time: '14:00 - 15:00',
              startTime: '14:00',
              endTime: '15:00',
              subject: 'Computer Networks',
              teacher: 'Prof. Robert Kumar',
              room: 'Room 408',
              color: '#F59E0B',
            },
            {
              id: '5',
              time: '15:15 - 16:15',
              startTime: '15:15',
              endTime: '16:15',
              subject: 'Software Engineering',
              teacher: 'Dr. Lisa Park',
              room: 'Room 312',
              color: '#EF4444',
            },
          ]);
        }

        // Assignments
        if (assignmentsRes.status === 'fulfilled' && assignmentsRes.value) {
          setAssignments((assignmentsRes.value as any).data || []);
        } else {
          // Mock assignments data
          setAssignments([
            {
              id: '1',
              name: 'Binary Tree Implementation',
              subject: 'Data Structures & Algorithms',
              dueDate: '2026-06-14',
              status: 'pending',
            },
            {
              id: '2',
              name: 'Process Scheduling Simulation',
              subject: 'Operating Systems',
              dueDate: '2026-06-16',
              status: 'pending',
            },
            {
              id: '3',
              name: 'ER Diagram Design Project',
              subject: 'Database Management',
              dueDate: '2026-06-12',
              status: 'overdue',
            },
            {
              id: '4',
              name: 'TCP/IP Protocol Analysis',
              subject: 'Computer Networks',
              dueDate: '2026-06-18',
              status: 'pending',
            },
            {
              id: '5',
              name: 'Agile Sprint Report',
              subject: 'Software Engineering',
              dueDate: '2026-06-20',
              status: 'submitted',
            },
          ]);
        }

        // Attendance / Overview
        if (attendanceRes.status === 'fulfilled' && attendanceRes.value) {
          const data = (attendanceRes.value as any).data;
          setOverview({
            totalCourses: data.totalCourses || 6,
            attendancePercentage: data.percentage || 85,
            pendingAssignments: 4,
            overallGPA: data.gpa || 3.72,
          });
        } else {
          // Mock overview data
          setOverview({
            totalCourses: 6,
            attendancePercentage: 85,
            pendingAssignments: 4,
            overallGPA: 3.72,
          });
        }

        // Calendar events (mock)
        setCalendarEvents([
          { date: 5, type: 'event' },
          { date: 11, type: 'event' },
          { date: 15, type: 'exam' },
          { date: 18, type: 'exam' },
          { date: 20, type: 'exam' },
          { date: 22, type: 'holiday' },
          { date: 25, type: 'event' },
          { date: 28, type: 'exam' },
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set fallback data on complete failure
        setStudent({
          id: '1',
          firstName: 'Alex',
          lastName: 'Johnson',
          email: 'alex.johnson@university.edu',
          avatarUrl: '',
          rollNumber: 'CS2024001',
          department: 'Computer Science',
          semester: 4,
        });
        setOverview({
          totalCourses: 6,
          attendancePercentage: 85,
          pendingAssignments: 4,
          overallGPA: 3.72,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ─────────────────────────────────────────
  // Attendance color helper
  // ─────────────────────────────────────────

  const getAttendanceColor = (percentage: number): string => {
    if (percentage >= 80) return '#10B981';
    if (percentage >= 60) return '#F59E0B';
    return '#EF4444';
  };

  // ─────────────────────────────────────────
  // Format date helper
  // ─────────────────────────────────────────

  const formatDueDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  // ─────────────────────────────────────────
  // Status badge helper
  // ─────────────────────────────────────────

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />
            Submitted
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5" />
            Pending
          </span>
        );
    }
  };

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar activeItem={activeNavItem} onItemClick={setActiveNavItem} />

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Search Bar */}
            <div className="relative w-96">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search courses, assignments, teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                <FiBell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              </button>

              {/* Student Name + Avatar */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">
                    {loading ? (
                      <span className="inline-block w-24 h-4 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      `${student?.firstName} ${student?.lastName}`
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {loading ? (
                      <span className="inline-block w-16 h-3 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      student?.rollNumber || 'Student'
                    )}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20">
                  {student?.avatarUrl ? (
                    <img
                      src={student.avatarUrl}
                      alt={student.firstName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    student?.firstName?.charAt(0) || 'S'
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {/* ─────────────────────────────────────────
              1. Greeting Section
          ───────────────────────────────────────── */}
          <section className="mb-8">
            <div className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] rounded-2xl p-8 text-white relative overflow-hidden">
              {/* Background Decorations */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />

              <div className="relative flex items-center justify-between">
                <div>
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-8 w-64 bg-white/20 rounded mb-3" />
                      <div className="h-5 w-48 bg-white/20 rounded" />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-3xl font-bold mb-2">
                        {greeting}, {student?.firstName}! 👋
                      </h2>
                      <p className="text-blue-100 text-lg">
                        Welcome back to your learning journey.
                      </p>
                      <div className="flex items-center gap-4 mt-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 rounded-lg text-sm">
                          <FiBook className="w-4 h-4" />
                          {student?.department}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 rounded-lg text-sm">
                          <FiCalendar className="w-4 h-4" />
                          Semester {student?.semester}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Student Photo */}
                <div className="hidden md:block">
                  <div className="w-24 h-24 rounded-full border-4 border-blue-300/50 bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center shadow-xl shadow-blue-900/30">
                    {student?.avatarUrl ? (
                      <img
                        src={student.avatarUrl}
                        alt={student.firstName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        {student?.firstName?.charAt(0) || 'S'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────
              2. Overview Cards
          ───────────────────────────────────────── */}
          <section className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : (
                <>
                  {/* Total Courses */}
                  <div className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium mb-1">
                          Total Courses
                        </p>
                        <p className="text-4xl font-bold">{overview?.totalCourses}</p>
                        <p className="text-blue-200 text-xs mt-2">This Semester</p>
                      </div>
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                        <FiBook className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Attendance */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">
                          Attendance
                        </p>
                        <p
                          className="text-4xl font-bold"
                          style={{
                            color: getAttendanceColor(
                              overview?.attendancePercentage || 0
                            ),
                          }}
                        >
                          {overview?.attendancePercentage}%
                        </p>
                        <p className="text-gray-400 text-xs mt-2">
                          {(overview?.attendancePercentage || 0) >= 80
                            ? 'Great attendance!'
                            : 'Needs improvement'}
                        </p>
                      </div>
                      <div className="relative">
                        <ProgressRing
                          percentage={overview?.attendancePercentage || 0}
                          size={56}
                          strokeWidth={5}
                          color={getAttendanceColor(
                            overview?.attendancePercentage || 0
                          )}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FiCheckCircle
                            className="w-5 h-5"
                            style={{
                              color: getAttendanceColor(
                                overview?.attendancePercentage || 0
                              ),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pending Assignments */}
                  <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm font-medium mb-1">
                          Assignments
                        </p>
                        <p className="text-4xl font-bold">
                          {overview?.pendingAssignments}
                        </p>
                        <p className="text-orange-100 text-xs mt-2">Pending</p>
                      </div>
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                        <FiClipboard className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Overall GPA */}
                  <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium mb-1">
                          Overall GPA
                        </p>
                        <p className="text-4xl font-bold">{overview?.overallGPA}</p>
                        <p className="text-green-100 text-xs mt-2 flex items-center gap-1">
                          <FiTrendingUp className="w-3 h-3" />
                          +0.12 from last sem
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                        <FiAward className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* ─────────────────────────────────────────
              3. Two Column Layout — Schedule + Calendar
          ───────────────────────────────────────── */}
          <section className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Today's Schedule — 3 columns */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Today's Schedule
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {new Date().toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <button className="text-sm text-[#3B82F6] font-medium hover:underline">
                      View Full Timetable
                    </button>
                  </div>

                  {loading ? (
                    <div className="space-y-3">
                      <SkeletonScheduleItem />
                      <SkeletonScheduleItem />
                      <SkeletonScheduleItem />
                      <SkeletonScheduleItem />
                    </div>
                  ) : schedule.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <FiCalendar className="w-12 h-12 mb-3 text-gray-300" />
                      <p className="text-lg font-medium">No classes today</p>
                      <p className="text-sm mt-1">Enjoy your free day! 🎉</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {schedule.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                        >
                          {/* Time */}
                          <div className="flex-shrink-0 w-20 text-center">
                            <p className="text-sm font-semibold text-gray-800">
                              {item.startTime}
                            </p>
                            <p className="text-xs text-gray-400">{item.endTime}</p>
                          </div>

                          {/* Color Bar */}
                          <div
                            className="w-1 h-12 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          />

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {item.subject}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <FiUser className="w-3 h-3" />
                                {item.teacher}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <FiMapPin className="w-3 h-3" />
                                {item.room}
                              </span>
                            </div>
                          </div>

                          {/* Status indicator */}
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium">
                              <FiClock className="w-3 h-3" />
                              {item.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Calendar Widget — 2 columns */}
              <div className="lg:col-span-2">
                <CalendarWidget events={calendarEvents} />
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────
              4. Pending Assignments Section
          ───────────────────────────────────────── */}
          <section className="mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Pending Assignments
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Track your upcoming deadlines
                  </p>
                </div>
                <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-[#3B82F6] text-sm font-medium hover:bg-blue-100 transition-colors">
                  View All
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>

              {loading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                      <div className="flex-1">
                        <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                        <div className="h-3 w-32 bg-gray-200 rounded" />
                      </div>
                      <div className="h-6 w-20 bg-gray-200 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Assignment
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {assignments.map((assignment) => (
                        <tr
                          key={assignment.id}
                          className="hover:bg-gray-50/50 transition-colors group"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <FiFileText className="w-5 h-5 text-[#3B82F6]" />
                              </div>
                              <span className="text-sm font-medium text-gray-800">
                                {assignment.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600">
                              {assignment.subject}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600 flex items-center gap-1.5">
                              <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
                              {formatDueDate(assignment.dueDate)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(assignment.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;

