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

// Student
import StudentsPage from "./pages/students/StudentsPage";

// ✅ YOUR STRUCTURE ACCORDING IMPORT
import SubscriptionsPage from "./pages/subscriptions/SubscriptionsPage";
import ReportsPage from "./pages/ReportsPage";

// superadmin settings
import SettingsPage from "./pages/SettingsPage";
//academic year 
import AcademicYearPage from "./pages/academic-year/AcademicYearPage";
//classes
import ClassesPage from "./pages/classes/ClassesPage";
//sections
import Sections from "./pages/Sections/SectionsPage"
//subjects
import SubjectsPage from "./pages/subjects/SubjectsPage";
//////////////////////////////////////////////////////
// 🔒 Protected Route
//////////////////////////////////////////////////////

function ProtectedRoute() {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return (
      <Navigate
        to="/"
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
}

//////////////////////////////////////////////////////
// 📦 Layout
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

  // ✅ Fetch platform branding color
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
// 🎯 ROLE DASHBOARD
//////////////////////////////////////////////////////

function RoleDashboard() {
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  return user?.role === "SUPER_ADMIN"
    ? <SuperAdminDashboard />
    : <TenantDashboard />;
}

//////////////////////////////////////////////////////
// 🚀 APP
//////////////////////////////////////////////////////

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* 🌐 PUBLIC ROUTES */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* 🔒 PROTECTED ROUTES */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>

            {/* DASHBOARD */}
            <Route path="/dashboard" element={<RoleDashboard />} />

            {/* TENANTS */}
            <Route path="/tenants" element={<TenantManagement />} />

            {/* ✅ SUBSCRIPTIONS */}
            <Route path="/subscriptions" element={<SubscriptionsPage />} />

            {/* ✅ REPORTS */}
            <Route path="/reports" element={<ReportsPage />} />

            {/* ✅ SETTINGS */}
            <Route path="/settings" element={<SettingsPage />} />

            {/* ✅ STUDENTS */}
            <Route path="/students" element={<StudentsPage />} />
{/*academic year*/}
<Route path="/academic-years" element={<AcademicYearPage />} />
{/*classes*/}
<Route path="/classes" element={<ClassesPage />} />
{/*Sections*/}
<Route path="/Sections" element={<Sections />}/>
<Route path="/subjects" element={<SubjectsPage />} />
          </Route>
        </Route>

        {/* ❌ FALLBACK */}
        <Route path="*" element={<Navigate to="/dashboard" />} />

      </Routes>
    </BrowserRouter>
  );
}