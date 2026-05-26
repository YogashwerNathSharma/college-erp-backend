import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useState } from "react";

import LoginPage from "./pages/LoginPages";
import ForgotPassword from "./pages/ForgotPassword";
import TenantDashboard from "./pages/TenantDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import TenantManagement from "./pages/TenantManagement"; // ✅ only ONE import

import Sidebar from "./components/Sidebar";
import TopNavbar from "./components/TopNavbar";

//////////////////////////////////////////////////////
// 🔒 Protected Route
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
// 📦 Layout (common UI)
//////////////////////////////////////////////////////
function Layout() {
  const [tenant, setTenant] = useState<any>(null);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 bg-gray-100 p-6">
        <TopNavbar tenant={tenant} />
        <Outlet context={{ setTenant }} />
      </div>
    </div>
  );
}

//////////////////////////////////////////////////////
// 🎯 Role Based Dashboard
//////////////////////////////////////////////////////
function RoleDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

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
        // 🌐 PUBLIC
        //////////////////////////////////////////////////////
        <Route path="/" element={<LoginPage />} />
// 🌐 PUBLIC — Login ke bina access ho sake
<Route path="/" element={<LoginPage />} />
<Route path="/forgot-password" element={<ForgotPassword />} />  // 🔥 YAHAN
        //////////////////////////////////////////////////////
        // 🔒 PROTECTED
        //////////////////////////////////////////////////////
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>

            {/* ✅ DASHBOARD */}
            <Route path="/dashboard" element={<RoleDashboard />} />

            {/* ✅ SUPER ADMIN ONLY */}
            <Route path="/tenants" element={<TenantManagement />} />

            {/* FUTURE */}
            <Route path="/subscriptions" element={<div>Subscriptions</div>} />
            <Route path="/reports" element={<div>Reports</div>} />
            <Route path="/settings" element={<div>Settings</div>} />

          </Route>
        </Route>

        //////////////////////////////////////////////////////
        // ❌ FALLBACK
        //////////////////////////////////////////////////////
        <Route path="*" element={<Navigate to="/dashboard" />} />

      </Routes>
    </BrowserRouter>
  );
}