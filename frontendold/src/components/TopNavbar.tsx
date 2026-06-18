import { LogOut, UserCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

//////////////////////////////////////////////////////
// HELPER — Full URL for logo
//////////////////////////////////////////////////////
const getFullUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `http://localhost:5000${path}`;
};

// 🔥 Page title map — route ke hisaab se title
const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/students": "Students",
    "/teachers": "Teachers",
    "/master": "Master",
    "/attendance": "Attendance",
    "/exams": "Exams",
    "/fees": "Fees",
    "/settings": "Settings",
    "/settings/subscription": "Subscription",
    "/settings/profile": "Profile",
    "/reports": "Reports",
    "/transport": "Transport",
    "/library": "Library",
    "/timetable": "Time Table",
  };
  return routes[pathname] || "Dashboard";
};

type TopNavbarProps = {
  tenant?: any;
};

export default function TopNavbar({ tenant }: TopNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const safeTenant = tenant || {};
  const pageTitle = getPageTitle(location.pathname);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tenant");
    navigate("/");
  };

  const tenantLogoSrc = getFullUrl(safeTenant?.logoUrl);

  return (
    <div className="w-full bg-white px-6 py-3 rounded-xl shadow flex justify-between items-center mb-6">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">
        {user?.role === "SUPER_ADMIN" ? (
          <>
            <img
              src="/ynlogo.png"
              alt="brand"
              className="w-10 h-10 object-contain"
            />
            <div>
              <p className="text-gray text-xl font-bold">
                Manage All Tenants
              </p>
            </div>
          </>
        ) : (
          <>
            {tenantLogoSrc ? (
              <img
                src={tenantLogoSrc}
                alt="tenant logo"
                className="w-10 h-10 rounded-lg object-cover border"
                onError={(e: any) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div className="w-10 h-10 bg-indigo-600 text-white flex items-center justify-center rounded-lg font-bold">
                {safeTenant?.name?.charAt(0) || "T"}
              </div>
            )}

            {/* TENANT NAME + PAGE TITLE */}
            <div>
              <p className="font-semibold text-slate-800">
                {safeTenant?.name || "Tenant Panel"}
              </p>
              <p className="text-xs text-slate-400">
                {pageTitle}
              </p>
            </div>
          </>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <UserCircle size={20} />
          <div className="text-right">
            <p className="font-medium text-slate-700">{user?.name}</p>
            <p className="text-[10px] text-slate-400">Welcome back 👋</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

    </div>
  );
}