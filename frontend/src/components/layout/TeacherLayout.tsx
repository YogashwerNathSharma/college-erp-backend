import { useState, useEffect, useMemo } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAcademicYear } from "../../context/AcademicYearContext";
import {
  FiHome,
  FiBook,
  FiCheckSquare,
  FiEdit3,
  FiUsers,
  FiCalendar,
  FiFileText,
  FiDollarSign,
  FiUser,
  FiMenu,
  FiX,
  FiBell,
  FiLogOut,
  FiShield,
  FiClipboard,
  FiBookOpen,
} from "react-icons/fi";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  principalOnly?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Nav Items
// ─────────────────────────────────────────────────────────────

const navItems: NavItem[] = [
  { label: "Dashboard", icon: FiHome, path: "/teacher/dashboard" },
  { label: "My Students", icon: FiUsers, path: "/teacher/my-students" },
  { label: "Mark Attendance", icon: FiCheckSquare, path: "/teacher/attendance" },
  { label: "Enter Marks", icon: FiEdit3, path: "/teacher/marks" },
  { label: "Homework", icon: FiBookOpen, path: "/teacher/homework" },
  { label: "My Timetable", icon: FiCalendar, path: "/teacher/timetable" },
  { label: "My Leave", icon: FiFileText, path: "/teacher/leave" },
  { label: "My Salary", icon: FiDollarSign, path: "/teacher/salary" },
  { label: "Notices", icon: FiBell, path: "/teacher/notices" },
  { label: "My Profile", icon: FiUser, path: "/teacher/profile" },
  { label: "Approve Leave", icon: FiShield, path: "/teacher/approve-leave", principalOnly: true },
  { label: "Reports", icon: FiClipboard, path: "/teacher/reports", principalOnly: true },
];

// ─────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────

function TeacherSidebar({
  isOpen,
  onClose,
  isPrincipal,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  isPrincipal: boolean;
  user: User | null;
}) {
  const location = useLocation();
  const filteredItems = navItems.filter(
    (item) => !item.principalOnly || isPrincipal
  );

  return (
    <>
      {/* Overlay on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <FiBook className="text-white text-sm" />
            </div>
            <span className="font-bold text-gray-800 text-sm">
              {isPrincipal ? "Principal Portal" : "Teacher Portal"}
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700">
            <FiX size={20} />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
              <FiUser className="text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user?.name || "Teacher"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {isPrincipal ? "Principal" : "Teacher"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-230px)]">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`text-lg ${isActive ? "text-indigo-600" : "text-gray-400"}`} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="px-3 py-4 border-t border-gray-200">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("tenant");
              localStorage.removeItem("portalConfig");
              window.location.href = "/";
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <FiLogOut className="text-lg" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// TeacherLayout — exported as default
// ─────────────────────────────────────────────────────────────

export default function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const user: User | null = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const isPrincipal = user?.role === "PRINCIPAL";

  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Get current page title from nav items
  const currentTitle = navItems.find((n) => location.pathname === n.path)?.label || "Dashboard";

  return (
    <div className="flex h-screen bg-gray-50 overflow-x-hidden">
      {/* Sidebar */}
      <TeacherSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isPrincipal={isPrincipal}
        user={user}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <FiMenu size={20} />
            </button>
            <h1 className="text-lg font-bold text-gray-800 hidden sm:block">
              {currentTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <FiBell size={18} />
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("tenant");
                localStorage.removeItem("portalConfig");
                window.location.href = "/";
              }}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <FiLogOut size={18} />
            </button>
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <FiUser className="text-indigo-600 text-sm" />
            </div>
          </div>
        </header>

        {/* Content area — renders child routes */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
