
// Settings Router Component
// Yeh component sidebar se Settings click hone pe role check karke correct page dikhata hai
// SUPER_ADMIN → SuperAdminSettings
// ADMIN → TenantAdminSettings (with User Management)

import SuperAdminSettings from "./SuperAdminSettings";
import TenantAdminSettings from "./TenantAdminSettings";

export default function SettingsRouter() {
  // Get current user role from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role || "";

  // Role-based routing
  if (role === "SUPER_ADMIN") {
    return <SuperAdminSettings />;
  }

  if (role === "ADMIN") {
    return <TenantAdminSettings />;
  }

  // Fallback — agar koi aur role hai (Teacher/Student etc.) — sirf basic profile dikha sakte ho
  // Ya redirect kar do dashboard pe
  return (
    <div className="p-10 text-center text-slate-500">
      <p className="text-lg font-medium">Access Denied</p>
      <p className="text-sm mt-2">
        Aapke role ke liye settings page available nahi hai.
      </p>
    </div>
  );
}

// ====================================================
// HOW TO USE IN YOUR APP ROUTES:
// ====================================================
// 
// App.tsx ya Routes mein:
//
// import SettingsRouter from "./pages/settings/SettingsRouter";
//
// <Route path="/settings" element={<SettingsRouter />} />
//
// ====================================================
// SIDEBAR CONFIG:
// ====================================================
//
// Sidebar mein ek hi "Settings" item rakho with path="/settings"
// SettingsRouter automatically role check karke sahi page render karega
//
// {
//   name: "Settings",
//   icon: Settings,  // lucide-react
//   path: "/settings"
// }
//
// No children needed — single route, role-based content!
// ====================================================

