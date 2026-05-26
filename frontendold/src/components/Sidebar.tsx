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
// 🧠 USER
//////////////////////////////////////////////////
const user = JSON.parse(localStorage.getItem("user") || "{}");

//////////////////////////////////////////////////
// 🎯 MENUS (ROLE BASED)
//////////////////////////////////////////////////

const tenantMenu = [
  { name: "Dashboard", icon: <LayoutDashboard />, path: "/dashboard" },

  { section: "Academics" },
  { name: "Students", icon: <Users />, path: "/students" },
  { name: "Teachers", icon: <UserCog />, path: "/teachers" },
  { name: "Classes", icon: <School />, path: "/classes" },
  { name: "Subjects", icon: <BookOpen />, path: "/subjects" },
  { name: "Attendance", icon: <ClipboardCheck />, path: "/attendance" },
  { name: "Exams", icon: <FileText />, path: "/exams" },

  { section: "Finance" },
  { name: "Fees", icon: <IndianRupee />, path: "/fees" },

  { section: "Management" },
  { name: "Transport", icon: <Bus />, path: "/transport" },
  { name: "Library", icon: <Library />, path: "/library" },

  { section: "Analytics" },
  { name: "Reports", icon: <BarChart3 />, path: "/reports" },

  { section: "System" },
  { name: "Settings", icon: <Settings />, path: "/settings" },
];

//////////////////////////////////////////////////

const superAdminMenu = [
  { name: "Dashboard", icon: <LayoutDashboard />, path: "/dashboard" },

  { section: "SaaS Control" },
  { name: "Tenants", icon: <Building2 />, path: "/tenants" },
  { name: "Subscriptions", icon: <CreditCard />, path: "/subscriptions" },

  { section: "Analytics" },
  { name: "Reports", icon: <BarChart3 />, path: "/reports" },

  { section: "System" },
  { name: "Settings", icon: <Settings />, path: "/settings" },
];

//////////////////////////////////////////////////
// 🚀 MAIN SIDEBAR
//////////////////////////////////////////////////
export default function Sidebar() {
  // 🔥 ROLE BASED MENU SELECT
  const menu =
    user?.role === "SUPER_ADMIN" ? superAdminMenu : tenantMenu;

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen shadow-xl flex flex-col">

      {/* LOGO */}
     <div className="p-4 border-b border-gray-700 flex flex-col items-center text-center">

  {/* 🔥 LOGO */}
  <img
    src="/ynlogo.png"
    alt="Brand"
    className="h-12 w-auto object-contain mb-2"
  />

  {/* 🔥 TEXT */}
<p className="text-white text-xl font-bold">
  Super Admin Panel
</p>

</div>

      {/* MENU */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">

        {menu.map((item: any, i) =>
          item.section ? (
            <p key={i} className="text-xs text-gray-400 mt-4 mb-2 uppercase">
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
// NAV ITEM
//////////////////////////////////////////////////
const NavItem = ({ to, icon, label }: any) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
        isActive
          ? "bg-indigo-600 text-white"
          : "text-gray-300 hover:bg-gray-700"
      }`
    }
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);