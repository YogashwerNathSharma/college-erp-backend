
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useState, useEffect } from "react";
import axios from "axios";
import LoginPage from "./pages/LoginPages";
import ForgotPassword from "./pages/ForgotPassword";
import TenantDashboard from "./pages/TenantDashboard";

// SuperAdmin Pages
import SuperAdminDashboard from "./pages/superAdmin/SuperAdminDashboard";
import TenantsPage from "./pages/superAdmin/TenantsPage";
import ReportsPage from "./pages/superAdmin/ReportsPage";
import SuperAdminSettings from "./pages/superAdmin/SuperAdminSettings";

import Sidebar from "./components/Sidebar";
import TopNavbar from "./components/TopNavbar";

// Student Module
import StudentsPage from "./pages/students/StudentsPage";
import AdmissionForm from "./pages/students/AdmissionForm";
import OldStudentEntry from "./pages/students/OldStudentEntry";
import PromotionPage from "./pages/students/PromotionPage";
import AgeSettings from "./pages/students/AgeSettings";
import PrintStudents from "./pages/students/PrintStudents";
import RecycleBinPage from "./pages/students/RecycleBinPage";
import EditStudentPage from "./pages/students/EditStudentPage";
import StudentIdCardPage from "./pages/students/StudentIdCard";
import StudentReportsPage from "./pages/students/StudentReportsPage";
import AdminStudentDashboard from "./pages/students/AdminStudentDashboard";
import StudentDashboard from "./pages/students/StudentDashboard";

// Subscriptions
import SubscriptionsPage from "./pages/subscriptions/SubscriptionsPage";
// 🔥 NEW: Subscription Expired Page
import SubscriptionExpired from "./pages/subscriptions/SubscriptionExpired";
import RegisterSchool from "./pages/RegisterSchool";
// Tenant Admin Settings
import SettingsPage from "./pages/SettingsPage";

// Academic Year
import AcademicYearPage from "./pages/academic-year/AcademicYearPage";

// Classes
import ClassesPage from "./pages/classes/ClassesPage";

// Sections
import Sections from "./pages/Sections/SectionsPage";

// Subjects
import SubjectsPage from "./pages/Subjects/SubjectsPage";

// Teachers (Existing)
import Teachers from "./pages/teachers/Teachers";
import AddEditTeacher from "./pages/teachers/AddEditTeacher";

// Teacher Module (New Pages)
import TeacherDashboard from "./pages/teachers/TeacherDashboard";
import TeacherProfile from "./pages/teachers/TeacherProfile";
import AssignSubjectToTeacher from "./pages/teachers/AssignSubjectToTeacher";
import TeacherTimetable from "./pages/teachers/TeacherTimetable";
import TeacherAttendance from "./pages/teachers/TeacherAttendance";
import LeaveManagement from "./pages/teachers/LeaveManagement";
import TeacherSalary from "./pages/teachers/TeacherSalary";
import TeacherPerformance from "./pages/teachers/TeacherPerformance";
import TeacherDocuments from "./pages/teachers/TeacherDocuments";
import Communication from "./pages/teachers/Communication";
import TeacherReports from "./pages/teachers/TeacherReports";
import TeacherSettings from "./pages/teachers/TeacherSettings";

// Timetable
import TimetablePage from "./pages/timeTable/TimetablePage";

// Fees Module
import FeeHeadPage from "./pages/fees/FeeHeadPage";
import FeeStructurePage from "./pages/fees/FeeStructurePage";
import FeeDiscountPage from "./pages/fees/FeeDiscountPage";
import FineRulePage from "./pages/fees/FineRulePage";
import FeeCollectionPage from "./pages/fees/FeeCollectionPage";
import FeeDashboardPage from "./pages/fees/FeeDashboardPage";
import AssignFeeStructurePage from "./pages/fees/AssignFeeStructurePage";
import FeeReportsPage from "./pages/fees/FeeReportsPage";
import StudentLedgerPage from "./pages/fees/StudentLedgerPage";
import FeeReminderPage from "./pages/fees/FeeReminderPage";
import FeeSettingsPage from "./pages/fees/FeeSettingsPage";

// Exam Module
import ExamList from "./pages/exams/ExamList";
import GradeSettings from "./pages/exams/GradeSettings";
import CreateEditExam from "./pages/exams/CreateEditExam";
import ExamSubjects from "./pages/exams/ExamSubjects";
import MarksEntry from "./pages/exams/MarksEntry";
import Results from "./pages/exams/Results";
import ReportCard from "./pages/exams/ReportCard";
import ConsolidatedReportCard from "./pages/exams/ConsolidatedReportCard";
// Exam Module (NEW Pages)
import ExamSchedule from "./pages/exams/ExamSchedule";
import SeatingArrangement from "./pages/exams/SeatingArrangement";
import AdmitCard from "./pages/exams/AdmitCard";
import QuestionPaper from "./pages/exams/QuestionPaper";
import InvigilatorAssignment from "./pages/exams/InvigilatorAssignment";
import ExamDashboard from "./pages/exams/ExamDashboard";
import ExamReports from "./pages/exams/ExamReports";

// Attendance
import AttendancePage from "./pages/AttendancePage/AttendancePage";
import AttendanceReportPage from "./pages/AttendancePage/AttendanceReportPage";
import AttendanceDashboardPage from "./pages/AttendancePage/AttendanceDashboardPage";

//////////////////////////////////////////////////////
// AXIOS GLOBAL CONFIG
//////////////////////////////////////////////////////
axios.defaults.baseURL = "http://localhost:5000";

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔥 NEW: Response interceptor — auto-redirect on subscription expired
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 403 &&
      error?.response?.data?.subscriptionExpired === true
    ) {
      // Set flag and redirect
      localStorage.setItem("subscriptionExpired", "true");
      window.location.href = "/subscription-expired";
    }
    return Promise.reject(error);
  }
);

//////////////////////////////////////////////////////
// Protected Route
//////////////////////////////////////////////////////
function ProtectedRoute() {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 🔥 If subscription expired, only allow /subscription-expired
  const isExpired = localStorage.getItem("subscriptionExpired") === "true";
  if (isExpired && location.pathname !== "/subscription-expired") {
    return <Navigate to="/subscription-expired" replace />;
  }

  return <Outlet />;
}

//////////////////////////////////////////////////////
// Layout (with Sidebar + TopNavbar)
//////////////////////////////////////////////////////
function Layout() {
  const [tenant, setTenant] = useState<any>(() => {
    const saved = localStorage.getItem("tenant");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("tenant");
      if (saved) {
        setTenant(JSON.parse(saved));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const url =
          user?.role === "SUPER_ADMIN"
            ? "/api/super-admin/settings"
            : "/api/settings";

        const res = await axios.get(url);
        const color = res.data.data?.platform?.primaryColor;
        if (color) {
          document.documentElement.style.setProperty("--primary-color", color);
        }
      } catch (err) {
        console.error("Branding fetch error", err);
      }
    };
    fetchBranding();
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar tenant={tenant} />
      <div className="flex-1 bg-gray-100 p-6">
        <TopNavbar tenant={tenant} />
        <Outlet context={{ setTenant }} />
      </div>
    </div>
  );
}

//////////////////////////////////////////////////////
// Role Dashboard
//////////////////////////////////////////////////////
function RoleDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user?.role === "SUPER_ADMIN" ? <SuperAdminDashboard /> : <TenantDashboard />;
}

//////////////////////////////////////////////////////
// Role-based Settings
//////////////////////////////////////////////////////
function RoleSettings() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user?.role === "SUPER_ADMIN" ? <SuperAdminSettings /> : <SettingsPage />;
}

//////////////////////////////////////////////////////
// App
//////////////////////////////////////////////////////
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register-school" element={<RegisterSchool />} />
        {/* ===== PROTECTED ROUTES ===== */}
        <Route element={<ProtectedRoute />}>

          {/* 🔥 SUBSCRIPTION EXPIRED PAGE (No Sidebar/Navbar) */}
          <Route path="/subscription-expired" element={<SubscriptionExpired />} />

          {/* ─────────────────────────────────────────────── */}
          {/* PRINT ROUTES — No Sidebar, No Navbar       */}
          {/* ─────────────────────────────────────────────── */}
          <Route path="/print/report-card/:examId/:studentId" element={<ReportCard />} />
          <Route path="/print/consolidated/:studentId" element={<ConsolidatedReportCard />} />

          {/* ─────────────────────────────────────────────── */}
          {/* STUDENT PORTAL — Separate Layout (own sidebar) */}
          {/* ─────────────────────────────────────────────── */}
          <Route path="/student-portal" element={<StudentDashboard />} />

          {/* ─────────────────────────────────────────────── */}
          {/* NORMAL ROUTES — With Sidebar + Navbar      */}
          {/* ─────────────────────────────────────────────── */}
          <Route element={<Layout />}>
            {/* DASHBOARD */}
            <Route path="/dashboard" element={<RoleDashboard />} />

            {/* TENANTS (SuperAdmin only) */}
            <Route path="/tenants" element={<TenantsPage />} />

            {/* SUBSCRIPTIONS */}
            <Route path="/subscriptions" element={<SubscriptionsPage />} />

            {/* REPORTS */}
            <Route path="/reports" element={<ReportsPage />} />

            {/* SETTINGS */}
            <Route path="/settings" element={<RoleSettings />} />

            {/* ATTENDANCE */}
            <Route path="/attendance-dashboard" element={<AttendanceDashboardPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/attendance-report" element={<AttendanceReportPage />} />

            {/* STUDENT MODULE */}
            <Route path="/student-dashboard" element={<AdminStudentDashboard />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/new-admission" element={<AdmissionForm />} />
            <Route path="/students/old-entry" element={<OldStudentEntry />} />
            <Route path="/students/promotion" element={<PromotionPage />} />
            <Route path="/students/age-settings" element={<AgeSettings />} />
            <Route path="/students/print" element={<PrintStudents />} />
            <Route path="/students/recycle-bin" element={<RecycleBinPage />} />
            <Route path="/students/:id/edit" element={<EditStudentPage />} />
            <Route path="/students/reports" element={<StudentReportsPage />} />
            <Route path="/students/id-card" element={<StudentIdCardPage />} />

            {/* ACADEMIC */}
            <Route path="/academic-years" element={<AcademicYearPage />} />
            <Route path="/classes" element={<ClassesPage />} />
            <Route path="/Sections" element={<Sections />} />
            <Route path="/subjects" element={<SubjectsPage />} />

            {/* ─────────────────────────────────────────────── */}
            {/* TEACHER MODULE (Complete)                   */}
            {/* ─────────────────────────────────────────────── */}
            <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/teachers/add" element={<AddEditTeacher />} />
            <Route path="/teachers/edit/:id" element={<AddEditTeacher />} />
            <Route path="/teachers/profile/:id" element={<TeacherProfile />} />
            <Route path="/assign-subject" element={<AssignSubjectToTeacher />} />
            <Route path="/teacher-timetable" element={<TeacherTimetable />} />
            <Route path="/teacher-attendance" element={<TeacherAttendance />} />
            <Route path="/teacher-leave" element={<LeaveManagement />} />
            <Route path="/teacher-salary" element={<TeacherSalary />} />
            <Route path="/teacher-performance" element={<TeacherPerformance />} />
            <Route path="/teacher-documents" element={<TeacherDocuments />} />
            <Route path="/teacher-communication" element={<Communication />} />
            <Route path="/teacher-reports" element={<TeacherReports />} />
            <Route path="/teacher-settings" element={<TeacherSettings />} />

            {/* TIMETABLE */}
            <Route path="/timeTable" element={<TimetablePage />} />

            {/* FEES MODULE */}
            <Route path="/fees" element={<FeeCollectionPage />} />
            <Route path="/fees/dashboard" element={<FeeDashboardPage />} />
            <Route path="/fees/collection" element={<FeeCollectionPage />} />
            <Route path="/fees/heads" element={<FeeHeadPage />} />
            <Route path="/fees/structures" element={<FeeStructurePage />} />
            <Route path="/fees/assign" element={<AssignFeeStructurePage />} />
            <Route path="/fees/discounts" element={<FeeDiscountPage />} />
            <Route path="/fees/fine-rules" element={<FineRulePage />} />
            <Route path="/fees/reports" element={<FeeReportsPage />} />
            <Route path="/fees/ledger" element={<StudentLedgerPage />} />
            <Route path="/fees/reminders" element={<FeeReminderPage />} />
            <Route path="/fees/settings" element={<FeeSettingsPage />} />

            {/* EXAM MODULE */}
            <Route path="/grade-settings" element={<GradeSettings />} />
            <Route path="/exams/consolidated-report/:studentId" element={<ConsolidatedReportCard />} />
            <Route path="/exams/create" element={<CreateEditExam />} />
            <Route path="/exams/edit/:id" element={<CreateEditExam />} />
            <Route path="/exams/:id/subjects" element={<ExamSubjects />} />
            <Route path="/exams/:id/marks" element={<MarksEntry />} />
            <Route path="/exams/:id/results" element={<Results />} />
            <Route path="/exams/:examId/report-card/:studentId" element={<ReportCard />} />
            <Route path="/exams" element={<ExamList />} />
            <Route path="/exam-dashboard" element={<ExamDashboard />} />
            <Route path="/exam-schedule/:id" element={<ExamSchedule />} />
            <Route path="/exam-seating/:id" element={<SeatingArrangement />} />
            <Route path="/exam-admit-cards/:id" element={<AdmitCard />} />
            <Route path="/exam-question-papers/:id" element={<QuestionPaper />} />
            <Route path="/exam-invigilators/:id" element={<InvigilatorAssignment />} />
            <Route path="/exam-reports" element={<ExamReports />} />

          </Route>
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

