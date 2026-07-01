import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useState, useEffect, lazy, Suspense, Component, ReactNode } from "react";
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

// 🔄 Retry wrapper for lazy imports — handles chunk load failures on slow mobile networks
function lazyWithRetry(importFn: () => Promise<any>) {
  return lazy(() =>
    importFn().catch((error: any) => {
      // On chunk load failure, retry once after a short delay
      return new Promise<any>((resolve) => setTimeout(resolve, 1500))
        .then(() => importFn())
        .catch(() => {
          // If retry also fails, reload the page to clear stale chunk cache
          // Only reload if we haven't already (prevent infinite loop)
          const hasReloaded = sessionStorage.getItem("chunk_reload");
          if (!hasReloaded) {
            sessionStorage.setItem("chunk_reload", "1");
            window.location.reload();
          }
          throw error; // let ErrorBoundary handle it
        });
    })
  );
}

// Auth
const LoginPage = lazyWithRetry(() => import("./pages/login/LoginPages"));
const ForgotPassword = lazyWithRetry(() => import("./pages/login/ForgotPassword"));
const RegisterSchool = lazyWithRetry(() => import("./pages/login/RegisterSchool"));

// Dashboards
const TenantDashboard = lazyWithRetry(() => import("./pages/TenantDashboard"));
const SuperAdminDashboard = lazyWithRetry(() => import("./pages/superAdmin/SuperAdminDashboard"));

// SuperAdmin Pages
const TenantsPage = lazyWithRetry(() => import("./pages/superAdmin/TenantsPage"));
const SuperAdminSettings = lazyWithRetry(() => import("./pages/superAdmin/SuperAdminSettings"));

// Student Module
const StudentsPage = lazyWithRetry(() => import("./pages/students/StudentsPage"));
const AdmissionForm = lazyWithRetry(() => import("./pages/students/AdmissionForm"));
const OldStudentEntry = lazyWithRetry(() => import("./pages/students/OldStudentEntry"));
const PromotionPage = lazyWithRetry(() => import("./pages/students/PromotionPage"));
const AgeSettings = lazyWithRetry(() => import("./pages/students/AgeSettings"));
const PrintStudents = lazyWithRetry(() => import("./pages/students/PrintStudents"));
const RecycleBinPage = lazyWithRetry(() => import("./pages/students/RecycleBinPage"));
const EditStudentPage = lazyWithRetry(() => import("./pages/students/EditStudentPage"));
const StudentIdCardPage = lazyWithRetry(() => import("./pages/students/StudentIdCard"));
const StudentReportsPage = lazyWithRetry(() => import("./pages/students/StudentReportsPage"));
const AdminStudentDashboard = lazyWithRetry(() => import("./pages/students/AdminStudentDashboard"));
const StudentDashboard = lazyWithRetry(() => import("./pages/students/StudentDashboard"));
const StudentProfilePage = lazyWithRetry(() => import("./pages/students/StudentProfilePage"));

// Reports
const ReportsPage = lazyWithRetry(() => import("./pages/reports/ReportsPage"));
const CertificateGenerator = lazyWithRetry(() => import("./pages/reports/CertificateGenerator"));
const AnalyticsPage = lazyWithRetry(() => import("./pages/reports/AnalyticsPage"));

// Subscriptions
const SubscriptionsPage = lazyWithRetry(() => import("./pages/subscriptions/SubscriptionsPage"));
const SubscriptionSettings = lazyWithRetry(() => import("./pages/subscriptions/SubscriptionSettings"));
const SubscriptionExpired = lazyWithRetry(() => import("./pages/subscriptions/SubscriptionExpired"));

// Settings
const TenantAdminSettings = lazyWithRetry(() => import("./pages/settings/TenantAdminSettings"));
const SignatureMaster = lazyWithRetry(() => import("./pages/settings/SignatureMaster"));
const ThemePage = lazyWithRetry(() => import("./pages/settings/theme/ThemePage"));
const SettingsPage = lazyWithRetry(() => import("./pages/SettingsPage"));

// Academic Year
const AcademicYearPage = lazyWithRetry(() => import("./pages/academic-year/AcademicYearPage"));

// Classes
const ClassesPage = lazyWithRetry(() => import("./pages/classes/ClassesPage"));

// Sections
const Sections = lazyWithRetry(() => import("./pages/Sections/SectionsPage"));

// Subjects
const SubjectsPage = lazyWithRetry(() => import("./pages/Subjects/SubjectsPage"));

// Teachers
const Teachers = lazyWithRetry(() => import("./pages/teachers/Teachers"));
const AddEditTeacher = lazyWithRetry(() => import("./pages/teachers/AddEditTeacher"));
const TeacherDashboard = lazyWithRetry(() => import("./pages/teachers/TeacherDashboard"));
const TeacherProfile = lazyWithRetry(() => import("./pages/teachers/TeacherProfile"));
const AssignSubjectToTeacher = lazyWithRetry(() => import("./pages/teachers/AssignSubjectToTeacher"));
const TeacherTimetable = lazyWithRetry(() => import("./pages/teachers/TeacherTimetable"));
const TeacherAttendance = lazyWithRetry(() => import("./pages/teachers/TeacherAttendance"));
const LeaveManagement = lazyWithRetry(() => import("./pages/teachers/LeaveManagement"));
const TeacherSalary = lazyWithRetry(() => import("./pages/teachers/TeacherSalary"));
const TeacherPerformance = lazyWithRetry(() => import("./pages/teachers/TeacherPerformance"));
const TeacherDocuments = lazyWithRetry(() => import("./pages/teachers/TeacherDocuments"));
const Communication = lazyWithRetry(() => import("./pages/teachers/Communication"));
const TeacherReports = lazyWithRetry(() => import("./pages/teachers/TeacherReports"));
const TeacherSettings = lazyWithRetry(() => import("./pages/teachers/TeacherSettings"));
const TeacherIdCard = lazyWithRetry(() => import("./pages/teachers/TeacherIdCard"));
const TeacherPortal = lazyWithRetry(() => import("./pages/teachers/TeacherPortal"));

// Principal
const PrincipalPortal = lazyWithRetry(() => import("./pages/principal/PrincipalPortal"));

// Timetable
const TimetablePage = lazyWithRetry(() => import("./pages/timeTable/TimetablePage"));

// Fees Module
const FeeHeadPage = lazyWithRetry(() => import("./pages/fees/FeeHeadPage"));
const FeeStructurePage = lazyWithRetry(() => import("./pages/fees/FeeStructurePage"));
const FeeDiscountPage = lazyWithRetry(() => import("./pages/fees/FeeDiscountPage"));
const FineRulePage = lazyWithRetry(() => import("./pages/fees/FineRulePage"));
const FeeCollectionPage = lazyWithRetry(() => import("./pages/fees/FeeCollectionPage"));
const FeeDashboardPage = lazyWithRetry(() => import("./pages/fees/FeeDashboardPage"));
const AssignFeeStructurePage = lazyWithRetry(() => import("./pages/fees/AssignFeeStructurePage"));
const FeeReportsPage = lazyWithRetry(() => import("./pages/fees/FeeReportsPage"));
const FeeReceiptsPage = lazyWithRetry(() => import("./pages/fees/FeeReceiptsPage"));
const DueFeesPage = lazyWithRetry(() => import("./pages/fees/DueFeesPage"));
const StudentLedgerPage = lazyWithRetry(() => import("./pages/fees/StudentLedgerPage"));
const FeeReminderPage = lazyWithRetry(() => import("./pages/fees/FeeReminderPage"));
const FeeSettingsPage = lazyWithRetry(() => import("./pages/fees/FeeSettingsPage"));

// Exam Module
const ExamList = lazyWithRetry(() => import("./pages/exams/ExamList"));
const GradeSettings = lazyWithRetry(() => import("./pages/exams/GradeSettings"));
const CreateEditExam = lazyWithRetry(() => import("./pages/exams/CreateEditExam"));
const ExamSubjects = lazyWithRetry(() => import("./pages/exams/ExamSubjects"));
const MarksEntry = lazyWithRetry(() => import("./pages/exams/MarksEntry"));
const Results = lazyWithRetry(() => import("./pages/exams/Results"));
const ReportCard = lazyWithRetry(() => import("./pages/exams/ReportCard"));
const BulkReportCard = lazyWithRetry(() => import("./pages/exams/BulkReportCard"));
const ConsolidatedReportCard = lazyWithRetry(() => import("./pages/exams/ConsolidatedReportCard"));
const ExamSchedule = lazyWithRetry(() => import("./pages/exams/ExamSchedule"));
const SeatingArrangement = lazyWithRetry(() => import("./pages/exams/SeatingArrangement"));
const AdmitCard = lazyWithRetry(() => import("./pages/exams/AdmitCard"));
const QuestionPaper = lazyWithRetry(() => import("./pages/exams/QuestionPaper"));
const InvigilatorAssignment = lazyWithRetry(() => import("./pages/exams/InvigilatorAssignment"));
const ExamDashboard = lazyWithRetry(() => import("./pages/exams/ExamDashboard"));
const ExamReports = lazyWithRetry(() => import("./pages/exams/ExamReports"));
const SeatingArrangementPage = lazyWithRetry(() => import("./pages/exams/SeatingArrangementPage"));
const RoomManagement = lazyWithRetry(() => import("./pages/exams/RoomManagement"));
const AdmitCardPage = lazyWithRetry(() => import("./pages/exams/AdmitCardPage"));
const ReportCardSelect = lazyWithRetry(() => import("./pages/exams/ReportCardSelect"));

// Designer
const DesignerPage = lazyWithRetry(() => import("./pages/designer/DesignerPage"));

// YN-UDP Template Designer
const YnUdpPage = lazyWithRetry(() => import("./pages/yn-udp/YnUdpPage"));

// Attendance
const AttendancePage = lazyWithRetry(() => import("./pages/AttendancePage/AttendancePage"));
const AttendanceReportPage = lazyWithRetry(() => import("./pages/AttendancePage/AttendanceReportPage"));
const AttendanceDashboardPage = lazyWithRetry(() => import("./pages/AttendancePage/AttendanceDashboardPage"));

// Library
const LibraryDashboard = lazyWithRetry(() => import("./pages/library/LibraryDashboard"));

// Transport
const TransportDashboard = lazyWithRetry(() => import("./pages/transport/TransportDashboard"));
const TransportTracking = lazyWithRetry(() => import("./pages/transport/TransportTracking"));

// Backup
const BackupPage = lazyWithRetry(() => import("./pages/backup/BackupPage"));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NEW MODULE IMPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Hostel Module
const RoomAllocation = lazyWithRetry(() => import("./pages/hostel/RoomAllocation"));
const HostelFees = lazyWithRetry(() => import("./pages/hostel/HostelFees"));
const MessManage = lazyWithRetry(() => import("./pages/hostel/MessManage"));

// HR Module
const StaffList = lazyWithRetry(() => import("./pages/hr/StaffList"));
const Payroll = lazyWithRetry(() => import("./pages/hr/Payroll"));
const LeaveManage = lazyWithRetry(() => import("./pages/hr/LeaveManage"));
const StaffAttendance = lazyWithRetry(() => import("./pages/hr/StaffAttendance"));

// Communication Module
const NoticeBoard = lazyWithRetry(() => import("./pages/communication/NoticeBoard"));
const SMSSend = lazyWithRetry(() => import("./pages/communication/SMSSend"));
const WhatsAppSend = lazyWithRetry(() => import("./pages/communication/WhatsAppSend"));
const CircularCreate = lazyWithRetry(() => import("./pages/communication/CircularCreate"));

// Certificates Module
const TCGenerate = lazyWithRetry(() => import("./pages/certificates/TCGenerate"));
const CharacterCert = lazyWithRetry(() => import("./pages/certificates/CharacterCert"));
const MigrationCert = lazyWithRetry(() => import("./pages/certificates/MigrationCert"));

// Inventory Module
const AssetList = lazyWithRetry(() => import("./pages/inventory/AssetList"));
const AssetIssue = lazyWithRetry(() => import("./pages/inventory/AssetIssue"));
const StockManage = lazyWithRetry(() => import("./pages/inventory/StockManage"));

// Admission Module
const AdmissionList = lazyWithRetry(() => import("./pages/admission/AdmissionList"));
const NewAdmission = lazyWithRetry(() => import("./pages/admission/NewAdmission"));
const AdmissionDetail = lazyWithRetry(() => import("./pages/admission/AdmissionDetail"));


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENTERPRISE MODULE IMPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Gate Pass
const GatePassDashboard = lazyWithRetry(() => import("./pages/gate-pass/GatePassDashboard"));
// Events
const EventDashboard = lazyWithRetry(() => import("./pages/events/EventDashboard"));
// Help Desk
const HelpDeskDashboard = lazyWithRetry(() => import("./pages/helpdesk/HelpDeskDashboard"));
// Workflow Engine
const WorkflowEngine = lazyWithRetry(() => import("./pages/workflow/WorkflowEngine"));
// Form Builder
const FormBuilder = lazyWithRetry(() => import("./pages/form-builder/FormBuilder"));
// Report Builder
const ReportBuilder = lazyWithRetry(() => import("./pages/report-builder/ReportBuilder"));
// Audit
const AuditDashboard = lazyWithRetry(() => import("./pages/audit/AuditDashboard"));
// Scheduler
const SchedulerDashboard = lazyWithRetry(() => import("./pages/scheduler/SchedulerDashboard"));
// Dashboard Builder
const DashboardBuilder = lazyWithRetry(() => import("./pages/dashboard-builder/DashboardBuilder"));
// QR / Barcode
const QRManager = lazyWithRetry(() => import("./pages/qr-barcode/QRManager"));
// Payment Gateway
const PaymentGateway = lazyWithRetry(() => import("./pages/payment-gateway/PaymentGateway"));
// File Manager
const FileManager = lazyWithRetry(() => import("./pages/file-manager/FileManager"));
// Notifications
const NotificationCenter = lazyWithRetry(() => import("./pages/notifications/NotificationCenter"));
// Import/Export
const ImportExport = lazyWithRetry(() => import("./pages/import-export/ImportExport"));
// Queue Monitor
const QueueMonitor = lazyWithRetry(() => import("./pages/queue/QueueMonitor"));
// Digital Signature
const DigitalSignature = lazyWithRetry(() => import("./pages/digital-signature/DigitalSignature"));
// Multi-Language
const LanguageManager = lazyWithRetry(() => import("./pages/i18n/LanguageManager"));
// AI Assistant
const AIAssistant = lazyWithRetry(() => import("./pages/ai-assistant/AIAssistant"));
// Master Module
const MasterModule = lazyWithRetry(() => import("./pages/masters/MasterModule"));

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
      // Skip redirect for print/report pages
      const path = window.location.pathname;
      if (path.includes("/print") || path.includes("/report-card") || path.includes("/consolidated") || path.includes("/exams/")) {
        return Promise.reject(error);
      }
      // Skip on localhost (dev mode)
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return Promise.reject(error);
      }
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
// 🛡️ Error Boundary — catches chunk load failures on mobile
//////////////////////////////////////////////////////
class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message?.includes('Loading chunk') || 
                           this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
                           this.state.error?.message?.includes('error loading dynamically imported module');
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isChunkError ? "Page failed to load" : "Something went wrong"}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {isChunkError ? "Please check your internet connection and try again." : (this.state.error?.message || "An unexpected error occurred.")}
          </p>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
      const skipPaths = ["/subscription-expired", "/subscriptions", "/print/", "/report-card", "/consolidated", "/exams/"];
      if (skipPaths.some(p => location.pathname === p || location.pathname.includes(p))) {
        setChecking(false);
        return;
      }

      // ═══ DEV MODE: Skip subscription check on localhost ═══
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        localStorage.removeItem("subscriptionExpired");
        setExpired(false);
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
  // Skip subscription redirect for print/report/exam pages
  const skipRedirectPaths = ["/subscription-expired", "/subscriptions", "/print", "/report-card", "/consolidated", "/exams/"];
  const shouldSkipRedirect = skipRedirectPaths.some(p => location.pathname.includes(p));
  if (isExpired && !shouldSkipRedirect) {
    return <Navigate to="/subscription-expired" replace />;
  }

  // 🔥 FIXED: Direct allow print paths on mobile browser redirects to bypass strict structural array blockers
  if (location.pathname.startsWith("/print/")) {
    return (
      <AppErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
          <YnAiAssistant />
        </Suspense>
      </AppErrorBoundary>
    );
  }

  // Role-based route guards
  const userData = localStorage.getItem("user");
  const userRole = userData ? JSON.parse(userData)?.role : null;
  const adminRoutes = ["/dashboard", "/tenants", "/students", "/teachers", "/fees", "/exams", "/settings", "/classes", "/subjects", "/academic-years", "/attendance", "/reports", "/library", "/transport", "/backup", "/subscriptions", "/hostel", "/hr", "/communication", "/certificates", "/inventory", "/admission", "/gate-pass", "/events", "/helpdesk", "/workflow", "/form-builder", "/report-builder", "/audit", "/scheduler", "/dashboard-builder", "/qr-barcode", "/payment-gateway", "/file-manager", "/notifications", "/import-export", "/queue-monitor", "/digital-signature", "/languages", "/ai-assistant", "/masters"];
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

  return (
    <AppErrorBoundary>
      <Outlet />
      <YnAiAssistant />
    </AppErrorBoundary>
  );
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
      <Sidebar 
        tenant={tenant} 
        sidebarOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 main-content-wrapper md:ml-[260px] transition-all duration-300 bg-slate-50 dark:bg-slate-950 min-h-screen">
        {/* Hamburger (mobile only) */}
        <button
          className={`hamburger-btn fixed top-3 left-3 z-[9999] p-2.5 bg-primary-600 text-white rounded-xl shadow-lg md:hidden tap-target active:scale-95 transition-all duration-300 ${sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <TopNavbar tenant={tenant} />

        <main className="flex-1 p-2 md:p-3 overflow-auto" role="main">
          <AppErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <div className="page-container">
                <Outlet context={{ setTenant }} />
              </div>
            </Suspense>
          </AppErrorBoundary>
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
  // Clear chunk reload flag on successful app mount
  sessionStorage.removeItem("chunk_reload");
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

            {/* ━━━ PORTALS ━━━ */}
            <Route path="/student-portal" element={<StudentDashboard />} />
            <Route path="/teacher-portal" element={<TeacherPortal />} />
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

              <Route path="/timeTable" element={<TimetablePage />} />
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
              <Route path="/fees/due" element={<DueFeesPage />} />
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

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {/* ENTERPRISE MODULES                                  */}
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

              {/* GATE PASS */}
              <Route path="/gate-pass" element={<GatePassDashboard />} />

              {/* EVENTS */}
              <Route path="/events" element={<EventDashboard />} />

              {/* HELP DESK */}
              <Route path="/helpdesk" element={<HelpDeskDashboard />} />

              {/* FOUNDATION ENGINES */}
              <Route path="/workflow" element={<WorkflowEngine />} />
              <Route path="/form-builder" element={<FormBuilder />} />
              <Route path="/report-builder" element={<ReportBuilder />} />
              <Route path="/audit" element={<AuditDashboard />} />
              <Route path="/scheduler" element={<SchedulerDashboard />} />
              <Route path="/dashboard-builder" element={<DashboardBuilder />} />

              {/* ENTERPRISE FEATURES */}
              <Route path="/qr-barcode" element={<QRManager />} />
              <Route path="/payment-gateway" element={<PaymentGateway />} />
              <Route path="/file-manager" element={<FileManager />} />
              <Route path="/notifications" element={<NotificationCenter />} />
              <Route path="/import-export" element={<ImportExport />} />
              <Route path="/queue-monitor" element={<QueueMonitor />} />
              <Route path="/digital-signature" element={<DigitalSignature />} />
              <Route path="/languages" element={<LanguageManager />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />

              {/* MASTER MODULE */}
              <Route path="/masters" element={<MasterModule />} />
              <Route path="/masters/:category" element={<MasterModule />} />
              <Route path="/masters/:category/:model" element={<MasterModule />} />

            </Route>
          </Route>

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
