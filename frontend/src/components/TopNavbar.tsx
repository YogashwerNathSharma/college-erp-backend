import { useState, useRef, useEffect } from "react";
import { LogOut, UserCircle, Bell, Search, Moon, Sun, ChevronRight, X, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getFullUrl } from "../utils/url";

// Page title map
const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/students": "Students",
    "/student-dashboard": "Student Dashboard",
    "/teachers": "Teachers",
    "/teacher-dashboard": "Teacher Dashboard",
    "/attendance": "Attendance",
    "/attendance-dashboard": "Attendance Dashboard",
    "/exams": "Exams",
    "/exam-dashboard": "Exam Dashboard",
    "/fees": "Fees",
    "/fees/dashboard": "Fee Dashboard",
    "/fees/collection": "Fee Collection",
    "/settings": "Settings",
    "/settings/subscription": "Subscription",
    "/settings/theme": "Theme",
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
    "/transport/tracking": "Live Tracking",
    "/yn-udp": "Template Designer",
  };
  // Exact match first
  if (routes[pathname]) return routes[pathname];
  // Prefix match
  for (const [route, title] of Object.entries(routes)) {
    if (pathname.startsWith(route + "/")) return title;
  }
  return "Dashboard";
};

// Breadcrumb generation
const getBreadcrumbs = (pathname: string): { label: string; path: string }[] => {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; path: string }[] = [];
  let currentPath = "";
  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    crumbs.push({
      label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
      path: currentPath,
    });
  });
  return crumbs;
};

type TopNavbarProps = {
  tenant?: any;
};

export default function TopNavbar({ tenant }: TopNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const safeTenant = tenant || {};
  const pageTitle = getPageTitle(location.pathname);
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const tenantLogoSrc = getFullUrl(safeTenant?.logoUrl);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close search on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setUserMenuOpen(false);
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
      // Navigate to search results or handle search
      console.log("Search:", searchQuery);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="top-navbar w-full bg-white dark:bg-slate-800 px-4 md:px-6 py-2.5 md:py-3 rounded-none md:rounded-xl shadow-soft border-b md:border border-gray-100 dark:border-slate-700 flex items-center justify-between mb-0 gap-3 print:hidden transition-colors duration-200">
      {/* LEFT SIDE */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Back Button — shows on all pages except /dashboard */}
        {location.pathname !== "/dashboard" && (
          <button
            onClick={() => navigate(-1)}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
            title="Go Back"
          >
            <ArrowLeft size={16} />
          </button>
        )}

        {/* Logo + Name */}
        {user?.role === "SUPER_ADMIN" ? (
          <div className="flex items-center gap-2.5">
            <img src="/ynlogo.png" alt="brand" className="w-9 h-9 object-contain" />
            <div className="hidden sm:block">
              <p className="text-base font-bold text-gray-800 dark:text-white">Super Admin</p>
              <p className="text-[11px] text-gray-400">System Control</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            {tenantLogoSrc ? (
              <img
                src={tenantLogoSrc}
                alt="tenant logo"
                className="w-9 h-9 rounded-lg object-cover border border-gray-200 dark:border-slate-600 flex-shrink-0"
                onError={(e: any) => { e.target.style.display = "none"; }}
              />
            ) : (
              <div className="w-9 h-9 bg-primary-500 text-white flex items-center justify-center rounded-lg font-bold text-sm flex-shrink-0">
                {safeTenant?.name?.charAt(0) || "T"}
              </div>
            )}
            <div className="min-w-0 hidden xs:block">
              <p className="font-semibold text-sm text-slate-800 dark:text-white truncate max-w-[120px] md:max-w-[200px]">
                {safeTenant?.name || "Tenant Panel"}
              </p>
              {/* Breadcrumbs - Desktop only */}
              <nav className="breadcrumb hidden md:flex items-center gap-1 text-[11px] text-slate-400" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, idx) => (
                  <span key={idx} className="flex items-center gap-1">
                    {idx > 0 && <ChevronRight size={10} />}
                    <span className={idx === breadcrumbs.length - 1 ? "text-primary-500 font-medium" : ""}>
                      {crumb.label}
                    </span>
                  </span>
                ))}
              </nav>
              {/* Mobile: just page title */}
              <p className="md:hidden text-[11px] text-slate-400">{pageTitle}</p>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Search */}
        {searchOpen ? (
          <form onSubmit={handleSearch} className="flex items-center absolute inset-x-0 top-0 bottom-0 bg-white dark:bg-slate-800 px-4 z-50 md:relative md:inset-auto md:bg-transparent md:px-0">
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search modules, students..."
              className="flex-1 bg-gray-100 dark:bg-slate-700 text-sm rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500/30 transition-all min-h-touch text-gray-800 dark:text-white placeholder-gray-400"
              aria-label="Search"
            />
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              className="ml-2 tap-target text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Close search"
            >
              <X size={20} />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="tap-target rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Open search"
          >
            <Search size={20} />
          </button>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="tap-target rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors hidden md:inline-flex items-center justify-center"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <button
          className="tap-target rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors relative"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-800" />
        </button>

        {/* User avatar + dropdown */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 tap-target rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 px-2 transition-colors"
            aria-label="User menu"
            aria-expanded={userMenuOpen}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate max-w-[100px]">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] text-slate-400 capitalize">
                {user?.role?.toLowerCase()?.replace("_", " ") || "user"}
              </p>
            </div>
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-2 z-50 animate-fade-in-down">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-800 dark:text-white">{user?.name}</p>
                <p className="text-xs text-slate-400 capitalize">
                  {user?.role?.toLowerCase()?.replace("_", " ")}
                </p>
              </div>
              <button
                onClick={() => { navigate("/settings"); setUserMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors min-h-touch"
              >
                <UserCircle size={16} />
                Profile & Settings
              </button>
              {/* Dark mode toggle for mobile (shown in dropdown) */}
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors md:hidden min-h-touch"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                {darkMode ? "Light Mode" : "Dark Mode"}
              </button>
              <div className="border-t border-gray-100 dark:border-slate-700 mt-1 pt-1">
                <button
                  onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-h-touch"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
