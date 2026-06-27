
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import { API_BASE_URL } from "./config/api";

// ✅ Only Layout components stay as eager imports (always visible)
import Sidebar from "./components/Sidebar";
import TopNavbar from "./components/TopNavbar";
import YnAiAssistant from "./components/YnAiAssistant";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE LOADER (lightweight spinner shown while pages load)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center h-64 animate-fade-in">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-slate-700" />
      <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
    </div>
    <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">Loading...</p>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAZY IMPORTS — Each page loads ONLY when user visits it
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Auth
const LoginPage = lazy(() => import("./pages/login/LoginPages"));
const ForgotPassword = lazy(() => import("./pages/login/ForgotPassword"));
const RegisterSchool = lazy(() => import("./pages/login/RegisterSchool"));

// Dashboards
const TenantDashboard = lazy(() => import("./pages/TenantDashboard"));
const SuperAdminDashboard = lazy(() => import("./pages/superAdmin/SuperAdminDashboard"));

// SuperAdmin Pages
const TenantsPage = lazy(() => import("./pages/superAdmin/TenantsPage"));
const SuperAdminSettings = lazy(() => import("./pages/superAdmin/SuperAdminSettings"));

// Student Module
const StudentsPage = lazy(() => import("./pages/students/StudentsPage"));
const AdmissionForm = lazy(() => import("./pages/students/AdmissionForm"));
const OldStudentEntry = lazy(() => import("./pages/students/OldStudentEntry"));
const PromotionPage = lazy(() => import("./pages/students/PromotionPage"));
const AgeSettings = lazy(() => import("./pages/students/AgeSettings"));
const PrintStudents = lazy(() => import("./pages/students/PrintStudents"));
const RecycleBinPage = lazy(() => import("./pages/students/RecycleBinPage"));
const EditStudentPage = lazy(() => import("./pages/students/EditStudentPage"));
const StudentIdCardPage = lazy(() => import("./pages/students/StudentIdCard"));
const StudentReportsPage = lazy(() => import("./pages/students/StudentReportsPage"));
const AdminStudentDashboard = lazy(() => import("./pages/students/AdminStudentDashboard"));
const StudentDashboard = lazy(() => import("./pages/students/StudentDashboard"));
const StudentProfilePage = lazy(() => import("./pages/students/StudentProfilePage"));

// Reports
const ReportsPage = lazy(() => import("./pages/reports/ReportsPage"));
const CertificateGenerator = lazy(() => import("./pages/reports/CertificateGenerator"));
const AnalyticsPage = lazy(() => import("./pages/reports/AnalyticsPage"));

// Subscriptions
const SubscriptionsPage = lazy(() => import("./pages/subscriptions/SubscriptionsPage"));
const SubscriptionSettings = lazy(() => import("./pages/subscriptions/SubscriptionSettings"));
const SubscriptionExpired = lazy(() => import("./pages/subscriptions/SubscriptionExpired"));

// Settings
const TenantAdminSettings = lazy(() => import("./pages/settings/TenantAdminSettings"));
const SignatureMaster = lazy(() => import("./pages/settings/SignatureMaster"));
const ThemePage = lazy(() => import("./pages/settings/theme/ThemePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

// Academic Year
const AcademicYearPage = lazy(() => import("./pages/academic-year/AcademicYearPage"));

// Classes
const ClassesPage = lazy(() => import("./pages/classes/ClassesPage"));

// Sections
const Sections = lazy(() => import("./pages/Sections/SectionsPage"));

// Subjects
const SubjectsPage = lazy(() => import("./pages/Subjects/SubjectsPage"));

// Teachers
const Teachers = lazy(() => import("./pages/teachers/Teachers"));
const AddEditTeacher = lazy(() => import("./pages/teachers/AddEditTeacher"));
const TeacherDashboard = lazy(() => import("./pages/teachers/TeacherDashboard"));
const TeacherProfile = lazy(() => import("./pages/teachers/TeacherProfile"));
const AssignSubjectToTeacher = lazy(() => import("./pages/teachers/AssignSubjectToTeacher"));
const TeacherTimetable = lazy(() => import("./pages/teachers/TeacherTimetable"));
const TeacherAttendance = lazy(() => import("./pages/teachers/TeacherAttendance"));
const LeaveManagement = lazy(() => import("./pages/teachers/LeaveManagement"));
const TeacherSalary = lazy(() => import("./pages/teachers/TeacherSalary"));
const TeacherPerformance = lazy(() => import("./pages/teachers/TeacherPerformance"));
const TeacherDocuments = lazy(() => import("./pages/teachers/TeacherDocuments"));
const Communication = lazy(() => import("./pages/teachers/Communication"));
const TeacherReports = lazy(() => import("./pages/teachers/TeacherReports"));
const TeacherSettings = lazy(() => import("./pages/teachers/TeacherSettings"));
const TeacherIdCard = lazy(() => import("./pages/teachers/TeacherIdCard"));
const TeacherPortal = lazy(() => import("./pages/teachers/TeacherPortal"));

// Principal
const PrincipalPortal = lazy(() => import("./pages/principal/PrincipalPortal"));

// Timetable
const TimetablePage = lazy(() => import("./pages/timeTable/TimetablePage"));

// Fees Module
const FeeHeadPage = lazy(() => import("./pages/fees/FeeHeadPage"));
const FeeStructurePage = lazy(() => import("./pages/fees/FeeStructurePage"));
const FeeDiscountPage = lazy(() => import("./pages/fees/FeeDiscountPage"));
const FineRulePage = lazy(() => import("./pages/fees/FineRulePage"));
const FeeCollectionPage = lazy(() => import("./pages/fees/FeeCollectionPage"));
const FeeDashboardPage = lazy(() => import("./pages/fees/FeeDashboardPage"));
const AssignFeeStructurePage = lazy(() => import("./pages/fees/AssignFeeStructurePage"));
const FeeReportsPage = lazy(() => import("./pages/fees/FeeReportsPage"));
const FeeReceiptsPage = lazy(() => import("./pages/fees/FeeReceiptsPage"));
const StudentLedgerPage = lazy(() => import("./pages/fees/StudentLedgerPage"));
const FeeReminderPage = lazy(() => import("./pages/fees/FeeReminderPage"));
const FeeSettingsPage = lazy(() => import("./pages/fees/FeeSettingsPage"));

// Exam Module
const ExamList = lazy(() => import("./pages/exams/ExamList"));
const GradeSettings = lazy(() => import("./pages/exams/GradeSettings"));
const CreateEditExam = lazy(() => import("./pages/exams/CreateEditExam"));
const ExamSubjects = lazy(() => import("./pages/exams/ExamSubjects"));
const MarksEntry = lazy(() => import("./pages/exams/MarksEntry"));
const Results = lazy(() => import("./pages/exams/Results"));
const ReportCard = lazy(() => import("./pages/exams/ReportCard"));
const BulkReportCard = lazy(() => import("./pages/exams/BulkReportCard"));
const ConsolidatedReportCard = lazy(() => import("./pages/exams/ConsolidatedReportCard"));
const ExamSchedule = lazy(() => import("./pages/exams/ExamSchedule"));
const SeatingArrangement = lazy(() => import("./pages/exams/SeatingArrangement"));
const AdmitCard = lazy(() => import("./pages/exams/AdmitCard"));
const QuestionPaper = lazy(() => import("./pages/exams/QuestionPaper"));
const InvigilatorAssignment = lazy(() => import("./pages/exams/InvigilatorAssignment"));
const ExamDashboard = lazy(() => import("./pages/exams/ExamDashboard"));
const ExamReports = lazy(() => import("./pages/exams/ExamReports"));
const SeatingArrangementPage = lazy(() => import("./pages/exams/SeatingArrangementPage"));
const RoomManagement = lazy(() => import("./pages/exams/RoomManagement"));
const AdmitCardPage = lazy(() => import("./pages/exams/AdmitCardPage"));
const ReportCardSelect = lazy(() => import("./pages/exams/ReportCardSelect"));

// Designer
const DesignerPage = lazy(() => import("./pages/designer/DesignerPage"));

// YN-UDP Template Designer
const YnUdpPage = lazy(() => import("./pages/yn-udp/YnUdpPage"));

// Attendance
const AttendancePage = lazy(() => import("./pages/AttendancePage/AttendancePage"));
const AttendanceReportPage = lazy(() => import("./pages/AttendancePage/AttendanceReportPage"));
const AttendanceDashboardPage = lazy(() => import("./pages/AttendancePage/AttendanceDashboardPage"));

// Library
const LibraryDashboard = lazy(() => import("./pages/library/LibraryDashboard"));

// Transport
const TransportDashboard = lazy(() => import("./pages/transport/TransportDashboard"));
const TransportTracking = lazy(() => import("./pages/transport/TransportTracking"));

// Backup
const BackupPage = lazy(() => import("./pages/backup/BackupPage"));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NEW MODULE IMPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Hostel Module
const RoomAllocation = lazy(() => import("./pages/hostel/RoomAllocation"));
const HostelFees = lazy(() => import("./pages/hostel/HostelFees"));
const MessManage = lazy(() => import("./pages/hostel/MessManage"));

// HR Module
const StaffList = lazy(() => import("./pages/hr/StaffList"));
const Payroll = lazy(() => import("./pages/hr/Payroll"));
const LeaveManage = lazy(() => import("./pages/hr/LeaveManage"));
const StaffAttendance = lazy(() => import("./pages/hr/StaffAttendance"));

// Communication Module
const NoticeBoard = lazy(() => import("./pages/communication/NoticeBoard"));
const SMSSend = lazy(() => import("./pages/communication/SMSSend"));
const WhatsAppSend = lazy(() => import("./pages/communication/WhatsAppSend"));
const CircularCreate = lazy(() => import("./pages/communication/CircularCreate"));

// Certificates Module
const TCGenerate = lazy(() => import("./pages/certificates/TCGenerate"));
const CharacterCert = lazy(() => import("./pages/certificates/CharacterCert"));
const MigrationCert = lazy(() => import("./pages/certificates/MigrationCert"));

// Inventory Module
const AssetList = lazy(() => import("./pages/inventory/AssetList"));
const AssetIssue = lazy(() => import("./pages/inventory/AssetIssue"));
const StockManage = lazy(() => import("./pages/inventory/StockManage"));

// Admission Module
const AdmissionList = lazy(() => import("./pages/admission/AdmissionList"));
const NewAdmission = lazy(() => import("./pages/admission/NewAdmission"));
const AdmissionDetail = lazy(() => import("./pages/admission/AdmissionDetail"));


//////////////////////////////////////////////////////
// AXIOS GLOBAL CONFIG
//////////////////////////////////////////////////////
axios.defaults.baseURL = API_BASE_URL;

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔥 Response interceptor — auto-redirect on subscription expired
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 403 &&
      error?.response?.data?.subscriptionExpired === true
    ) {
      // Skip redirect for SUPER_ADMIN
      const userData = localStorage.getItem("user");
      const userRole = userData ? JSON.parse(userData)?.role : null;
      if (userRole === "SUPER_ADMIN") {
        return Promise.reject(error);
      }
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
  const [checking, setChecking] = useState(true);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    // Skip subscription check for SUPER_ADMIN
    const userData = localStorage.getItem("user");
    const userRole = userData ? JSON.parse(userData)?.role : null;
    if (userRole === "SUPER_ADMIN") {
      setChecking(false);
      return;
    }
    const checkSubscription = async () => {
      // Skip check for subscription-related pages
      if (location.pathname === "/subscription-expired" || location.pathname === "/subscriptions") {
        setChecking(false);
        return;
      }
      // Skip check if payment was just completed (grace period)
      const paymentJustCompleted = localStorage.getItem("subscriptionPaymentTime");
      if (paymentJustCompleted) {
        const elapsed = Date.now() - parseInt(paymentJustCompleted);
        if (elapsed < 30000) { // 30 second grace after payment
          localStorage.removeItem("subscriptionExpired");
          setExpired(false);
          setChecking(false);
          return;
        } else {
          localStorage.removeItem("subscriptionPaymentTime");
        }
      }
      try {
        const res = await axios.get("/api/tenant/my-subscription", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data?.data || res.data;
        // If no subscription or expired
        if (!data || !data.endDate || data.daysRemaining <= 0 || data.status === "expired" || data.status === "cancelled") {
          localStorage.setItem("subscriptionExpired", "true");
          setExpired(true);
        } else {
          localStorage.removeItem("subscriptionExpired");
          setExpired(false);
        }
      } catch (err: any) {
        const status = err?.response?.status;
        const isSubExpired = err?.response?.data?.subscriptionExpired === true;
        if (status === 403 && isSubExpired) {
          localStorage.setItem("subscriptionExpired", "true");
          setExpired(true);
        } else {
          console.warn("Subscription check failed (non-fatal):", status, err?.message);
          setExpired(false);
        }
      } finally {
        setChecking(false);
      }
    };
    checkSubscription();
  }, [token, location.pathname]);

  // No token = not logged in
  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Show spinner while checking subscription
  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-slate-700" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
        </div>
      </div>
    );
  }

  // Subscription expired — redirect
  const isExpired = expired || localStorage.getItem("subscriptionExpired") === "true";
  if (isExpired && location.pathname !== "/subscription-expired" && location.pathname !== "/subscriptions") {
    return <Navigate to="/subscription-expired" replace />;
  }

  // Role-based route guards
  const userData = localStorage.getItem("user");
  const userRole = userData ? JSON.parse(userData)?.role : null;
  const adminRoutes = ["/dashboard", "/tenants", "/students", "/teachers", "/fees", "/exams", "/settings", "/classes", "/subjects", "/academic-years", "/attendance", "/reports", "/library", "/transport", "/backup", "/subscriptions", "/hostel", "/hr", "/communication", "/certificates", "/inventory", "/admission"];
  const isAdminRoute = adminRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + "/"));

  if (userRole === "STUDENT" && isAdminRoute) {
    return <Navigate to="/student-portal" replace />;
  }
  if (userRole === "TEACHER" && isAdminRoute) {
    return <Navigate to="/teacher-portal" replace />;
  }
  if (userRole === "PRINCIPAL" && isAdminRoute) {
    return <Navigate to="/principal-portal" replace />;
  }

  return <>
    <Outlet />
    <YnAiAssistant />
  </>;
}

//////////////////////////////////////////////////////
// Layout (with Sidebar + TopNavbar + Suspense)
//////////////////////////////////////////////////////
function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

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

  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("themeColor");
    if (savedTheme) {
      document.documentElement.style.setProperty("--primary-color", savedTheme);
    }

    // Initialize dark mode from localStorage
    const savedDarkMode = localStorage.getItem("theme");
    if (savedDarkMode === "dark") {
      document.documentElement.classList.add("dark");
    } else if (savedDarkMode === "light") {
      document.documentElement.classList.remove("dark");
    }

    const fetchBranding = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const url =
          user?.role === "SUPER_ADMIN"
            ? "/api/super-admin/settings"
            : "/api/settings";

        const res = await axios.get(url);
        const data = res.data?.data;
        const color = data?.platform?.primaryColor || data?.tenant?.primaryColor;
        if (color) {
          document.documentElement.style.setProperty("--primary-color", color);
          localStorage.setItem("themeColor", color);
        }
      } catch (err) {
        console.error("Branding fetch error", err);
      }
    };
    fetchBranding();
  }, []);

  return (
    <div className="flex min-h-screen min-h-[100dvh] relative bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Sidebar Backdrop (mobile only) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[999] md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[1000] w-[280px] transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Sidebar navigation"
      >
        <Sidebar tenant={tenant} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 main-content-wrapper md:ml-[280px] transition-[margin] duration-300">
        {/* Hamburger (mobile only) */}
        <button
          className="hamburger-btn fixed top-3 left-3 z-[990] p-2.5 bg-primary-500 text-white rounded-xl shadow-lg md:hidden tap-target active:scale-95 transition-transform"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <TopNavbar tenant={tenant} />
        
        <main className="flex-1 p-2 md:p-3 overflow-auto" role="main">
          <Suspense fallback={<PageLoader />}>
            <div className="page-container">
              <Outlet context={{ setTenant }} />
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

//////////////////////////////////////////////////////
// Role Dashboard
//////////////////////////////////////////////////////
function RoleDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user?.role === "SUPER_ADMIN") return <SuperAdminDashboard />;
  if (user?.role === "STUDENT") return <Navigate to="/student-portal" />;
  if (user?.role === "TEACHER") return <Navigate to="/teacher-portal" />;
  if (user?.role === "PRINCIPAL") return <Navigate to="/principal-portal" />;
  return <TenantDashboard />;
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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ===== PUBLIC ROUTES ===== */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register-school" element={<RegisterSchool />} />

          {/* ===== PROTECTED ROUTES ===== */}
          <Route element={<ProtectedRoute />}>

            {/* 🔥 SUBSCRIPTION EXPIRED PAGE (No Sidebar/Navbar) */}
            <Route path="/subscription-expired" element={<SubscriptionExpired />} />

            {/* ━━━ PRINT ROUTES — No Sidebar, No Navbar ━━━ */}
            <Route path="/print/report-card/:examId/bulk" element={<BulkReportCard />} />
            <Route path="/print/report-card/:examId/:studentId" element={<ReportCard />} />
            <Route path="/print/consolidated/:studentId" element={<ConsolidatedReportCard />} />

            {/* ━━━ STUDENT PORTAL — Separate Layout ━━━ */}
            <Route path="/student-portal" element={<StudentDashboard />} />

            {/* ━━━ TEACHER PORTAL — Separate Layout ━━━ */}
            <Route path="/teacher-portal" element={<TeacherPortal />} />

            {/* ━━━ PRINCIPAL PORTAL — Separate Layout ━━━ */}
            <Route path="/principal-portal" element={<PrincipalPortal />} />

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* NORMAL ROUTES — With Sidebar + Navbar              */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <Route element={<Layout />}>
              {/* DASHBOARD */}
              <Route path="/dashboard" element={<RoleDashboard />} />

              {/* TENANTS (SuperAdmin only) */}
              <Route path="/tenants" element={<TenantsPage />} />

              {/* SUBSCRIPTIONS */}
              <Route path="/subscriptions" element={<SubscriptionsPage />} />

              {/* REPORTS */}
              <Route path="/student-profile" element={<StudentProfilePage />} />
              <Route path="/certificates" element={<CertificateGenerator />} />
              <Route path="/reports" element={<ReportsPage />} />

              {/* LIBRARY */}
              <Route path="/library" element={<LibraryDashboard />} />

              {/* SETTINGS */}
              <Route path="/settings" element={<RoleSettings />} />
              <Route path="/settings/users" element={<TenantAdminSettings />} />
              <Route path="/settings/theme" element={<ThemePage />} />
              <Route path="/settings/subscription" element={<SubscriptionSettings />} />

              {/* SIGNATURE MASTER */}
              <Route path="/signature-master" element={<SignatureMaster />} />

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

              {/* TEACHER MODULE */}
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
              <Route path="/teacher-id-card" element={<TeacherIdCard />} />

              {/* TIMETABLE */}
              <Route path="/timeTable" element={<TimetablePage />} />

              {/* TRANSPORT */}
              <Route path="/transport" element={<TransportDashboard />} />
              <Route path="/transport/tracking" element={<TransportTracking />} />

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
              <Route path="/fees/receipts" element={<FeeReceiptsPage />} />
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
              <Route path="/exam-seating-plan" element={<SeatingArrangementPage />} />
              <Route path="/exam-admit-card" element={<AdmitCardPage />} />
              <Route path="/rooms" element={<RoomManagement />} />
              <Route path="/exam-question-papers/:id" element={<QuestionPaper />} />
              <Route path="/exam-invigilators/:id" element={<InvigilatorAssignment />} />
              <Route path="/exam-reports" element={<ExamReports />} />
              <Route path="/report-card-select" element={<ReportCardSelect />} />

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {/* NEW MODULE ROUTES                                  */}
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

              {/* HOSTEL MODULE */}
              <Route path="/hostel" element={<RoomAllocation />} />
              <Route path="/hostel/rooms" element={<RoomAllocation />} />
              <Route path="/hostel/fees" element={<HostelFees />} />
              <Route path="/hostel/mess" element={<MessManage />} />

              {/* HR MODULE */}
              <Route path="/hr" element={<StaffList />} />
              <Route path="/hr/staff" element={<StaffList />} />
              <Route path="/hr/payroll" element={<Payroll />} />
              <Route path="/hr/leave" element={<LeaveManage />} />
              <Route path="/hr/attendance" element={<StaffAttendance />} />

              {/* COMMUNICATION MODULE */}
              <Route path="/communication/notices" element={<NoticeBoard />} />
              <Route path="/communication/sms" element={<SMSSend />} />
              <Route path="/communication/whatsapp" element={<WhatsAppSend />} />
              <Route path="/communication/circular" element={<CircularCreate />} />

              {/* CERTIFICATES MODULE */}
              <Route path="/certificates/tc" element={<TCGenerate />} />
              <Route path="/certificates/character" element={<CharacterCert />} />
              <Route path="/certificates/migration" element={<MigrationCert />} />

              {/* INVENTORY MODULE */}
              <Route path="/inventory" element={<AssetList />} />
              <Route path="/inventory/assets" element={<AssetList />} />
              <Route path="/inventory/issue" element={<AssetIssue />} />
              <Route path="/inventory/stock" element={<StockManage />} />

              {/* ADMISSION MODULE */}
              <Route path="/admission" element={<AdmissionList />} />
              <Route path="/admission/new" element={<NewAdmission />} />
              <Route path="/admission/:id" element={<AdmissionDetail />} />

              {/* DESIGNER */}
              <Route path="/designer/:type" element={<DesignerPage />} />

              {/* YN-UDP Template Designer */}
              <Route path="/yn-udp" element={<YnUdpPage />} />

              <Route path="/analytics" element={<AnalyticsPage />} />

              {/* BACKUP */}
              <Route path="/backup" element={<BackupPage />} />
            </Route>
          </Route>

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
