import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useState, useEffect } from "react";

import LoginPage from "./pages/LoginPages";
import ForgotPassword from "./pages/ForgotPassword";

import TenantDashboard from "./pages/TenantDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

import TenantManagement from "./pages/TenantManagement";

import Sidebar from "./components/Sidebar";
import TopNavbar from "./components/TopNavbar";

// ✅ YOUR STRUCTURE ACCORDING IMPORT
import SubscriptionsPage from "./pages/subscriptions/SubscriptionsPage";

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

    return saved
      ? JSON.parse(saved)
      : null;

  });

  //////////////////////////////////////////////////////
  // 🔥 STORAGE LISTENER
  //////////////////////////////////////////////////////
  useEffect(() => {

    const handleStorageChange = () => {

      const saved = localStorage.getItem("tenant");

      if (saved) {
        setTenant(JSON.parse(saved));
      }

    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {

      window.removeEventListener(
        "storage",
        handleStorageChange
      );

    };

  }, []);

  return (

    <div className="flex min-h-screen">

      {/* SIDEBAR */}
      <Sidebar tenant={tenant} />

      <div className="flex-1 bg-gray-100 p-6">

        {/* TOPBAR */}
        <TopNavbar tenant={tenant} />

        {/* PAGE CONTENT */}
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

        //////////////////////////////////////////////////////
        // 🌐 PUBLIC ROUTES
        //////////////////////////////////////////////////////

        <Route
          path="/"
          element={<LoginPage />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        //////////////////////////////////////////////////////
        // 🔒 PROTECTED ROUTES
        //////////////////////////////////////////////////////

        <Route element={<ProtectedRoute />}>

          <Route element={<Layout />}>

            {/* DASHBOARD */}
            <Route
              path="/dashboard"
              element={<RoleDashboard />}
            />

            {/* TENANTS */}
            <Route
              path="/tenants"
              element={<TenantManagement />}
            />

            {/* ✅ SUBSCRIPTIONS */}
            <Route
              path="/subscriptions"
              element={<SubscriptionsPage />}
            />

            {/* REPORTS */}
            <Route
              path="/reports"
              element={<div>Reports</div>}
            />

            {/* SETTINGS */}
            <Route
              path="/settings"
              element={<div>Settings</div>}
            />

          </Route>

        </Route>

        //////////////////////////////////////////////////////
        // ❌ FALLBACK
        //////////////////////////////////////////////////////

        <Route
          path="*"
          element={<Navigate to="/dashboard" />}
        />

      </Routes>

    </BrowserRouter>

  );
}