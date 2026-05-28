import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  UserCog,
  School,
  BookOpen,
  ClipboardCheck,
  FileText,
  IndianRupee,
  Bus,
  Library,
  BarChart3,
  Settings,
  Building2,
  CreditCard,
} from "lucide-react";

//////////////////////////////////////////////////
// 🎯 MENUS
//////////////////////////////////////////////////

const tenantMenu = [
  {
    name: "Dashboard",
    icon: <LayoutDashboard />,
    path: "/dashboard",
  },

  { section: "Academics" },

  {
    name: "Students",
    icon: <Users />,
    path: "/students",
  },

  {
    name: "Teachers",
    icon: <UserCog />,
    path: "/teachers",
  },

  {
    name: "Classes",
    icon: <School />,
    path: "/classes",
  },

  {
    name: "Subjects",
    icon: <BookOpen />,
    path: "/subjects",
  },

  {
    name: "Attendance",
    icon: <ClipboardCheck />,
    path: "/attendance",
  },

  {
    name: "Exams",
    icon: <FileText />,
    path: "/exams",
  },

  { section: "Finance" },

  {
    name: "Fees",
    icon: <IndianRupee />,
    path: "/fees",
  },

  { section: "Management" },

  {
    name: "Transport",
    icon: <Bus />,
    path: "/transport",
  },

  {
    name: "Library",
    icon: <Library />,
    path: "/library",
  },

  { section: "Analytics" },

  {
    name: "Reports",
    icon: <BarChart3 />,
    path: "/reports",
  },

  { section: "System" },

  {
    name: "Settings",
    icon: <Settings />,
    path: "/settings",
  },
];

//////////////////////////////////////////////////

const superAdminMenu = [
  {
    name: "Dashboard",
    icon: <LayoutDashboard />,
    path: "/dashboard",
  },

  { section: "SaaS Control" },

  {
    name: "Tenants",
    icon: <Building2 />,
    path: "/tenants",
  },

  {
    name: "Subscriptions",
    icon: <CreditCard />,
    path: "/subscriptions",
  },

  { section: "Analytics" },

  {
    name: "Reports",
    icon: <BarChart3 />,
    path: "/reports",
  },

  { section: "System" },

  {
    name: "Settings",
    icon: <Settings />,
    path: "/settings",
  },
];

//////////////////////////////////////////////////
// 🚀 TYPES
//////////////////////////////////////////////////

type SidebarProps = {
  tenant?: any;
};

//////////////////////////////////////////////////
// 🚀 SIDEBAR
//////////////////////////////////////////////////

export default function Sidebar({
  tenant,
}: SidebarProps) {

  //////////////////////////////////////////////////
  // 👤 USER
  //////////////////////////////////////////////////

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  //////////////////////////////////////////////////
  // 🏫 LOCAL TENANT
  //////////////////////////////////////////////////

  const localTenant = JSON.parse(
    localStorage.getItem("tenant") || "{}"
  );

  //////////////////////////////////////////////////
  // 🔥 ROLE CHECK
  //////////////////////////////////////////////////

  const isSuperAdmin =
    user?.role === "SUPER_ADMIN";

  //////////////////////////////////////////////////
  // 🔥 SAFE TENANT
  //////////////////////////////////////////////////

  const safeTenant =
    tenant || localTenant || {};

  //////////////////////////////////////////////////
  // 🔥 ROLE BASED DATA
  //////////////////////////////////////////////////

  const sidebarTitle = isSuperAdmin
    ? "Super Admin"
    : safeTenant?.name || "School Name";

  const sidebarSubtitle = isSuperAdmin
    ? "System Control"
    : safeTenant?.type || "School";

  //////////////////////////////////////////////////
  // 🔥 ROLE BASED LOGO
  //////////////////////////////////////////////////

  const sidebarLogo = isSuperAdmin
    ? "/super-admin-logo.png"
    : safeTenant?.logoUrl;

  //////////////////////////////////////////////////
  // 🔥 MENU
  //////////////////////////////////////////////////

  const menu = isSuperAdmin
    ? superAdminMenu
    : tenantMenu;

  //////////////////////////////////////////////////
  // 🚀 UI
  //////////////////////////////////////////////////

  return (
    <div className="w-72 bg-gradient-to-b from-slate-950 to-slate-900 text-white min-h-screen shadow-2xl flex flex-col">

      {/* ////////////////////////////////////////////////// */}
      {/* 🔥 HEADER */}
      {/* ////////////////////////////////////////////////// */}

      <div className="p-6 border-b border-slate-800">

        <div className="flex items-center gap-4">

          {/* ////////////////////////////////////////////////// */}
          {/* 🔥 LOGO */}
          {/* ////////////////////////////////////////////////// */}

          {sidebarLogo ? (

            <img
              src={sidebarLogo}
              alt="Logo"
              className="w-16 h-16 rounded-full object-cover border-4 border-indigo-500 shadow-xl bg-white"
              onError={(e: any) => {
                e.target.style.display = "none";
              }}
            />

          ) : (

            //////////////////////////////////////////////////
            // 🔥 FALLBACK
            //////////////////////////////////////////////////

            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-indigo-400 shadow-xl">

              {isSuperAdmin
                ? "S"
                : safeTenant?.name?.charAt(0) || "T"}

            </div>

          )}

          {/* ////////////////////////////////////////////////// */}
          {/* 🔥 TEXT */}
          {/* ////////////////////////////////////////////////// */}

          <div className="flex-1 min-w-0">

            <h1 className="text-xl font-bold text-white truncate">
              {sidebarTitle}
            </h1>

            <p className="text-xs text-slate-400 uppercase tracking-[3px] mt-1">
              {sidebarSubtitle}
            </p>

          </div>

        </div>

      </div>

      {/* ////////////////////////////////////////////////// */}
      {/* 🔥 MENU */}
      {/* ////////////////////////////////////////////////// */}

      <div className="flex-1 overflow-y-auto p-4">

        {menu.map((item: any, i) =>

          item.section ? (

            <p
              key={i}
              className="text-[11px] text-slate-500 mt-6 mb-2 px-2 uppercase tracking-[3px]"
            >
              {item.section}
            </p>

          ) : (

            <NavItem
              key={i}
              to={item.path}
              icon={item.icon}
              label={item.name}
            />

          )
        )}

      </div>

    </div>
  );
}

//////////////////////////////////////////////////
// 🚀 NAV ITEM
//////////////////////////////////////////////////

const NavItem = ({
  to,
  icon,
  label,
}: any) => (

  <NavLink
    to={to}
    className={({ isActive }) =>

      `flex items-center gap-3 px-4 py-3 rounded-2xl mb-2 transition-all duration-300 ${
        isActive
          ? "bg-indigo-600 text-white shadow-lg"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`
    }
  >

    {/* 🔥 ICON */}
    <span className="text-xl">
      {icon}
    </span>

    {/* 🔥 LABEL */}
    <span className="font-semibold text-[15px]">
      {label}
    </span>

  </NavLink>
);