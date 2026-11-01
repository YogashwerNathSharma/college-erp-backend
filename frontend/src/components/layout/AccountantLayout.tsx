import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  IndianRupee,
  Layers,
  FileText,
  BookOpenCheck,
  CreditCard,
  Bell,
  BarChart3,
  PieChart,
  ChevronRight,
  Menu,
  X,
  LogOut,
  User,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// ACCOUNTANT LAYOUT — Sidebar + Topbar for Accountant portal
// Theme: Amber/Orange
// ═══════════════════════════════════════════════════════════════

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path: string;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

const accountantMenu: NavSection[] = [
  {
    section: "",
    items: [
      { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/accountant/dashboard" },
    ],
  },
  {
    section: "FEES & FINANCE",
    items: [
      { name: "Fee Collection", icon: <IndianRupee size={20} />, path: "/fees/collection" },
      { name: "Fee Structures", icon: <Layers size={20} />, path: "/fees/structures" },
      { name: "Receipts", icon: <FileText size={20} />, path: "/fees/receipts" },
      { name: "Student Ledger", icon: <BookOpenCheck size={20} />, path: "/fees/ledger" },
      { name: "Discounts", icon: <CreditCard size={20} />, path: "/fees/discounts" },
      { name: "Fine Rules", icon: <FileText size={20} />, path: "/fees/fine-rules" },
      { name: "Reminders", icon: <Bell size={20} />, path: "/fees/reminders" },
    ],
  },
  {
    section: "REPORTS",
    items: [
      { name: "Fee Reports", icon: <BarChart3 size={20} />, path: "/fees/reports" },
      { name: "Collection Summary", icon: <PieChart size={20} />, path: "/fees/dashboard" },
    ],
  },
];

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AccountantLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("portalConfig");
    localStorage.removeItem("tenant");
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <IndianRupee className="text-white" size={16} />
            </div>
            <span className="font-bold text-gray-800 text-sm">Accounts Portal</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <User className="text-amber-600" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.name || "Accountant"}</p>
              <p className="text-xs text-gray-500 truncate">Accountant</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-240px)]">
          {accountantMenu.map((section, sIdx) => (
            <div key={sIdx}>
              {section.section && (
                <p className="px-3 py-2 text-[10px] font-bold tracking-widest text-gray-400 uppercase mt-4 first:mt-0">
                  {section.section}
                </p>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-amber-50 text-amber-700 border-l-3 border-amber-500"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                    }`
                  }
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="truncate">{item.name}</span>
                  <ChevronRight size={14} className="ml-auto text-gray-300" />
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-100 p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            {accountantMenu
              .flatMap((s) => s.items)
              .find((i) => location.pathname.startsWith(i.path))?.name || "Accounts Portal"}
          </h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
