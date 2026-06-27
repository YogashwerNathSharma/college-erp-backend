import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { NavLink, useLocation } from "react-router-dom";
import { getFullUrl } from "../utils/url";

import {
  LayoutDashboard,
  Users,
  UserPlus,
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
  Calendar,
  Layers,
  IdCard,
  FileClockIcon,
  ChevronRight,
  ChevronDown,
  Bell,
  BookOpenCheck,
  PieChart,
  UserCheck,
  GraduationCap,
  CalendarClock,
  Grid3X3,
  Star,
  FolderOpen,
  MessageSquare,
  Clock,
  Wallet,
  ClipboardEdit,
  PenTool,
  Database,
  Palette,
  Brush,
  Home,
  MoreHorizontal,
  X,
  Award,
  Package,
  BedDouble,
  Send,
  MapPin,
} from "lucide-react";

//////////////////////////////////////////////////
// 🎯 MENU TYPES
//////////////////////////////////////////////////

type MenuItem = {
  name: string;
  icon: any;
  path?: string;
  badge?: number;
  children?: { name: string; icon: any; path: string }[];
};

type SectionGroup = {
  section: string;
  items: MenuItem[];
};

//////////////////////////////////////////////////
// 🎯 TENANT MENU (Enhanced with new modules)
//////////////////////////////////////////////////

const tenantMenu: SectionGroup[] = [
  {
    section: "",
    items: [
      { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    ],
  },
  {
    section: "",
    items: [
      {
        name: "Master",
        icon: <Settings size={20} />,
        children: [
          { name: "Academic Year", icon: <Calendar size={16} />, path: "/academic-years" },
          { name: "Classes", icon: <School size={16} />, path: "/classes" },
          { name: "Sections", icon: <Layers size={16} />, path: "/sections" },
          { name: "Subjects", icon: <BookOpen size={16} />, path: "/subjects" },
          { name: "Signature Master", icon: <PenTool size={16} />, path: "/signature-master" },
          { name: "Rooms", icon: <School size={16} />, path: "/rooms" },
        ],
      },
    ],
  },
  {
    section: "Academics",
    items: [
      {
        name: "Students",
        icon: <Users size={20} />,
        children: [
          { name: "Student Dashboard", icon: <LayoutDashboard size={16} />, path: "/student-dashboard" },
          { name: "All Students", icon: <Users size={16} />, path: "/students" },
          { name: "New Admission", icon: <UserCheck size={16} />, path: "/students/new-admission" },
          { name: "Old Student Entry", icon: <FileText size={16} />, path: "/students/old-entry" },
          { name: "Promotion", icon: <GraduationCap size={16} />, path: "/students/promotion" },
          { name: "Age Settings", icon: <Calendar size={16} />, path: "/students/age-settings" },
          { name: "Print List", icon: <FileText size={16} />, path: "/students/print" },
          { name: "Reports", icon: <BarChart3 size={16} />, path: "/students/reports" },
          { name: "ID Card", icon: <IdCard size={16} />, path: "/students/id-card" },
          { name: "Recycle Bin", icon: <FolderOpen size={16} />, path: "/students/recycle-bin" },
        ],
      },
      {
        name: "Teachers",
        icon: <UserCog size={20} />,
        children: [
          { name: "Dashboard", icon: <LayoutDashboard size={16} />, path: "/teacher-dashboard" },
          { name: "All Teachers", icon: <UserCog size={16} />, path: "/teachers" },
          { name: "Assign Subject", icon: <BookOpen size={16} />, path: "/assign-subject" },
          { name: "Timetable", icon: <CalendarClock size={16} />, path: "/teacher-timetable" },
          { name: "Attendance", icon: <ClipboardCheck size={16} />, path: "/teacher-attendance" },
          { name: "Leave", icon: <Clock size={16} />, path: "/teacher-leave" },
          { name: "Payroll / Salary", icon: <Wallet size={16} />, path: "/teacher-salary" },
          { name: "Performance", icon: <Star size={16} />, path: "/teacher-performance" },
          { name: "Documents", icon: <FolderOpen size={16} />, path: "/teacher-documents" },
          { name: "Communication", icon: <MessageSquare size={16} />, path: "/teacher-communication" },
          { name: "Reports", icon: <BarChart3 size={16} />, path: "/teacher-reports" },
          { name: "Settings", icon: <Settings size={16} />, path: "/teacher-settings" },
          { name: "Teacher ID Card", icon: <IdCard size={16} />, path: "/teacher-id-card" },
        ],
      },
      {
        name: "Attendance",
        icon: <ClipboardCheck size={20} />,
        children: [
          { name: "Dashboard", path: "/attendance-dashboard", icon: <ClipboardEdit size={16} /> },
          { name: "Mark Attendance", path: "/attendance", icon: <ClipboardCheck size={16} /> },
          { name: "Reports", path: "/attendance-report", icon: <BarChart3 size={16} /> },
        ],
      },
      {
        name: "Exams",
        icon: <FileText size={20} />,
        children: [
          { name: "Exam Dashboard", icon: <LayoutDashboard size={16} />, path: "/exam-dashboard" },
          { name: "All Exams", icon: <FileText size={16} />, path: "/exams" },
          { name: "Grade Settings", icon: <ClipboardCheck size={16} />, path: "/grade-settings" },
          { name: "Reports", icon: <BarChart3 size={16} />, path: "/exam-reports" },
          { name: "Seating Arrangement", icon: <Grid3X3 size={16} />, path: "/exam-seating-plan" },
          { name: "Admit Card", icon: <CreditCard size={16} />, path: "/exam-admit-card" },
        ],
      },
      { name: "Time Table", icon: <FileClockIcon size={20} />, path: "/timeTable" },
    ],
  },
  {
    section: "Finance",
    items: [
      {
        name: "Fees",
        icon: <IndianRupee size={20} />,
        children: [
          { name: "Fee Dashboard", icon: <PieChart size={16} />, path: "/fees/dashboard" },
          { name: "Fee Collection", icon: <IndianRupee size={16} />, path: "/fees/collection" },
          { name: "Fee Heads", icon: <BookOpen size={16} />, path: "/fees/heads" },
          { name: "Fee Structure", icon: <Layers size={16} />, path: "/fees/structures" },
          { name: "Assign Structure", icon: <UserCheck size={16} />, path: "/fees/assign" },
          { name: "Discounts", icon: <CreditCard size={16} />, path: "/fees/discounts" },
          { name: "Fine Rules", icon: <FileText size={16} />, path: "/fees/fine-rules" },
          { name: "Reports", icon: <BarChart3 size={16} />, path: "/fees/reports" },
          { name: "Receipts", icon: <FileText size={16} />, path: "/fees/receipts" },
          { name: "Student Ledger", icon: <BookOpenCheck size={16} />, path: "/fees/ledger" },
          { name: "Reminders", icon: <Bell size={16} />, path: "/fees/reminders" },
          { name: "Settings", icon: <Settings size={16} />, path: "/fees/settings" },
        ],
      },
    ],
  },
  {
    section: "Management",
    items: [
      { name: "Transport", icon: <Bus size={20} />, path: "/transport" },
      { name: "Library", icon: <Library size={20} />, path: "/library" },
      {
        name: "Hostel",
        icon: <BedDouble size={20} />,
        children: [
          { name: "Room Allocation", icon: <BedDouble size={16} />, path: "/hostel/rooms" },
          { name: "Hostel Fees", icon: <IndianRupee size={16} />, path: "/hostel/fees" },
          { name: "Mess Management", icon: <Package size={16} />, path: "/hostel/mess" },
        ],
      },
      {
        name: "Inventory",
        icon: <Package size={20} />,
        children: [
          { name: "Asset List", icon: <Package size={16} />, path: "/inventory/assets" },
          { name: "Issue Assets", icon: <Send size={16} />, path: "/inventory/issue" },
          { name: "Stock Management", icon: <Database size={16} />, path: "/inventory/stock" },
        ],
      },
    ],
  },
  {
    section: "HR & Communication",
    items: [
      {
        name: "HR",
        icon: <UserCog size={20} />,
        children: [
          { name: "Staff List", icon: <Users size={16} />, path: "/hr/staff" },
          { name: "Payroll", icon: <Wallet size={16} />, path: "/hr/payroll" },
          { name: "Leave Management", icon: <Clock size={16} />, path: "/hr/leave" },
          { name: "Staff Attendance", icon: <ClipboardCheck size={16} />, path: "/hr/attendance" },
        ],
      },
      {
        name: "Communication",
        icon: <MessageSquare size={20} />,
        children: [
          { name: "Notice Board", icon: <FileText size={16} />, path: "/communication/notices" },
          { name: "Send SMS", icon: <Send size={16} />, path: "/communication/sms" },
          { name: "WhatsApp", icon: <MessageSquare size={16} />, path: "/communication/whatsapp" },
          { name: "Circular", icon: <FileText size={16} />, path: "/communication/circular" },
        ],
      },
      {
        name: "Certificates",
        icon: <Award size={20} />,
        children: [
          { name: "Transfer Certificate", icon: <FileText size={16} />, path: "/certificates/tc" },
          { name: "Character Cert", icon: <Award size={16} />, path: "/certificates/character" },
          { name: "Migration Cert", icon: <FileText size={16} />, path: "/certificates/migration" },
        ],
      },
    ],
  },
  {
    section: "Analytics",
    items: [
      { name: "Reports", icon: <BarChart3 size={20} />, path: "/reports" },
    ],
  },
  {
    section: "Design Studio",
    items: [
      {
        name: "YN-UDP Designer",
        icon: <Brush size={20} />,
        children: [
          { name: "Template Designer", icon: <Palette size={16} />, path: "/yn-udp" },
        ],
      },
    ],
  },
  {
    section: "System",
    items: [
      {
        name: "Settings",
        icon: <Settings size={20} />,
        children: [
          { name: "Subscription", path: "/settings/subscription", icon: <CreditCard size={16} /> },
          { name: "User Management", path: "/settings/users", icon: <UserPlus size={16} /> },
          { name: "Theme", path: "/settings/theme", icon: <Palette size={16} /> },
          { name: "Data Backup", path: "/backup", icon: <Database size={16} /> },
        ],
      },
    ],
  },
];

//////////////////////////////////////////////////
// SUPER ADMIN MENU
//////////////////////////////////////////////////

const superAdminMenu: SectionGroup[] = [
  {
    section: "",
    items: [
      { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    ],
  },
  {
    section: "SaaS Control",
    items: [
      { name: "Tenants", icon: <Building2 size={20} />, path: "/tenants" },
      { name: "Subscriptions", icon: <CreditCard size={20} />, path: "/subscriptions" },
    ],
  },
  {
    section: "Analytics",
    items: [
      { name: "Reports", icon: <BarChart3 size={20} />, path: "/reports" },
    ],
  },
  {
    section: "System",
    items: [
      { name: "Settings", icon: <Settings size={20} />, path: "/settings" },
    ],
  },
];

//////////////////////////////////////////////////
// MOBILE BOTTOM NAV ITEMS
//////////////////////////////////////////////////

const mobileNavItems = [
  { name: "Home", icon: <Home size={22} />, path: "/dashboard" },
  { name: "Students", icon: <Users size={22} />, path: "/students" },
  { name: "Attendance", icon: <ClipboardCheck size={22} />, path: "/attendance" },
  { name: "Fees", icon: <IndianRupee size={22} />, path: "/fees/collection" },
  { name: "More", icon: <MoreHorizontal size={22} />, path: "__more__" },
];

//////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////

type SidebarProps = {
  tenant?: any;
};

//////////////////////////////////////////////////
// SIDEBAR COMPONENT
//////////////////////////////////////////////////

export default function Sidebar({ tenant }: SidebarProps) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const localTenant = JSON.parse(localStorage.getItem("tenant") || "{}");
  const [devProfile, setDevProfile] = useState<any>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const location = useLocation();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const safeTenant = tenant || localTenant || {};

  const sidebarTitle = isSuperAdmin
    ? "Super Admin"
    : safeTenant?.name || "School Name";

  const sidebarLogo = isSuperAdmin
    ? "/super-admin-logo.png"
    : getFullUrl(safeTenant?.logoUrl);

  const menu = isSuperAdmin ? superAdminMenu : tenantMenu;

  // Fetch developer profile
  useEffect(() => {
    if (isSuperAdmin) return;
    const cached = localStorage.getItem("devProfile");
    if (cached) {
      try { setDevProfile(JSON.parse(cached)); } catch {}
    }
    axios.get("/api/developer-profile").then((res) => {
      const data = res.data?.data;
      if (data) {
        setDevProfile(data);
        localStorage.setItem("devProfile", JSON.stringify(data));
      }
    }).catch(() => {});
  }, []);

  // Close more menu on route change
  useEffect(() => {
    setMoreMenuOpen(false);
  }, [location.pathname]);

  // Flatten all menu items for "More" menu
  const allNavItems = useMemo(() => {
    const items: { name: string; icon: any; path: string }[] = [];
    menu.forEach((group) => {
      group.items.forEach((item) => {
        if (item.path) {
          items.push({ name: item.name, icon: item.icon, path: item.path });
        }
        if (item.children) {
          item.children.forEach((child) => {
            items.push({ name: child.name, icon: child.icon, path: child.path });
          });
        }
      });
    });
    return items;
  }, [menu]);

  return (
    <>
      {/* ════════════════════════════════════════════════════════════ */}
      {/* DESKTOP SIDEBAR */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="sidebar-desktop w-[280px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white min-h-screen shadow-2xl flex flex-col border-r border-slate-800 print:hidden">
        {/* HEADER */}
        <div
          className="p-4 border-b border-slate-800 relative overflow-hidden flex-shrink-0"
          style={{
            backgroundImage: getFullUrl(safeTenant?.backgroundUrl)
              ? `url(${getFullUrl(safeTenant?.backgroundUrl)})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {getFullUrl(safeTenant?.backgroundUrl) && (
            <div className="absolute inset-0 bg-black/50" />
          )}
          <div className="flex flex-col items-center text-center relative z-10">
            {sidebarLogo ? (
              <img
                src={sidebarLogo}
                alt="Logo"
                className="w-12 h-12 object-contain rounded-lg"
                crossOrigin="anonymous"
                onError={(e: any) => { e.target.style.display = "none"; }}
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-lg font-bold border-2 border-indigo-400 shadow-xl">
                {isSuperAdmin ? "S" : safeTenant?.name?.charAt(0) || "T"}
              </div>
            )}
            <h1 className="mt-2 text-sm font-bold text-white leading-tight truncate max-w-full">
              {safeTenant?.name || sidebarTitle}
            </h1>
            {isSuperAdmin && (
              <p className="text-[10px] text-slate-400 mt-0.5">System Control</p>
            )}
          </div>
        </div>

        {/* MENU */}
        <div className="flex-1 overflow-y-auto px-2 py-3 sidebar-scroll scrollbar-thin">
          {menu.map((group, gi) => (
            <div key={gi}>
              {group.section && (
                <p className="text-[10px] text-slate-500 mt-4 mb-1.5 px-3 uppercase tracking-[1.5px] font-semibold">
                  {group.section}
                </p>
              )}
              {group.items.map((item, i) =>
                item.children ? (
                  <ParentNavItem key={i} item={item} />
                ) : (
                  <NavItem key={i} to={item.path!} icon={item.icon} label={item.name} badge={item.badge} />
                )
              )}
            </div>
          ))}
        </div>

        {/* DEVELOPER SECTION */}
        {!isSuperAdmin && devProfile && devProfile.isVisible && (
          <div className="mt-auto border-t border-slate-800 p-3 flex-shrink-0">
            <div className="bg-slate-800/60 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2.5">
                {devProfile.photoUrl ? (
                  <img
                    src={devProfile.photoUrl}
                    alt={devProfile.name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-indigo-400"
                    onError={(e: any) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold border-2 border-indigo-400">
                    {devProfile.name?.charAt(0) || "D"}
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{devProfile.name}</p>
                  <p className="text-[10px] text-slate-400">Developer / Support</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                {devProfile.whatsapp && (
                  <a
                    href={`https://wa.me/${devProfile.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-md text-[10px] font-medium transition-colors min-h-[32px]"
                  >
                    💬 WhatsApp
                  </a>
                )}
                {devProfile.email && (
                  <a
                    href={`mailto:${devProfile.email}`}
                    className="flex items-center gap-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-[10px] font-medium transition-colors min-h-[32px]"
                  >
                    ✉️ Email
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="bottom-nav" aria-label="Main navigation">
        <div className="bottom-nav-inner">
          {mobileNavItems.map((item) => {
            if (item.path === "__more__") {
              return (
                <button
                  key="more"
                  onClick={() => setMoreMenuOpen(true)}
                  className={`bottom-nav-item ${moreMenuOpen ? 'active' : ''}`}
                  aria-label="More options"
                  type="button"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              );
            }
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                aria-label={item.name}
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MOBILE MORE MENU (Full-screen sheet) */}
      {/* ════════════════════════════════════════════════════════════ */}
      {moreMenuOpen && (
        <div className="more-menu-overlay" onClick={() => setMoreMenuOpen(false)}>
          <div className="more-menu-sheet" onClick={(e) => e.stopPropagation()}>
            {/* Drag handle */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-2 pb-3 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">All Modules</h3>
              <button
                onClick={() => setMoreMenuOpen(false)}
                className="tap-target rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            {/* Grid of items */}
            <div className="more-menu-grid">
              {allNavItems.slice(0, 24).map((item, idx) => (
                <NavLink
                  key={idx}
                  to={item.path}
                  className="more-menu-item"
                  onClick={() => setMoreMenuOpen(false)}
                >
                  <span className="text-primary-500">{item.icon}</span>
                  <span className="line-clamp-2">{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

//////////////////////////////////////////////////
// PARENT NAV ITEM (Collapsible)
//////////////////////////////////////////////////

const ParentNavItem = ({ item }: { item: MenuItem }) => {
  const location = useLocation();

  const isChildActive = item.children?.some(
    (child) => location.pathname === child.path || location.pathname.startsWith(child.path + "/")
  );

  const [open, setOpen] = useState(!!isChildActive);

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setOpen(!open)}
        className={`group relative w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 min-h-[40px] ${
          isChildActive || open
            ? "bg-gradient-to-r from-indigo-600/80 to-blue-600/80 text-white shadow-lg shadow-indigo-500/20"
            : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
        }`}
        aria-expanded={open}
        aria-label={item.name}
      >
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0">{item.icon}</span>
          <span className="text-sm font-medium nav-label">{item.name}</span>
        </div>
        <span className={`transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"}`}>
          <ChevronDown size={16} />
        </span>
      </button>

      {/* Children */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pl-4 mt-0.5 space-y-0.5 border-l border-slate-700/50 ml-5">
          {item.children?.map((child, ci) => (
            <NavItem key={ci} to={child.path} icon={child.icon} label={child.name} compact />
          ))}
        </div>
      </div>
    </div>
  );
};

//////////////////////////////////////////////////
// NAV ITEM
//////////////////////////////////////////////////

type NavItemProps = {
  to: string;
  icon: any;
  label: string;
  badge?: number;
  compact?: boolean;
};

const NavItem = ({ to, icon, label, badge, compact }: NavItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `group flex items-center gap-3 rounded-lg transition-all duration-200 text-sm ${
        compact ? "px-3 py-2 min-h-[36px]" : "px-3 py-2.5 min-h-[40px]"
      } ${
        isActive
          ? "bg-white/10 text-white font-medium shadow-sm"
          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
      }`
    }
    aria-label={label}
  >
    <span className="flex-shrink-0">{icon}</span>
    <span className="truncate nav-label">{label}</span>
    {badge && badge > 0 && (
      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
        {badge > 99 ? "99+" : badge}
      </span>
    )}
  </NavLink>
);
