
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE LOADER (lightweight spinner shown while pages load)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
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

// Backup
const BackupPage = lazy(() => import("./pages/backup/BackupPage"));


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
        // Only treat 403 with subscriptionExpired flag as actual expiry
        // Network errors / 500s should NOT redirect to expired page
        const status = err?.response?.status;
        const isSubExpired = err?.response?.data?.subscriptionExpired === true;
        if (status === 403 && isSubExpired) {
          localStorage.setItem("subscriptionExpired", "true");
          setExpired(true);
        } else {
          // Network error or server error — let user through
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
    return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  // Subscription expired — redirect
  const isExpired = expired || localStorage.getItem("subscriptionExpired") === "true";
  if (isExpired && location.pathname !== "/subscription-expired" && location.pathname !== "/subscriptions") {
    return <Navigate to="/subscription-expired" replace />;
  }

  return <Outlet />;
}

//////////////////////////////////////////////////////
// Layout (with Sidebar + TopNavbar + Suspense)
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
    const savedTheme = localStorage.getItem("themeColor");
    if (savedTheme) {
      document.documentElement.style.setProperty("--primary-color", savedTheme);
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
    <div className="flex min-h-screen">
      <Sidebar tenant={tenant} />
      <div className="flex-1 bg-gray-100 p-6">
        <TopNavbar tenant={tenant} />
        {/* ✅ Suspense boundary inside Layout — Sidebar stays visible during page transitions */}
        <Suspense fallback={<PageLoader />}>
          <Outlet context={{ setTenant }} />
        </Suspense>
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

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* PRINT ROUTES — No Sidebar, No Navbar       */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <Route path="/print/report-card/:examId/bulk" element={<BulkReportCard />} />
            <Route path="/print/report-card/:examId/:studentId" element={<ReportCard />} />
            <Route path="/print/consolidated/:studentId" element={<ConsolidatedReportCard />} />

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* STUDENT PORTAL — Separate Layout             */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <Route path="/student-portal" element={<StudentDashboard />} />

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* NORMAL ROUTES — With Sidebar + Navbar      */}
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

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {/* TEACHER MODULE (Complete)                   */}
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
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
              <Route path="/transport" element={<TransportDashboard />} />

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

              {/* Exam - Standalone Pages (Sidebar accessible) */}
              <Route path="/exam-seating-plan" element={<SeatingArrangementPage />} />
              <Route path="/exam-admit-card" element={<AdmitCardPage />} />
              <Route path="/rooms" element={<RoomManagement />} />

              <Route path="/exam-question-papers/:id" element={<QuestionPaper />} />
              <Route path="/exam-invigilators/:id" element={<InvigilatorAssignment />} />
              <Route path="/exam-reports" element={<ExamReports />} />

              <Route path="/report-card-select" element={<ReportCardSelect />} />

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
