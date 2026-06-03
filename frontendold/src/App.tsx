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
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

import TenantManagement from "./pages/TenantManagement";

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
// Subscriptions
import SubscriptionsPage from "./pages/subscriptions/SubscriptionsPage";
import ReportsPage from "./pages/ReportsPage";

// superadmin settings
import SettingsPage from "./pages/SettingsPage";
// academic year
import AcademicYearPage from "./pages/academic-year/AcademicYearPage";
// classes
import ClassesPage from "./pages/classes/ClassesPage";
// sections
import Sections from "./pages/Sections/SectionsPage";
// subjects
import SubjectsPage from "./pages/Subjects/SubjectsPage";

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
// Layout
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
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const color = res.data.data.platform.primaryColor;
        if (color) {
          document.documentElement.style.setProperty("--primary-color", color);
        }
      } catch (err) {
        console.error("Branding fetch error");
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
// App
//////////////////////////////////////////////////////
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* PROTECTED ROUTES */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {/* DASHBOARD */}
            <Route path="/dashboard" element={<RoleDashboard />} />

            {/* TENANTS */}
            <Route path="/tenants" element={<TenantManagement />} />

            {/* SUBSCRIPTIONS */}
            <Route path="/subscriptions" element={<SubscriptionsPage />} />

            {/* REPORTS */}
            <Route path="/reports" element={<ReportsPage />} />

            {/* SETTINGS */}
            <Route path="/settings" element={<SettingsPage />} />

            {/* STUDENT MODULE */}
            {/* STUDENT MODULE */}
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/new-admission" element={<AdmissionForm />} />
            <Route path="/students/old-entry" element={<OldStudentEntry />} />
            <Route path="/students/promotion" element={<PromotionPage />} />
            <Route path="/students/age-settings" element={<AgeSettings />} />
            <Route path="/students/print" element={<PrintStudents />} />
            <Route path="/students/recycle-bin" element={<RecycleBinPage />} />
            <Route path="/students/:id/edit" element={<EditStudentPage />} />

            {/* ACADEMIC */}
            <Route path="/academic-years" element={<AcademicYearPage />} />
            <Route path="/classes" element={<ClassesPage />} />
            <Route path="/Sections" element={<Sections />} />
            <Route path="/subjects" element={<SubjectsPage />} />
          </Route>
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}