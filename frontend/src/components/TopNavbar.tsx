import { useState, useRef, useEffect } from "react";
import {
  LogOut,
  UserCircle,
  Bell,
  Search,
  Moon,
  Sun,
  ChevronRight,
  X,
  ArrowLeft,
  Settings,
  HelpCircle,
  Home,
} from "lucide-react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { getFullUrl } from "../utils/url";

// ═══════════════════════════════════════════════
// PAGE TITLE MAP
// ═══════════════════════════════════════════════

const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/students": "All Students",
    "/student-dashboard": "Student Dashboard",
    "/students/new-admission": "New Admission",
    "/students/old-entry": "Old Student Entry",
    "/students/promotion": "Promotion",
    "/students/age-settings": "Age Settings",
    "/students/print": "Print Students",
    "/students/reports": "Student Reports",
    "/students/id-card": "Student ID Card",
    "/students/recycle-bin": "Recycle Bin",
    "/teachers": "All Teachers",
    "/teacher-dashboard": "Teacher Dashboard",
    "/assign-subject": "Assign Subject",
    "/teacher-timetable": "Teacher Timetable",
    "/teacher-attendance": "Teacher Attendance",
    "/teacher-leave": "Leave Management",
    "/teacher-salary": "Payroll / Salary",
    "/teacher-performance": "Performance",
    "/teacher-documents": "Teacher Documents",
    "/teacher-communication": "Communication",
    "/teacher-reports": "Teacher Reports",
    "/teacher-settings": "Teacher Settings",
    "/teacher-id-card": "Teacher ID Card",
    "/attendance": "Mark Attendance",
    "/attendance-dashboard": "Attendance Dashboard",
    "/attendance-report": "Attendance Reports",
    "/exams": "All Exams",
    "/exam-dashboard": "Exam Dashboard",
    "/grade-settings": "Grade Settings",
    "/exam-reports": "Exam Reports",
    "/exam-seating-plan": "Seating Arrangement",
    "/exam-admit-card": "Admit Card",
    "/fees/dashboard": "Fee Dashboard",
    "/fees/collection": "Fee Collection",
    "/fees/heads": "Fee Heads",
    "/fees/structures": "Fee Structure",
    "/fees/assign": "Assign Structure",
    "/fees/discounts": "Discounts",
    "/fees/fine-rules": "Fine Rules",
    "/fees/reports": "Fee Reports",
    "/fees/receipts": "Fee Receipts",
    "/fees/ledger": "Student Ledger",
    "/fees/reminders": "Fee Reminders",
    "/fees/settings": "Fee Settings",
    "/settings": "Settings",
    "/settings/subscription": "Subscription",
    "/settings/users": "User Management",
    "/settings/roles": "Roles & Permissions",
    "/settings/theme": "Theme",
    "/settings/audit-log": "Audit Log",
    "/reports": "Reports",
    "/transport": "Transport",
    "/library": "Library",
    "/timeTable": "Time Table",
    "/hostel/rooms": "Room Allocation",
    "/hostel/fees": "Hostel Fees",
    "/hostel/mess": "Mess Management",
    "/hr/staff": "Staff List",
    "/hr/payroll": "Payroll",
    "/hr/leave": "Leave Management",
    "/hr/attendance": "Staff Attendance",
    "/communication/notices": "Notice Board",
    "/communication/sms": "Send SMS",
    "/communication/whatsapp": "WhatsApp",
    "/communication/circular": "Circular",
    "/certificates/tc": "Transfer Certificate",
    "/certificates/character": "Character Certificate",
    "/certificates/migration": "Migration Certificate",
    "/inventory/assets": "Asset List",
    "/inventory/issue": "Issue Assets",
    "/inventory/stock": "Stock Management",
    "/gate-pass": "Gate Pass",
    "/gate-pass/pending": "Pending Approvals",
    "/gate-pass/reports": "Gate Pass Reports",
    "/events": "Events",
    "/events/calendar": "Event Calendar",
    "/events/create": "Create Event",
    "/helpdesk": "Help Desk",
    "/helpdesk/new": "Raise Ticket",
    "/helpdesk/reports": "Help Desk Reports",
    "/documents": "Documents",
    "/documents/templates": "Document Templates",
    "/documents/upload": "Upload Documents",
    "/backup": "Data Backup",
    "/yn-udp": "Template Designer",
    "/academic-years": "Academic Year",
    "/classes": "Classes",
    "/sections": "Sections",
    "/subjects": "Subjects",
    "/signature-master": "Signature Master",
    "/rooms": "Rooms",
    "/tenants": "Tenants",
    "/subscriptions": "Subscriptions",
  };
  if (routes[pathname]) return routes[pathname];
  for (const [route, title] of Object.entries(routes)) {
    if (pathname.startsWith(route + "/")) return title;
  }
  return "Dashboard";
};

// ═══════════════════════════════════════════════
// BREADCRUMB GENERATION
// ═══════════════════════════════════════════════

const getBreadcrumbs = (pathname: string): { label: string; path: string }[] => {
  const crumbs: { label: string; path: string }[] = [
    { label: "Home", path: "/dashboard" },
  ];

  const segments = pathname.split("/").filter(Boolean);
  let currentPath = "";

  segments.forEach((segment, idx) => {
    currentPath += `/${segment}`;
    if (currentPath === "/dashboard") return; // skip duplicate Home
    crumbs.push({
      label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
      path: currentPath,
    });
  });

  return crumbs;
};

// ═══════════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════════

type TopNavbarProps = {
  tenant?: any;
};

// ═══════════════════════════════════════════════
// TOP NAVBAR COMPONENT
// ═══════════════════════════════════════════════

export default function TopNavbar({ tenant }: TopNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const safeTenant = tenant || {};
  const pageTitle = getPageTitle(location.pathname);
  const breadcrumbs = getBreadcrumbs(location.pathname);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setUserMenuOpen(false);
        setNotificationOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Ctrl+K shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tenant");
    navigate("/");
  };

  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDarkMode(!darkMode);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("Search:", searchQuery);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="top-navbar sticky top-0 z-30 w-full bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 print:hidden transition-colors duration-200">
      <div className="flex items-center justify-between h-14 md:h-16 px-4 md:px-6">
        {/* ─── LEFT: Breadcrumbs ─── */}
        <div className="flex items-center gap-3 min-w-0 flex-1 ml-10 md:ml-0">
          {/* Back button on inner pages (mobile only) */}
          {location.pathname !== "/dashboard" && (
            <button
              onClick={() => navigate(-1)}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors md:hidden"
              title="Go Back"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          {/* Breadcrumbs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />}
                {idx === 0 ? (
                  <NavLink
                    to={crumb.path}
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
                  >
                    <Home size={18} />
                  </NavLink>
                ) : idx === breadcrumbs.length - 1 ? (
                  <span className="text-slate-800 dark:text-white font-semibold">
                    {crumb.label}
                  </span>
                ) : (
                  <NavLink
                    to={crumb.path}
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {crumb.label}
                  </NavLink>
                )}
              </span>
            ))}
          </nav>

          {/* Page Title (Mobile) */}
          <div className="md:hidden min-w-0">
            <h1 className="text-base font-semibold text-slate-800 dark:text-white truncate">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* ─── CENTER: Search Bar (Desktop) ─── */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700/50 rounded-full cursor-pointer hover:bg-gray-150 dark:hover:bg-slate-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-600"
          >
            <Search size={16} className="text-slate-400" />
            <span className="text-sm text-slate-400 flex-1">Search modules, students...</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded text-[10px] text-slate-500 dark:text-slate-300 font-medium">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* ─── RIGHT: Actions ─── */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Search (Mobile) */}
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Search"
          >
            <Search size={20} />
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-800 animate-pulse" />
            </button>

            {/* Notification Dropdown */}
            {notificationOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-750">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Notifications</h3>
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                    3 New
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {/* Notification items */}
                  <NotificationItem
                    title="New fee payment received"
                    desc="₹15,000 from Rahul Kumar (Class 10-A)"
                    time="2 min ago"
                    type="success"
                  />
                  <NotificationItem
                    title="Attendance alert"
                    desc="Class 8-B has less than 60% attendance today"
                    time="15 min ago"
                    type="warning"
                  />
                  <NotificationItem
                    title="Exam schedule updated"
                    desc="Mid-term exams rescheduled to next week"
                    time="1 hour ago"
                    type="info"
                  />
                </div>
                <div className="border-t border-gray-100 dark:border-slate-700 p-2">
                  <button className="w-full text-center text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 py-2 rounded-lg font-medium transition-colors">
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar & Dropdown */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="User menu"
              aria-expanded={userMenuOpen}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-indigo-200 dark:ring-indigo-800">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[100px]">
                  {user?.name || "User"}
                </p>
                <p className="text-[10px] text-slate-400 capitalize leading-tight">
                  {user?.role?.toLowerCase()?.replace("_", " ") || "user"}
                </p>
              </div>
            </button>

            {/* User Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User Info Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold backdrop-blur-sm">
                      {user?.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{user?.name || "User"}</p>
                      <p className="text-xs text-white/70 capitalize">
                        {user?.role?.toLowerCase()?.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1.5">
                  <DropdownItem
                    icon={<UserCircle size={16} />}
                    label="My Profile"
                    onClick={() => { navigate("/settings"); setUserMenuOpen(false); }}
                  />
                  <DropdownItem
                    icon={<Settings size={16} />}
                    label="Settings"
                    onClick={() => { navigate("/settings"); setUserMenuOpen(false); }}
                  />
                  <DropdownItem
                    icon={<HelpCircle size={16} />}
                    label="Help & Support"
                    onClick={() => { navigate("/helpdesk"); setUserMenuOpen(false); }}
                  />
                  <DropdownItem
                    icon={darkMode ? <Sun size={16} /> : <Moon size={16} />}
                    label={darkMode ? "Light Mode" : "Dark Mode"}
                    onClick={toggleDarkMode}
                  />
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 dark:border-slate-700 py-1.5">
                  <button
                    onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <LogOut size={16} />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SEARCH OVERLAY */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
          />
          {/* Search Modal */}
          <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleSearch} className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <Search size={20} className="text-slate-400 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules, students, teachers..."
                className="flex-1 ml-3 text-sm bg-transparent outline-none text-slate-800 dark:text-white placeholder-slate-400"
                autoFocus
              />
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </form>
            {/* Quick Links */}
            <div className="p-3 max-h-72 overflow-y-auto">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2 px-2">
                Quick Links
              </p>
              <div className="space-y-0.5">
                <SearchLink label="Dashboard" path="/dashboard" onSelect={() => { navigate("/dashboard"); setSearchOpen(false); }} />
                <SearchLink label="Students" path="/students" onSelect={() => { navigate("/students"); setSearchOpen(false); }} />
                <SearchLink label="Fee Collection" path="/fees/collection" onSelect={() => { navigate("/fees/collection"); setSearchOpen(false); }} />
                <SearchLink label="Mark Attendance" path="/attendance" onSelect={() => { navigate("/attendance"); setSearchOpen(false); }} />
                <SearchLink label="Exam Dashboard" path="/exam-dashboard" onSelect={() => { navigate("/exam-dashboard"); setSearchOpen(false); }} />
                <SearchLink label="Reports" path="/reports" onSelect={() => { navigate("/reports"); setSearchOpen(false); }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ═══════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════

function NotificationItem({ title, desc, time, type }: { title: string; desc: string; time: string; type: "success" | "warning" | "info" }) {
  const dotColor = {
    success: "bg-green-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
  }[type];

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors cursor-pointer border-b border-gray-50 dark:border-slate-700/50 last:border-0">
      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${dotColor}`} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-800 dark:text-white">{title}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{desc}</p>
        <p className="text-[10px] text-slate-400 mt-1">{time}</p>
      </div>
    </div>
  );
}

function DropdownItem({ icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
    >
      <span className="text-slate-400">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function SearchLink({ label, path, onSelect }: { label: string; path: string; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
    >
      <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
      <span>{label}</span>
      <span className="ml-auto text-[10px] text-slate-400">{path}</span>
    </button>
  );
}
