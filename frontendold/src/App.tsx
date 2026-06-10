
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
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

// Subscriptions
import SubscriptionsPage from "./pages/subscriptions/SubscriptionsPage";

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

// Teachers
import Teachers from "./pages/teachers/Teachers";
import AddEditTeacher from "./pages/teachers/AddEditTeacher";
import TimetablePage from "./pages/timeTable/TimetablePage";

// Fees Module
import FeeHeadPage from "./pages/fees/FeeHeadPage";
import FeeStructurePage from "./pages/fees/FeeStructurePage";
import FeeDiscountPage from "./pages/fees/FeeDiscountPage";
import FineRulePage from "./pages/fees/FineRulePage";
import FeeCollectionPage from "./pages/fees/FeeCollectionPage";

// Exam Module
import ExamList from "./pages/exams/ExamList";
import GradeSettings from "./pages/exams/GradeSettings";
import CreateEditExam from "./pages/exams/CreateEditExam";
import ExamSubjects from "./pages/exams/ExamSubjects";
import MarksEntry from "./pages/exams/MarksEntry";
import Results from "./pages/exams/Results";
import ReportCard from "./pages/exams/ReportCard";
import ConsolidatedReportCard from "./pages/exams/ConsolidatedReportCard";

///attendance
// App.tsx ya routes file mein
import AttendancePage from "./pages/AttendancePage/AttendancePage";
import AttendanceReportPage from "./pages/AttendancePage/AttendanceReportPage";



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

//////////////////////////////////////////////////////
// Protected Route
//////////////////////////////////////////////////////
function ProtectedRoute() {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
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

        {/* ===== PROTECTED ROUTES ===== */}
        <Route element={<ProtectedRoute />}>

          {/* ─────────────────────────────────────────── */}
          {/* PRINT ROUTES — No Sidebar, No Navbar       */}
          {/* (Outside Layout, so clean print)           */}
          {/* ─────────────────────────────────────────── */}
          <Route path="/print/report-card/:examId/:studentId" element={<ReportCard />} />
          <Route path="/print/consolidated/:studentId" element={<ConsolidatedReportCard />} />

          {/* ─────────────────────────────────────────── */}
          {/* NORMAL ROUTES — With Sidebar + Navbar      */}
          {/* ─────────────────────────────────────────── */}
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

            {/*attendence*/}
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/attendance-report" element={<AttendanceReportPage />} />
            
            {/* STUDENT MODULE */}
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/new-admission" element={<AdmissionForm />} />
            <Route path="/students/old-entry" element={<OldStudentEntry />} />
            <Route path="/students/promotion" element={<PromotionPage />} />
            <Route path="/students/age-settings" element={<AgeSettings />} />
            <Route path="/students/print" element={<PrintStudents />} />
            <Route path="/students/recycle-bin" element={<RecycleBinPage />} />
            <Route path="/students/:id/edit" element={<EditStudentPage />} />
            <Route path="/students/id-card" element={<StudentIdCardPage />} />

            {/* ACADEMIC */}
            <Route path="/academic-years" element={<AcademicYearPage />} />
            <Route path="/classes" element={<ClassesPage />} />
            <Route path="/Sections" element={<Sections />} />
            <Route path="/subjects" element={<SubjectsPage />} />

            {/* TEACHERS */}
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/teachers/add" element={<AddEditTeacher />} />
            <Route path="/teachers/edit/:id" element={<AddEditTeacher />} />

            {/* TIMETABLE */}
            <Route path="/timeTable" element={<TimetablePage />} />

            {/* FEES MODULE */}
            <Route path="/fees" element={<FeeCollectionPage />} />
            <Route path="/fees/heads" element={<FeeHeadPage />} />
            <Route path="/fees/structures" element={<FeeStructurePage />} />
            <Route path="/fees/discounts" element={<FeeDiscountPage />} />
            <Route path="/fees/fine-rules" element={<FineRulePage />} />
            <Route path="/fees/collection" element={<FeeCollectionPage />} />

            {/* EXAM MODULE — Static routes FIRST */}
            <Route path="/grade-settings" element={<GradeSettings />} />
            <Route path="/exams/consolidated-report/:studentId" element={<ConsolidatedReportCard />} />
            <Route path="/exams/create" element={<CreateEditExam />} />
            <Route path="/exams/edit/:id" element={<CreateEditExam />} />
            <Route path="/exams/:id/subjects" element={<ExamSubjects />} />
            <Route path="/exams/:id/marks" element={<MarksEntry />} />
            <Route path="/exams/:id/results" element={<Results />} />
            <Route path="/exams/:examId/report-card/:studentId" element={<ReportCard />} />
            <Route path="/exams" element={<ExamList />} />
          </Route>
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

