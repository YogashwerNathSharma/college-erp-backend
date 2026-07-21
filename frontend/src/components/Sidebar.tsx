import { useState, useEffect, useCallback } from "react";
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
  X,
  Award,
  Package,
  BedDouble,
  Send,
  MapPin,
  LogOut,
  DoorOpen,
  CalendarDays,
  HelpCircle,
  FileArchive,
  ShieldCheck,
  Activity,
  Monitor,
  Puzzle,
  Blocks,
  Megaphone,
  LifeBuoy,
  Cpu,
  Lock,
  ScrollText,
} from "lucide-react";

//////////////////////////////////////////////////
// 🎯 MENU TYPES (Fixed Type Definitions)
//////////////////////////////////////////////////
type ChildMenuItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

type MenuItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  badge?: number;
  children?: ChildMenuItem[];
};

type SectionGroup = {
  section: string;
  items: MenuItem[];
};

//////////////////////////////////////////////////
// 🎯 TENANT MENU
//////////////////////////////////////////////////
const tenantMenu: SectionGroup[] = [
  {
    section: "",
    items: [
      { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    ],
  },
  {
    section: "MASTER DATA",
    items: [
      { name: "Masters", icon: <Database size={20} />, path: "/masters" },
      {
        name: "Academic Setup",
        icon: <School size={20} />,
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
    section: "ACADEMICS",
    items: [
      {
        name: "Students",
        icon: <Users size={20} />,
        children: [
          { name: "Dashboard", icon: <LayoutDashboard size={16} />, path: "/student-dashboard" },
          { name: "All Students", icon: <Users size={16} />, path: "/students" },
          { name: "New Admission", icon: <UserCheck size={16} />, path: "/students/new-admission" },
          { name: "Quick Admission", icon: <UserCheck size={16} />, path: "/students/quick-admission" },
          { name: "Admission Approval", icon: <FileText size={16} />, path: "/students/admission-approval" },
          { name: "Old Student Entry", icon: <FileText size={16} />, path: "/students/old-entry" },
          { name: "Promotion", icon: <GraduationCap size={16} />, path: "/students/promotion" },
          { name: "Transfer", icon: <FileText size={16} />, path: "/students/transfer" },
          { name: "Certificates", icon: <FileText size={16} />, path: "/students/certificates" },
          { name: "Communication", icon: <FileText size={16} />, path: "/students/bulk-communication" },
          { name: "Duplicates", icon: <Users size={16} />, path: "/students/duplicates" },
          { name: "Age Settings", icon: <Calendar size={16} />, path: "/students/age-settings" },
          { name: "Print List", icon: <FileText size={16} />, path: "/students/print" },
          { name: "Reports", icon: <BarChart3 size={16} />, path: "/students/reports" },
          { name: "ID Card", icon: <IdCard size={16} />, path: "/students/id-card" },
          { name: "Saved Filters", icon: <FileText size={16} />, path: "/students/saved-filters" },
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
          { name: "Salary", icon: <Wallet size={16} />, path: "/teacher-salary" },
          { name: "Performance", icon: <Star size={16} />, path: "/teacher-performance" },
          { name: "Documents", icon: <FolderOpen size={16} />, path: "/teacher-documents" },
          { name: "Reports", icon: <BarChart3 size={16} />, path: "/teacher-reports" },
          { name: "ID Card", icon: <IdCard size={16} />, path: "/teacher-id-card" },
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
          { name: "Dashboard", icon: <LayoutDashboard size={16} />, path: "/exam-dashboard" },
          { name: "All Exams", icon: <FileText size={16} />, path: "/exams" },
          { name: "Grade Settings", icon: <ClipboardCheck size={16} />, path: "/grade-settings" },
          { name: "Reports", icon: <BarChart3 size={16} />, path: "/exam-reports" },
          { name: "Seating Plan", icon: <Grid3X3 size={16} />, path: "/exam-seating-plan" },
          { name: "Admit Card", icon: <CreditCard size={16} />, path: "/exam-admit-card" },
        ],
      },
      { name: "Time Table", icon: <FileClockIcon size={20} />, path: "/timeTable" },
    ],
  },
  {
    section: "FINANCE",
    items: [
      {
        name: "Fees",
        icon: <IndianRupee size={20} />,
        children: [
          { name: "Dashboard", icon: <PieChart size={16} />, path: "/fees/dashboard" },
          { name: "Collection", icon: <IndianRupee size={16} />, path: "/fees/collection" },
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
      { name: "Payment Gateway", icon: <CreditCard size={20} />, path: "/payment-gateway" },
    ],
  },
  {
    section: "OPERATIONS",
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
      {
        name: "Gate Pass",
        icon: <DoorOpen size={20} />,
        children: [
          { name: "Visitor Log", icon: <Users size={16} />, path: "/gate-pass" },
          { name: "Pending Approvals", icon: <Clock size={16} />, path: "/gate-pass/pending" },
        ],
      },
    ],
  },
  {
    section: "HR & STAFF",
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
    ],
  },
  {
    section: "COMMUNICATION",
    items: [
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
      { name: "Notifications", icon: <Bell size={20} />, path: "/notifications" },
      {
        name: "Events",
        icon: <CalendarDays size={20} />,
        children: [
          { name: "All Events", icon: <CalendarDays size={16} />, path: "/events" },
          { name: "Calendar", icon: <Calendar size={16} />, path: "/academic-calendar" },
        ],
      },
    ],
  },
  {
    section: "CERTIFICATES & DOCS",
    items: [
      {
        name: "Certificates",
        icon: <Award size={20} />,
        children: [
          { name: "Transfer Certificate", icon: <FileText size={16} />, path: "/certificates/tc" },
          { name: "Character Cert", icon: <Award size={16} />, path: "/certificates/character" },
          { name: "Migration Cert", icon: <FileText size={16} />, path: "/certificates/migration" },
        ],
      },
      { name: "File Manager", icon: <FileArchive size={20} />, path: "/file-manager" },
      { name: "ID Cards", icon: <IdCard size={20} />, path: "/qr-barcode" },
    ],
  },
  {
    section: "TOOLS & ENGINES",
    items: [
      { name: "Workflow", icon: <Activity size={20} />, path: "/workflow" },
      { name: "Form Builder", icon: <ClipboardEdit size={20} />, path: "/form-builder" },
      { name: "Report Builder", icon: <BarChart3 size={20} />, path: "/report-builder" },
      { name: "Import / Export", icon: <FolderOpen size={20} />, path: "/import-export" },
      { name: "Scheduler", icon: <CalendarClock size={20} />, path: "/scheduler" },
    ],
  },
  {
    section: "ANALYTICS",
    items: [
      { name: "Reports", icon: <BarChart3 size={20} />, path: "/reports" },
      { name: "Audit Log", icon: <Activity size={20} />, path: "/audit" },
    ],
  },
  {
    section: "DESIGN",
    items: [
      { name: "Template Designer", icon: <Brush size={20} />, path: "/yn-udp" },
      { name: "Dashboard Builder", icon: <LayoutDashboard size={20} />, path: "/dashboard-builder" },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      {
        name: "Settings",
        icon: <Settings size={20} />,
        children: [
          { name: "General", path: "/settings", icon: <Settings size={16} /> },
          { name: "Subscription", path: "/settings/subscription", icon: <CreditCard size={16} /> },
          { name: "User Management", path: "/settings/users", icon: <UserPlus size={16} /> },
          { name: "Roles & Permissions", path: "/settings/roles", icon: <ShieldCheck size={16} /> },
          { name: "Theme", path: "/settings/theme", icon: <Palette size={16} /> },
          { name: "Languages", path: "/languages", icon: <MapPin size={16} /> },
          { name: "Data Backup", path: "/backup", icon: <Database size={16} /> },
          { name: "Audit Log", path: "/audit", icon: <Activity size={16} /> },
        ],
      },
      { name: "Help Desk", icon: <HelpCircle size={20} />, path: "/helpdesk" },
    ],
  },
];

const superAdminMenu: SectionGroup[] = [
  {
    section: "PLATFORM",
    items: [
      { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/super-admin" },
      { name: "Tenant Management", icon: <Building2 size={20} />, path: "/super-admin/tenants" },
      { name: "Subscription & Billing", icon: <CreditCard size={20} />, path: "/super-admin/subscriptions" },
    ],
  },
  {
    section: "ADMINISTRATION",
    items: [
      { name: "User Management", icon: <Users size={20} />, path: "/super-admin/users" },
      { name: "IAM & Permissions", icon: <ShieldCheck size={20} />, path: "/super-admin/iam" },
      { name: "Module Management", icon: <Blocks size={20} />, path: "/super-admin/modules" },
      { name: "Plugin Management", icon: <Puzzle size={20} />, path: "/super-admin/plugins" },
    ],
  },
  {
    section: "OPERATIONS",
    items: [
      { name: "Monitoring", icon: <Monitor size={20} />, path: "/super-admin/monitoring" },
      { name: "Database", icon: <Database size={20} />, path: "/super-admin/database" },
      { name: "Security Center", icon: <Lock size={20} />, path: "/super-admin/security" },
    ],
  },
  {
    section: "REPORTS & LOGS",
    items: [
      { name: "Audit Center", icon: <ScrollText size={20} />, path: "/super-admin/audit" },
      { name: "Report Center", icon: <BarChart3 size={20} />, path: "/super-admin/reports" },
      { name: "Notification Center", icon: <Bell size={20} />, path: "/super-admin/notifications" },
    ],
  },
  {
    section: "SUPPORT",
    items: [
      { name: "Support Center", icon: <LifeBuoy size={20} />, path: "/super-admin/support" },
      { name: "Announcements", icon: <Megaphone size={20} />, path: "/super-admin/announcements" },
    ],
  },
  {
    section: "SETTINGS",
    items: [
      { name: "System Settings", icon: <Settings size={20} />, path: "/super-admin/settings" },
      { name: "Theme", icon: <Palette size={20} />, path: "/super-admin/theme" },
    ],
  },
];

type SidebarProps = {
  tenant?: any;
  sidebarOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ tenant, sidebarOpen = false, onClose }: SidebarProps) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const localTenant = JSON.parse(localStorage.getItem("tenant") || "{}");
  const [devProfile, setDevProfile] = useState<any>(null);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const safeTenant = tenant || localTenant || {};

  const sidebarTitle = isSuperAdmin ? "Super Admin" : safeTenant?.name || "School Name";
  const sidebarLogo = isSuperAdmin ? "/super-admin-logo.png" : getFullUrl(safeTenant?.logoUrl);
  const menu = isSuperAdmin ? superAdminMenu : tenantMenu;

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
  }, [isSuperAdmin]);

  const handleMobileNavClick = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  const handleLogout = () => {
    localStorage.clear(); // Clear all instances at once safely
    window.location.href = "/";
  };

  // Shared Nav Menu Rendering block to avoid duplicate code blocks
  const renderMenuItems = (isMobileLayout: boolean) => {
    return menu.map((group, gi) => (
      <div key={gi} className="mb-2 space-y-1">
        {group.section && (
          <p className="text-[10px] text-slate-500 mt-4 mb-1.5 px-3 uppercase tracking-[1.2px] font-bold select-none">
            {group.section}
          </p>
        )}
        {group.items.map((item, i) =>
          item.children ? (
            <ParentNavItem 
              key={i} 
              item={item} 
              collapsed={false} 
              isMobile={isMobileLayout} 
              toggleSubMenu={isMobileLayout ? handleMobileNavClick : undefined} 
            />
          ) : (
            <NavItem 
              key={i} 
              to={item.path!} 
              icon={item.icon} 
              label={item.name} 
              badge={item.badge} 
              collapsed={false} 
              onClick={isMobileLayout ? handleMobileNavClick : undefined}
            />
          )
        )}
      </div>
    ));
  };

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* DESKTOP SIDEBAR */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <aside
        className="sidebar-desktop hidden md:flex fixed left-0 top-0 h-screen z-40 flex-col print:hidden w-[260px]"
        style={{
          background: "linear-gradient(180deg, #1e2a4a 0%, #152038 50%, #0f1729 100%)",
        }}
      >
        <div className="relative flex-shrink-0 border-b border-white/10">
          {getFullUrl(safeTenant?.backgroundUrl) && (
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url(${getFullUrl(safeTenant?.backgroundUrl)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}
          <div className="relative z-10 flex items-center gap-3 p-4">
            {sidebarLogo ? (
              <img
                src={sidebarLogo}
                alt="Logo"
                className="w-11 h-11 object-contain rounded-lg flex-shrink-0 border-2 border-amber-400/40 shadow-lg shadow-amber-900/20"
                crossOrigin="anonymous"
                onError={(e: any) => { e.target.style.display = "none"; }}
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-lg border-2 border-amber-400/50 shadow-lg shadow-amber-900/20 flex-shrink-0">
                {isSuperAdmin ? "S" : safeTenant?.name?.charAt(0) || "T"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold text-white leading-tight truncate">
                {sidebarTitle}
              </h1>
              <p className="text-[10px] text-amber-400/80 font-medium mt-0.5 truncate">
                {isSuperAdmin ? "System Control" : "Institution ERP"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 sidebar-scroll">
          <style>{`
            .sidebar-scroll::-webkit-scrollbar { width: 4px; }
            .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
            .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
            .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
          `}</style>
          {renderMenuItems(false)}
        </div>

        {/* Desktop Logout Button */}
        <div className="p-3 border-t border-white/10 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MOBILE SIDEBAR */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* Mobile Sidebar Panel — fixed, independent of backdrop */}
      {sidebarOpen && (
        <aside
          className="sidebar-mobile md:hidden fixed left-0 top-0 h-full w-[75vw] max-w-[280px] z-[999] flex flex-col text-white border-r border-white/10 shadow-2xl print:hidden"
          style={{
            background: "linear-gradient(180deg, #1e2a4a 0%, #152038 50%, #0f1729 100%)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {sidebarLogo ? (
                <img
                  src={sidebarLogo}
                  alt="Logo"
                  className="w-9 h-9 object-contain rounded-lg flex-shrink-0 border-2 border-amber-400/40"
                  crossOrigin="anonymous"
                  onError={(e: any) => { e.target.style.display = "none"; }}
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-sm">
                  {isSuperAdmin ? "S" : safeTenant?.name?.charAt(0) || "T"}
                </div>
              )}
              <span className="font-bold text-sm truncate">{sidebarTitle}</span>
            </div>
            <button
              onClick={handleMobileNavClick}
              className="p-2 rounded-lg bg-white/10 text-slate-300 hover:text-white tap-target"
            >
              <X size={18} />
            </button>
          </div>

          {/* Menu Links */}
          <div className="flex-1 overflow-y-auto px-2 py-3 sidebar-scroll">
            {renderMenuItems(true)}
          </div>

          {/* Footer / Logout */}
          <div className="p-3 border-t border-white/10 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      )}
    </>
  );
}

//////////////////////////////////////////////////
// 🎯 SUB-COMPONENTS (NavItem & ParentNavItem)
//////////////////////////////////////////////////
type NavItemProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  collapsed: boolean;
  onClick?: () => void;
};

function NavItem({ to, icon, label, badge, collapsed, onClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
          isActive
            ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-600/15"
            : "text-slate-400 hover:text-white hover:bg-white/5"
        }`
      }
    >
      <div className="flex-shrink-0">{icon}</div>
      {!collapsed && <span className="truncate flex-1">{label}</span>}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

type ParentNavItemProps = {
  item: MenuItem;
  collapsed: boolean;
  isMobile: boolean;
  toggleSubMenu?: () => void;
};

function ParentNavItem({ item, collapsed, isMobile, toggleSubMenu }: ParentNavItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Check if any child route is currently active
  const isChildActive = item.children?.some((child) => location.pathname === child.path) || false;

  useEffect(() => {
    if (isChildActive) {
      setIsOpen(true);
    }
  }, [isChildActive]);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isChildActive
            ? "text-amber-400 bg-amber-500/5"
            : "text-slate-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <div className="flex-shrink-0">{item.icon}</div>
        {!collapsed && <span className="truncate flex-1 text-left">{item.name}</span>}
        {!collapsed && (
          <div className="flex-shrink-0 text-slate-500">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        )}
      </button>

      {isOpen && !collapsed && (
        <div className="pl-6 space-y-1 relative before:absolute before:left-[19px] before:top-0 before:bottom-2 before:w-[1px] before:bg-white/10">
          {item.children?.map((child, idx) => (
            <NavLink
              key={idx}
              to={child.path}
              onClick={toggleSubMenu}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "text-amber-400 bg-amber-500/10 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <div className="flex-shrink-0">{child.icon}</div>
              <span className="truncate">{child.name}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
