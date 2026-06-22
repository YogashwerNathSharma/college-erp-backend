


import { useState, useEffect } from "react";
import axios from "axios";
import { NavLink, useLocation } from "react-router-dom";

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
  // Teacher Module Icons
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

} from "lucide-react";


//////////////////////////////////////////////////////
// HELPER — Full URL for logo
//////////////////////////////////////////////////////
const getFullUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return `${path}`;
  return `/uploads/${path}`;
};

//////////////////////////////////////////////////
// 🎯 MENU TYPES
//////////////////////////////////////////////////

type MenuItem = {
  name: string;
  icon: any;
  path?: string;
  children?: { name: string; icon: any; path: string }[];
};

type SectionGroup = {
  section: string;
  items: MenuItem[];
};

//////////////////////////////////////////////////
// 🎯 TENANT MENU (Parent-Child Structure)
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

          { name: "Dashboard", path: "/attendance-dashboard", icon: <ClipboardEdit size={16}/> },
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
        //{ name: "General", path: "/settings", icon: <Settings size={16} /> },
        { name: "Subscription", path: "/settings/subscription", icon: <CreditCard size={16} /> },
        //{ name: "Profile", path: "/settings/profile", icon: <Users size={16} /> },
        { name: "User Management", path: "/settings/users", icon: <UserPlus size={16} /> },  // ← NEW
        { name: "Theme", path: "/settings/theme", icon: <Palette size={16} /> },
        { name: "Data Backup", path: "/backup", icon: <Database size={16} /> },
      ],
    },
  ],

},
]

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
// TYPES
//////////////////////////////////////////////////

type SidebarProps = {
  tenant?: any;
};

//////////////////////////////////////////////////
// SIDEBAR
//////////////////////////////////////////////////

export default function Sidebar({ tenant }: SidebarProps) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const localTenant = JSON.parse(localStorage.getItem("tenant") || "{}");
  const [devProfile, setDevProfile] = useState<any>(null);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const safeTenant = tenant || localTenant || {};

  const sidebarTitle = isSuperAdmin
    ? "Super Admin"
    : safeTenant?.name || "School Name";

  const sidebarLogo = isSuperAdmin
    ? "/super-admin-logo.png"
    : getFullUrl(safeTenant?.logoUrl);

  const menu = isSuperAdmin ? superAdminMenu : tenantMenu;

  // Fetch developer profile for non-super-admin users
  useEffect(() => {
    if (isSuperAdmin) return;
    
    // Check localStorage cache first
    const cached = localStorage.getItem("devProfile");
    if (cached) {
      try { setDevProfile(JSON.parse(cached)); } catch {}
    }

    // Fetch fresh
    axios.get("/api/developer-profile").then((res) => {
      const data = res.data?.data;
      if (data) {
        setDevProfile(data);
        localStorage.setItem("devProfile", JSON.stringify(data));
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="w-72 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white min-h-screen shadow-2xl flex flex-col border-r border-slate-800 print:hidden">

      {/* HEADER */}
      <div
        className="p-4 border-b border-slate-800 relative overflow-hidden"
        style={{
          backgroundImage: getFullUrl(safeTenant?.backgroundUrl)
            ? `url(${getFullUrl(safeTenant?.backgroundUrl)})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay — sirf tab jab background image ho */}
        {getFullUrl(safeTenant?.backgroundUrl) && (
          <div className="absolute inset-0 bg-black/50"></div>
        )}

        <div className="flex flex-col items-center text-center relative z-10">
          {sidebarLogo ? (
            <img
              src={sidebarLogo}
              alt="Logo"
              className="w-14 h-14 object-contain"
              onError={(e: any) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold border-2 border-indigo-400 shadow-xl">
              {isSuperAdmin ? "S" : safeTenant?.name?.charAt(0) || "T"}
            </div>
          )}

          <h1 className="mt-1 text-base font-bold text-white leading-tight">
            {safeTenant?.name || sidebarTitle}
          </h1>

          {isSuperAdmin && (
            <p className="text-xs text-slate-400 mt-0">System Control</p>
          )}
        </div>
      </div>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 sidebar-scroll">
        {menu.map((group, gi) => (
          <div key={gi}>
            {/* Section Header */}
            {group.section && (
              <p className="text-[10px] text-slate-500 mt-3 mb-1 px-3 uppercase tracking-[2px] font-semibold">
                {group.section}
              </p>
            )}

            {/* Menu Items */}
            {group.items.map((item, i) =>
              item.children ? (
                <ParentNavItem key={i} item={item} />
              ) : (
                <NavItem key={i} to={item.path!} icon={item.icon} label={item.name} />
              )
            )}
          </div>
        ))}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ABOUT DEVELOPER (Shown only to Tenant users) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {!isSuperAdmin && devProfile && devProfile.isVisible && (
        <div className="mt-auto border-t border-slate-800 p-3">
          <div className="bg-slate-800/60 rounded-xl p-3 space-y-2">
            {/* Header */}
            <div className="flex items-center gap-2.5">
              {devProfile.photoUrl ? (
                <img
                  src={devProfile.photoUrl.startsWith("http") ? devProfile.photoUrl : devProfile.photoUrl}
                  alt={devProfile.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-indigo-400"
                  onError={(e: any) => { e.target.style.display = "none"; }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold border-2 border-indigo-400">
                  {devProfile.name?.charAt(0) || "D"}
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-white leading-tight">{devProfile.name}</p>
                <p className="text-[10px] text-slate-400">Developer / Support</p>
              </div>
            </div>

            {/* Calling Hours */}
            {devProfile.callingHours && (
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                📞 Call: <span className="text-slate-300 font-medium">{devProfile.callingHours}</span>
              </p>
            )}

            {/* Message */}
            {devProfile.message && (
              <p className="text-[10px] text-amber-300 italic">💡 {devProfile.message}</p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              {devProfile.whatsapp && (
                <a
                  href={`https://wa.me/${devProfile.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded-md text-[10px] font-medium transition-colors"
                >
                  💬 WhatsApp
                </a>
              )}
              {devProfile.email && (
                <a
                  href={`mailto:${devProfile.email}`}
                  className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-[10px] font-medium transition-colors"
                >
                  ✉️ Email
                </a>
              )}
              {devProfile.linkedinUrl && (
                <a
                  href={devProfile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded-md text-[10px] font-medium transition-colors"
                >
                  in
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

//////////////////////////////////////////////////
// PARENT NAV ITEM (Collapsible with children)
//////////////////////////////////////////////////

const ParentNavItem = ({ item }: { item: MenuItem }) => {
  const location = useLocation();

  // Auto-open if any child route is active
  const isChildActive = item.children?.some(
    (child) => location.pathname === child.path || location.pathname.startsWith(child.path + "/")
  );

  const [open, setOpen] = useState(!!isChildActive);

  return (
    <div className="mb-0.5">
      {/* Parent Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`group relative w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-300 ${
          isChildActive || open
            ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg flex items-center justify-center">
            {item.icon}
          </span>
          <span className="font-medium text-[13px]">{item.name}</span>
        </div>

        <ChevronDown
          size={16}
          className={`${isChildActive || open ? "text-white" : "text-slate-400"} transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Children (animated) */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="ml-3 pl-2.5 border-l border-slate-700/50 mt-0.5 space-y-0">
          {item.children?.map((child, ci) => (
            <NavLink
              key={ci}
              to={child.path}
              end={child.path === "/students" || child.path === "/fees"}
              className={({ isActive }) =>
                `group flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all duration-200 ${
                  isActive
                    ? "bg-white/10 text-white font-semibold border-l-2 border-white -ml-[13px] pl-[22px]"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`
              }
            >
              <span className="flex items-center justify-center">
                {child.icon}
              </span>
              <span className="text-[12px] font-medium">{child.name}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

//////////////////////////////////////////////////
// SIMPLE NAV ITEM (No children)
//////////////////////////////////////////////////

const NavItem = ({ to, icon, label }: { to: string; icon: any; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `group relative flex items-center justify-between px-3 py-2 rounded-lg mb-0.5 transition-all duration-300 ${
        isActive
          ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`
    }
  >
    <div className="flex items-center gap-2.5">
      <span className="text-lg flex items-center justify-center">{icon}</span>
      <span className="font-medium text-[13px]">{label}</span>
    </div>

    <ChevronRight
      size={16}
      className="opacity-60 transition-all duration-300 group-hover:translate-x-1"
    />
  </NavLink>
);

