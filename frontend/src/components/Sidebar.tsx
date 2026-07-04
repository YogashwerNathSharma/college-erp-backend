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
  ChevronLeft,
  DoorOpen,
  CalendarDays,
  HelpCircle,
  FileArchive,
  ShieldCheck,
  Activity,
  Ticket,
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
      {
        name: "Masters",
        icon: <Database size={20} />,
        children: [
          { name: "All Masters", icon: <Database size={16} />, path: "/masters" },
          { name: "Organization", icon: <Building2 size={16} />, path: "/masters/organization" },
          { name: "Academic", icon: <GraduationCap size={16} />, path: "/masters/academic" },
          { name: "Student", icon: <Users size={16} />, path: "/masters/student" },
          { name: "Staff", icon: <UserCog size={16} />, path: "/masters/staff" },
          { name: "Fee", icon: <IndianRupee size={16} />, path: "/masters/fee" },
          { name: "Examination", icon: <FileText size={16} />, path: "/masters/examination" },
          { name: "Attendance", icon: <ClipboardCheck size={16} />, path: "/masters/attendance" },
          { name: "Library", icon: <Library size={16} />, path: "/masters/library" },
          { name: "Hostel", icon: <BedDouble size={16} />, path: "/masters/hostel" },
          { name: "Transport", icon: <Bus size={16} />, path: "/masters/transport" },
          { name: "Inventory", icon: <Package size={16} />, path: "/masters/inventory" },
          { name: "HR & Payroll", icon: <Wallet size={16} />, path: "/masters/hr" },
          { name: "Communication", icon: <MessageSquare size={16} />, path: "/masters/communication" },
          { name: "Certificate", icon: <Award size={16} />, path: "/masters/certificate" },
          { name: "Security", icon: <ShieldCheck size={16} />, path: "/masters/security" },
          { name: "Document", icon: <FileArchive size={16} />, path: "/masters/document" },
          { name: "Event", icon: <CalendarDays size={16} />, path: "/masters/event" },
          { name: "Visitor", icon: <DoorOpen size={16} />, path: "/masters/visitor" },
          { name: "System", icon: <Settings size={16} />, path: "/masters/system" },
        ],
      },
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

type SidebarProps = {
  tenant?: any;
  sidebarOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ tenant, sidebarOpen = false, onClose }: SidebarProps) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const localTenant = JSON.parse(localStorage.getItem("tenant") || "{}");
  const [devProfile, setDevProfile] = useState<any>(null);

  const [activeSubMenu, setActiveSubMenu] = useState<MenuItem | null>(null);

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

  useEffect(() => {
    if (!sidebarOpen) {
      setActiveSubMenu(null);
    }
  }, [sidebarOpen]);

  const handleMobileNavClick = useCallback(() => {
    setActiveSubMenu(null); 
    if (onClose) onClose();
  }, [onClose]);

  // Reset sub-menu panel when sidebar closes
  useEffect(() => {
    if (!sidebarOpen) {
      setActiveSubMenu(null);
    }
  }, [sidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tenant");
    window.location.href = "/";
  };

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* DESKTOP SIDEBAR (Unchanged) */}
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
                {safeTenant?.name || sidebarTitle}
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

          {menu.map((group, gi) => (
            <div key={gi} className="mb-1">
              {group.section && (
                <p className="text-[10px] text-slate-500 mt-4 mb-1.5 px-3 uppercase tracking-[1.2px] font-bold select-none">
                  {group.section}
                </p>
              )}
              {group.items.map((item, i) =>
                item.children ? (
                  <ParentNavItem key={i} item={item} collapsed={false} isMobile={false} />
                ) : (
                  <NavItem key={i} to={item.path!} icon={item.icon} label={item.name} badge={item.badge} collapsed={false} />
                )
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MOBILE SIDEBAR — Premium Modern Glassmorphism */}
      {/* ════════════════════════════════════════════════════════════════ */}//////////app.tsx//////import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useState, useEffect, lazy, Suspense, Component, ReactNode } from "react";
import axios from "axios";
import { API_BASE_URL } from "./config/api";

// ✅ Only Layout components stay as eager imports (always visible)
import Sidebar from "./components/Sidebar";
import TopNavbar from "./components/TopNavbar";
import YnAiAssistant from "./components/YnAiAssistant";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE LOADER (lightweight spinner shown while pages load)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center h-64 animate-fade-in">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-slate-700" />
      <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
    </div>
    <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">Loading...</p>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAZY IMPORTS — Each page loads ONLY when user visits it
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 🔄 Retry wrapper for lazy imports — handles chunk load failures on slow mobile networks
function lazyWithRetry(importFn: () => Promise<any>) {
  return lazy(() =>
    importFn().catch((error: any) => {
      // On chunk load failure, retry once after a short delay
      return new Promise<any>((resolve) => setTimeout(resolve, 1500))
        .then(() => importFn())
        .catch(() => {
          // If retry also fails, reload the page to clear stale chunk cache
          // Only reload if we haven't already (prevent infinite loop)
          const hasReloaded = sessionStorage.getItem("chunk_reload");
          if (!hasReloaded) {
            sessionStorage.setItem("chunk_reload", "1");
            window.location.reload();
          }
          throw error; // let ErrorBoundary handle it
        });
    })
  );
}

// Auth
const LoginPage = lazyWithRetry(() => import("./pages/login/LoginPages"));
const ForgotPassword = lazyWithRetry(() => import("./pages/login/ForgotPassword"));
const RegisterSchool = lazyWithRetry(() => import("./pages/login/RegisterSchool"));

// Dashboards
const TenantDashboard = lazyWithRetry(() => import("./pages/TenantDashboard"));
const SuperAdminDashboard = lazyWithRetry(() => import("./pages/superAdmin/SuperAdminDashboard"));

// SuperAdmin Pages
const TenantsPage = lazyWithRetry(() => import("./pages/superAdmin/TenantsPage"));
const SuperAdminSettings = lazyWithRetry(() => import("./pages/superAdmin/SuperAdminSettings"));

// Student Module
const StudentsPage = lazyWithRetry(() => import("./pages/students/StudentsPage"));
const AdmissionForm = lazyWithRetry(() => import("./pages/students/AdmissionForm"));
const OldStudentEntry = lazyWithRetry(() => import("./pages/students/OldStudentEntry"));
const PromotionPage = lazyWithRetry(() => import("./pages/students/PromotionPage"));
const AgeSettings = lazyWithRetry(() => import("./pages/students/AgeSettings"));
const PrintStudents = lazyWithRetry(() => import("./pages/students/PrintStudents"));
const RecycleBinPage = lazyWithRetry(() => import("./pages/students/RecycleBinPage"));
const EditStudentPage = lazyWithRetry(() => import("./pages/students/EditStudentPage"));
const StudentIdCardPage = lazyWithRetry(() => import("./pages/students/StudentIdCard"));
const StudentReportsPage = lazyWithRetry(() => import("./pages/students/StudentReportsPage"));
const AdminStudentDashboard = lazyWithRetry(() => import("./pages/students/AdminStudentDashboard"));
const StudentDashboard = lazyWithRetry(() => import("./pages/students/StudentDashboard"));
const StudentProfilePage = lazyWithRetry(() => import("./pages/students/StudentProfilePage"));

// Reports
const ReportsPage = lazyWithRetry(() => import("./pages/reports/ReportsPage"));
const CertificateGenerator = lazyWithRetry(() => import("./pages/reports/CertificateGenerator"));
const AnalyticsPage = lazyWithRetry(() => import("./pages/reports/AnalyticsPage"));

// Subscriptions
const SubscriptionsPage = lazyWithRetry(() => import("./pages/subscriptions/SubscriptionsPage"));
const SubscriptionSettings = lazyWithRetry(() => import("./pages/subscriptions/SubscriptionSettings"));
const SubscriptionExpired = lazyWithRetry(() => import("./pages/subscriptions/SubscriptionExpired"));

// Settings
const TenantAdminSettings = lazyWithRetry(() => import("./pages/settings/TenantAdminSettings"));
const SignatureMaster = lazyWithRetry(() => import("./pages/settings/SignatureMaster"));
const ThemePage = lazyWithRetry(() => import("./pages/settings/theme/ThemePage"));
const SettingsPage = lazyWithRetry(() => import("./pages/SettingsPage"));

// Academic Year
const AcademicYearPage = lazyWithRetry(() => import("./pages/academic-year/AcademicYearPage"));

// Classes
const ClassesPage = lazyWithRetry(() => import("./pages/classes/ClassesPage"));

// Sections
const Sections = lazyWithRetry(() => import("./pages/Sections/SectionsPage"));

// Subjects
const SubjectsPage = lazyWithRetry(() => import("./pages/Subjects/SubjectsPage"));

// Teachers
const Teachers = lazyWithRetry(() => import("./pages/teachers/Teachers"));
const AddEditTeacher = lazyWithRetry(() => import("./pages/teachers/AddEditTeacher"));
const TeacherDashboard = lazyWithRetry(() => import("./pages/teachers/TeacherDashboard"));
const TeacherProfile = lazyWithRetry(() => import("./pages/teachers/TeacherProfile"));
const AssignSubjectToTeacher = lazyWithRetry(() => import("./pages/teachers/AssignSubjectToTeacher"));
const TeacherTimetable = lazyWithRetry(() => import("./pages/teachers/TeacherTimetable"));
const TeacherAttendance = lazyWithRetry(() => import("./pages/teachers/TeacherAttendance"));
const LeaveManagement = lazyWithRetry(() => import("./pages/teachers/LeaveManagement"));
const TeacherSalary = lazyWithRetry(() => import("./pages/teachers/TeacherSalary"));
const TeacherPerformance = lazyWithRetry(() => import("./pages/teachers/TeacherPerformance"));
const TeacherDocuments = lazyWithRetry(() => import("./pages/teachers/TeacherDocuments"));
const Communication = lazyWithRetry(() => import("./pages/teachers/Communication"));
const TeacherReports = lazyWithRetry(() => import("./pages/teachers/TeacherReports"));
const TeacherSettings = lazyWithRetry(() => import("./pages/teachers/TeacherSettings"));
const TeacherIdCard = lazyWithRetry(() => import("./pages/teachers/TeacherIdCard"));
const TeacherPortal = lazyWithRetry(() => import("./pages/teachers/TeacherPortal"));

// Principal
const PrincipalPortal = lazyWithRetry(() => import("./pages/principal/PrincipalPortal"));

// Timetable
const TimetablePage = lazyWithRetry(() => import("./pages/timeTable/TimetablePage"));

// Fees Module
const FeeHeadPage = lazyWithRetry(() => import("./pages/fees/FeeHeadPage"));
const FeeStructurePage = lazyWithRetry(() => import("./pages/fees/FeeStructurePage"));
const FeeDiscountPage = lazyWithRetry(() => import("./pages/fees/FeeDiscountPage"));
const FineRulePage = lazyWithRetry(() => import("./pages/fees/FineRulePage"));
const FeeCollectionPage = lazyWithRetry(() => import("./pages/fees/FeeCollectionPage"));
const FeeDashboardPage = lazyWithRetry(() => import("./pages/fees/FeeDashboardPage"));
const AssignFeeStructurePage = lazyWithRetry(() => import("./pages/fees/AssignFeeStructurePage"));
const FeeReportsPage = lazyWithRetry(() => import("./pages/fees/FeeReportsPage"));
const FeeReceiptsPage = lazyWithRetry(() => import("./pages/fees/FeeReceiptsPage"));
const DueFeesPage = lazyWithRetry(() => import("./pages/fees/DueFeesPage"));
const StudentLedgerPage = lazyWithRetry(() => import("./pages/fees/StudentLedgerPage"));
const FeeReminderPage = lazyWithRetry(() => import("./pages/fees/FeeReminderPage"));
const FeeSettingsPage = lazyWithRetry(() => import("./pages/fees/FeeSettingsPage"));

// Exam Module
const ExamList = lazyWithRetry(() => import("./pages/exams/ExamList"));
const GradeSettings = lazyWithRetry(() => import("./pages/exams/GradeSettings"));
const CreateEditExam = lazyWithRetry(() => import("./pages/exams/CreateEditExam"));
const ExamSubjects = lazyWithRetry(() => import("./pages/exams/ExamSubjects"));
const MarksEntry = lazyWithRetry(() => import("./pages/exams/MarksEntry"));
const Results = lazyWithRetry(() => import("./pages/exams/Results"));
// ═══ NOT lazy-loaded — these are print pages that must load immediately on mobile ═══
import ReportCard from "./pages/exams/ReportCard";
import BulkReportCard from "./pages/exams/BulkReportCard";
import ConsolidatedReportCard from "./pages/exams/ConsolidatedReportCard";
const ExamSchedule = lazyWithRetry(() => import("./pages/exams/ExamSchedule"));
const SeatingArrangement = lazyWithRetry(() => import("./pages/exams/SeatingArrangement"));
const AdmitCard = lazyWithRetry(() => import("./pages/exams/AdmitCard"));
const QuestionPaper = lazyWithRetry(() => import("./pages/exams/QuestionPaper"));
const InvigilatorAssignment = lazyWithRetry(() => import("./pages/exams/InvigilatorAssignment"));
const ExamDashboard = lazyWithRetry(() => import("./pages/exams/ExamDashboard"));
const ExamReports = lazyWithRetry(() => import("./pages/exams/ExamReports"));
const SeatingArrangementPage = lazyWithRetry(() => import("./pages/exams/SeatingArrangementPage"));
const RoomManagement = lazyWithRetry(() => import("./pages/exams/RoomManagement"));
const AdmitCardPage = lazyWithRetry(() => import("./pages/exams/AdmitCardPage"));
const ReportCardSelect = lazyWithRetry(() => import("./pages/exams/ReportCardSelect"));

// Designer
const DesignerPage = lazyWithRetry(() => import("./pages/designer/DesignerPage"));

// YN-UDP Template Designer
const YnUdpPage = lazyWithRetry(() => import("./pages/yn-udp/YnUdpPage"));

// Attendance
const AttendancePage = lazyWithRetry(() => import("./pages/AttendancePage/AttendancePage"));
const AttendanceReportPage = lazyWithRetry(() => import("./pages/AttendancePage/AttendanceReportPage"));
const AttendanceDashboardPage = lazyWithRetry(() => import("./pages/AttendancePage/AttendanceDashboardPage"));

// Library
const LibraryDashboard = lazyWithRetry(() => import("./pages/library/LibraryDashboard"));

// Transport
const TransportDashboard = lazyWithRetry(() => import("./pages/transport/TransportDashboard"));
const TransportTracking = lazyWithRetry(() => import("./pages/transport/TransportTracking"));

// Backup
const BackupPage = lazyWithRetry(() => import("./pages/backup/BackupPage"));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NEW MODULE IMPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Hostel Module
const RoomAllocation = lazyWithRetry(() => import("./pages/hostel/RoomAllocation"));
const HostelFees = lazyWithRetry(() => import("./pages/hostel/HostelFees"));
const MessManage = lazyWithRetry(() => import("./pages/hostel/MessManage"));

// HR Module
const StaffList = lazyWithRetry(() => import("./pages/hr/StaffList"));
const Payroll = lazyWithRetry(() => import("./pages/hr/Payroll"));
const LeaveManage = lazyWithRetry(() => import("./pages/hr/LeaveManage"));
const StaffAttendance = lazyWithRetry(() => import("./pages/hr/StaffAttendance"));

// Communication Module
const NoticeBoard = lazyWithRetry(() => import("./pages/communication/NoticeBoard"));
const SMSSend = lazyWithRetry(() => import("./pages/communication/SMSSend"));
const WhatsAppSend = lazyWithRetry(() => import("./pages/communication/WhatsAppSend"));
const CircularCreate = lazyWithRetry(() => import("./pages/communication/CircularCreate"));

// Certificates Module
const TCGenerate = lazyWithRetry(() => import("./pages/certificates/TCGenerate"));
const CharacterCert = lazyWithRetry(() => import("./pages/certificates/CharacterCert"));
const MigrationCert = lazyWithRetry(() => import("./pages/certificates/MigrationCert"));

// Inventory Module
const AssetList = lazyWithRetry(() => import("./pages/inventory/AssetList"));
const AssetIssue = lazyWithRetry(() => import("./pages/inventory/AssetIssue"));
const StockManage = lazyWithRetry(() => import("./pages/inventory/StockManage"));

// Admission Module
const AdmissionList = lazyWithRetry(() => import("./pages/admission/AdmissionList"));
const NewAdmission = lazyWithRetry(() => import("./pages/admission/NewAdmission"));
const AdmissionDetail = lazyWithRetry(() => import("./pages/admission/AdmissionDetail"));


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENTERPRISE MODULE IMPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Gate Pass
const GatePassDashboard = lazyWithRetry(() => import("./pages/gate-pass/GatePassDashboard"));
// Events
const EventDashboard = lazyWithRetry(() => import("./pages/events/EventDashboard"));
// Help Desk
const HelpDeskDashboard = lazyWithRetry(() => import("./pages/helpdesk/HelpDeskDashboard"));
// Workflow Engine
const WorkflowEngine = lazyWithRetry(() => import("./pages/workflow/WorkflowEngine"));
// Form Builder
const FormBuilder = lazyWithRetry(() => import("./pages/form-builder/FormBuilder"));
// Report Builder
const ReportBuilder = lazyWithRetry(() => import("./pages/report-builder/ReportBuilder"));
// Audit
const AuditDashboard = lazyWithRetry(() => import("./pages/audit/AuditDashboard"));
// Scheduler
const SchedulerDashboard = lazyWithRetry(() => import("./pages/scheduler/SchedulerDashboard"));
// Dashboard Builder
const DashboardBuilder = lazyWithRetry(() => import("./pages/dashboard-builder/DashboardBuilder"));
// QR / Barcode
const QRManager = lazyWithRetry(() => import("./pages/qr-barcode/QRManager"));
// Payment Gateway
const PaymentGateway = lazyWithRetry(() => import("./pages/payment-gateway/PaymentGateway"));
// File Manager
const FileManager = lazyWithRetry(() => import("./pages/file-manager/FileManager"));
// Notifications
const NotificationCenter = lazyWithRetry(() => import("./pages/notifications/NotificationCenter"));
// Import/Export
const ImportExport = lazyWithRetry(() => import("./pages/import-export/ImportExport"));
// Queue Monitor
const QueueMonitor = lazyWithRetry(() => import("./pages/queue/QueueMonitor"));
// Digital Signature
const DigitalSignature = lazyWithRetry(() => import("./pages/digital-signature/DigitalSignature"));
// Multi-Language
const LanguageManager = lazyWithRetry(() => import("./pages/i18n/LanguageManager"));
// AI Assistant
const AIAssistant = lazyWithRetry(() => import("./pages/ai-assistant/AIAssistant"));
// Master Module
const MasterModule = lazyWithRetry(() => import("./pages/masters/MasterModule"));

//////////////////////////////////////////////////////
// AXIOS GLOBAL CONFIG
//////////////////////////////////////////////////////
axios.defaults.baseURL = API_BASE_URL;

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔥 Response interceptor — auto-redirect on subscription expired
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 403 &&
      error?.response?.data?.subscriptionExpired === true
    ) {
      // Skip redirect for print/report pages
      const path = window.location.pathname;
      if (path.includes("/print") || path.includes("/report-card") || path.includes("/consolidated") || path.includes("/exams/")) {
        return Promise.reject(error);
      }
      // Skip on localhost (dev mode)
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return Promise.reject(error);
      }
      // Skip redirect for SUPER_ADMIN
      const userData = localStorage.getItem("user");
      const userRole = userData ? JSON.parse(userData)?.role : null;
      if (userRole === "SUPER_ADMIN") {
        return Promise.reject(error);
      }
      localStorage.setItem("subscriptionExpired", "true");
      window.location.href = "/subscription-expired";
    }
    return Promise.reject(error);
  }
);

//////////////////////////////////////////////////////
// 🛡️ Error Boundary — catches chunk load failures on mobile
//////////////////////////////////////////////////////
class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message?.includes('Loading chunk') || 
                           this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
                           this.state.error?.message?.includes('error loading dynamically imported module');
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isChunkError ? "Page failed to load" : "Something went wrong"}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {isChunkError ? "Please check your internet connection and try again." : (this.state.error?.message || "An unexpected error occurred.")}
          </p>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

//////////////////////////////////////////////////////
// Protected Route
//////////////////////////////////////////////////////
function ProtectedRoute() {
  const token = localStorage.getItem("token");
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    // Skip subscription check for SUPER_ADMIN
    const userData = localStorage.getItem("user");
    const userRole = userData ? JSON.parse(userData)?.role : null;
    if (userRole === "SUPER_ADMIN") {
      setChecking(false);
      return;
    }
    const checkSubscription = async () => {
      // Skip check for subscription-related pages
      const skipPaths = ["/subscription-expired", "/subscriptions", "/print/", "/report-card", "/consolidated", "/exams/"];
      if (skipPaths.some(p => location.pathname === p || location.pathname.includes(p))) {
        setChecking(false);
        return;
      }

      // ═══ DEV MODE: Skip subscription check on localhost ═══
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        localStorage.removeItem("subscriptionExpired");
        setExpired(false);
        setChecking(false);
        return;
      }

      // Skip check if payment was just completed (grace period)
      const paymentJustCompleted = localStorage.getItem("subscriptionPaymentTime");
      if (paymentJustCompleted) {
        const elapsed = Date.now() - parseInt(paymentJustCompleted);
        if (elapsed < 30000) { // 30 second grace after payment
          localStorage.removeItem("subscriptionExpired");
          setExpired(false);
          setChecking(false);
          return;
        } else {
          localStorage.removeItem("subscriptionPaymentTime");
        }
      }
      try {
        const res = await axios.get("/api/tenant/my-subscription", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data?.data || res.data;
        // If no subscription or expired
        if (!data || !data.endDate || data.daysRemaining <= 0 || data.status === "expired" || data.status === "cancelled") {
          localStorage.setItem("subscriptionExpired", "true");
          setExpired(true);
        } else {
          localStorage.removeItem("subscriptionExpired");
          setExpired(false);
        }
      } catch (err: any) {
        const status = err?.response?.status;
        const isSubExpired = err?.response?.data?.subscriptionExpired === true;
        if (status === 403 && isSubExpired) {
          localStorage.setItem("subscriptionExpired", "true");
          setExpired(true);
        } else {
          console.warn("Subscription check failed (non-fatal):", status, err?.message);
          setExpired(false);
        }
      } finally {
        setChecking(false);
      }
    };
    checkSubscription();
  }, [token, location.pathname]);

  // No token = not logged in
  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Show spinner while checking subscription
  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-slate-700" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
        </div>
      </div>
    );
  }

  // Subscription expired — redirect
  const isExpired = expired || localStorage.getItem("subscriptionExpired") === "true";
  // Skip subscription redirect for print/report/exam pages
  const skipRedirectPaths = ["/subscription-expired", "/subscriptions", "/print", "/report-card", "/consolidated", "/exams/"];
  const shouldSkipRedirect = skipRedirectPaths.some(p => location.pathname.includes(p));
  if (isExpired && !shouldSkipRedirect) {
    return <Navigate to="/subscription-expired" replace />;
  }

  // 🔥 FIXED: Direct allow print paths on mobile browser redirects to bypass strict structural array blockers
  if (location.pathname.startsWith("/print/")) {
    return (
      <AppErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
          <YnAiAssistant />
        </Suspense>
      </AppErrorBoundary>
    );
  }

  // Role-based route guards
  const userData = localStorage.getItem("user");
  const userRole = userData ? JSON.parse(userData)?.role : null;
  const adminRoutes = ["/dashboard", "/tenants", "/students", "/teachers", "/fees", "/exams", "/settings", "/classes", "/subjects", "/academic-years", "/attendance", "/reports", "/library", "/transport", "/backup", "/subscriptions", "/hostel", "/hr", "/communication", "/certificates", "/inventory", "/admission", "/gate-pass", "/events", "/helpdesk", "/workflow", "/form-builder", "/report-builder", "/audit", "/scheduler", "/dashboard-builder", "/qr-barcode", "/payment-gateway", "/file-manager", "/notifications", "/import-export", "/queue-monitor", "/digital-signature", "/languages", "/ai-assistant", "/masters"];
  const isAdminRoute = adminRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + "/"));

  if (userRole === "STUDENT" && isAdminRoute) {
    return <Navigate to="/student-portal" replace />;
  }
  if (userRole === "TEACHER" && isAdminRoute) {
    return <Navigate to="/teacher-portal" replace />;
  }
  if (userRole === "PRINCIPAL" && isAdminRoute) {
    return <Navigate to="/principal-portal" replace />;
  }

  return (
    <AppErrorBoundary>
      <Outlet />
      <YnAiAssistant />
    </AppErrorBoundary>
  );
}

//////////////////////////////////////////////////////
// Layout (with Sidebar + TopNavbar + Suspense)
//////////////////////////////////////////////////////
function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const [tenant, setTenant] = useState<any>(() => {
    const saved = localStorage.getItem("tenant");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("tenant");
      if (saved) {
        setTenant(JSON.parse(saved));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("themeColor");
    if (savedTheme) {
      document.documentElement.style.setProperty("--primary-color", savedTheme);
    }

    // Initialize dark mode from localStorage
    const savedDarkMode = localStorage.getItem("theme");
    if (savedDarkMode === "dark") {
      document.documentElement.classList.add("dark");
    } else if (savedDarkMode === "light") {
      document.documentElement.classList.remove("dark");
    }

    const fetchBranding = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const url =
          user?.role === "SUPER_ADMIN"
            ? "/api/super-admin/settings"
            : "/api/settings";

        const res = await axios.get(url);
        const data = res.data?.data;
        const color = data?.platform?.primaryColor || data?.tenant?.primaryColor;
        if (color) {
          document.documentElement.style.setProperty("--primary-color", color);
          localStorage.setItem("themeColor", color);
        }
      } catch (err) {
        console.error("Branding fetch error", err);
      }
    };
    fetchBranding();
  }, []);

  return (
    <div className="flex min-h-screen min-h-[100dvh] relative bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Sidebar Backdrop (mobile only) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[999] md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        tenant={tenant} 
        sidebarOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 main-content-wrapper md:ml-[260px] transition-all duration-300 bg-slate-50 dark:bg-slate-950 min-h-screen">
        {/* Hamburger (mobile only) */}
        <button
          className={`hamburger-btn fixed top-3 left-3 z-[9999] p-2.5 bg-primary-600 text-white rounded-xl shadow-lg md:hidden tap-target active:scale-95 transition-all duration-300 ${sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <TopNavbar tenant={tenant} />

        <main className="flex-1 p-2 md:p-3 overflow-auto" role="main">
          <AppErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <div className="page-container">
                <Outlet context={{ setTenant }} />
              </div>
            </Suspense>
          </AppErrorBoundary>
        </main>
      </div>
    </div>
  );
}

//////////////////////////////////////////////////////
// Role Dashboard
//////////////////////////////////////////////////////
function RoleDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user?.role === "SUPER_ADMIN") return <SuperAdminDashboard />;
  if (user?.role === "STUDENT") return <Navigate to="/student-portal" />;
  if (user?.role === "TEACHER") return <Navigate to="/teacher-portal" />;
  if (user?.role === "PRINCIPAL") return <Navigate to="/principal-portal" />;
  return <TenantDashboard />;
}

//////////////////////////////////////////////////////
// Role-based Settings
//////////////////////////////////////////////////////
function RoleSettings() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user?.role === "SUPER_ADMIN" ? <SuperAdminSettings /> : <SettingsPage />;
}

//////////////////////////////////////////////////////
// App
//////////////////////////////////////////////////////
export default function App() {
  // Clear chunk reload flag on successful app mount
  sessionStorage.removeItem("chunk_reload");
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ===== PUBLIC ROUTES ===== */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register-school" element={<RegisterSchool />} />

          {/* ===== PROTECTED ROUTES ===== */}
          <Route element={<ProtectedRoute />}>

            {/* 🔥 SUBSCRIPTION EXPIRED PAGE (No Sidebar/Navbar) */}
            <Route path="/subscription-expired" element={<SubscriptionExpired />} />

            {/* ━━━ PRINT ROUTES — No Sidebar, No Navbar ━━━ */}
            <Route path="/print/report-card/:examId/bulk" element={<BulkReportCard />} />
            <Route path="/print/report-card/:examId/:studentId" element={<ReportCard />} />
            <Route path="/print/consolidated/:studentId" element={<ConsolidatedReportCard />} />

            {/* ━━━ PORTALS ━━━ */}
            <Route path="/student-portal" element={<StudentDashboard />} />
            <Route path="/teacher-portal" element={<TeacherPortal />} />
            <Route path="/principal-portal" element={<PrincipalPortal />} />

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* NORMAL ROUTES — With Sidebar + Navbar              */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <Route element={<Layout />}>
              {/* DASHBOARD */}
              <Route path="/dashboard" element={<RoleDashboard />} />

              {/* TENANTS (SuperAdmin only) */}
              <Route path="/tenants" element={<TenantsPage />} />

              {/* SUBSCRIPTIONS */}
              <Route path="/subscriptions" element={<SubscriptionsPage />} />

              {/* REPORTS */}
              <Route path="/student-profile" element={<StudentProfilePage />} />
              <Route path="/certificates" element={<CertificateGenerator />} />
              <Route path="/reports" element={<ReportsPage />} />

              {/* LIBRARY */}
              <Route path="/library" element={<LibraryDashboard />} />

              {/* SETTINGS */}
              <Route path="/settings" element={<RoleSettings />} />
              <Route path="/settings/users" element={<TenantAdminSettings />} />
              <Route path="/settings/theme" element={<ThemePage />} />
              <Route path="/settings/subscription" element={<SubscriptionSettings />} />

              {/* SIGNATURE MASTER */}
              <Route path="/signature-master" element={<SignatureMaster />} />

              {/* ATTENDANCE */}
              <Route path="/attendance-dashboard" element={<AttendanceDashboardPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/attendance-report" element={<AttendanceReportPage />} />

              {/* STUDENT MODULE */}
              <Route path="/student-dashboard" element={<AdminStudentDashboard />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/new-admission" element={<AdmissionForm />} />
              <Route path="/students/old-entry" element={<OldStudentEntry />} />
              <Route path="/students/promotion" element={<PromotionPage />} />
              <Route path="/students/age-settings" element={<AgeSettings />} />
              <Route path="/students/print" element={<PrintStudents />} />
              <Route path="/students/recycle-bin" element={<RecycleBinPage />} />
              <Route path="/students/:id/edit" element={<EditStudentPage />} />
              <Route path="/students/reports" element={<StudentReportsPage />} />
              <Route path="/students/id-card" element={<StudentIdCardPage />} />

              {/* ACADEMIC */}
              <Route path="/academic-years" element={<AcademicYearPage />} />
              <Route path="/classes" element={<ClassesPage />} />
              <Route path="/Sections" element={<Sections />} />
              <Route path="/subjects" element={<SubjectsPage />} />

              {/* TEACHER MODULE */}
              <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/teachers/add" element={<AddEditTeacher />} />
              <Route path="/teachers/edit/:id" element={<AddEditTeacher />} />
              <Route path="/teachers/profile/:id" element={<TeacherProfile />} />
              <Route path="/assign-subject" element={<AssignSubjectToTeacher />} />
              <Route path="/teacher-timetable" element={<TeacherTimetable />} />
              <Route path="/teacher-attendance" element={<TeacherAttendance />} />
              <Route path="/teacher-leave" element={<LeaveManagement />} />
              <Route path="/teacher-salary" element={<TeacherSalary />} />
              <Route path="/teacher-performance" element={<TeacherPerformance />} />
              <Route path="/teacher-documents" element={<TeacherDocuments />} />
              <Route path="/teacher-communication" element={<Communication />} />
              <Route path="/teacher-reports" element={<TeacherReports />} />
              <Route path="/teacher-settings" element={<TeacherSettings />} />
              <Route path="/teacher-id-card" element={<TeacherIdCard />} />

              <Route path="/timeTable" element={<TimetablePage />} />
              <Route path="/transport" element={<TransportDashboard />} />
              <Route path="/transport/tracking" element={<TransportTracking />} />

              {/* FEES MODULE */}
              <Route path="/fees" element={<FeeCollectionPage />} />
              <Route path="/fees/dashboard" element={<FeeDashboardPage />} />
              <Route path="/fees/collection" element={<FeeCollectionPage />} />
              <Route path="/fees/heads" element={<FeeHeadPage />} />
              <Route path="/fees/structures" element={<FeeStructurePage />} />
              <Route path="/fees/assign" element={<AssignFeeStructurePage />} />
              <Route path="/fees/discounts" element={<FeeDiscountPage />} />
              <Route path="/fees/fine-rules" element={<FineRulePage />} />
              <Route path="/fees/reports" element={<FeeReportsPage />} />
              <Route path="/fees/receipts" element={<FeeReceiptsPage />} />
              <Route path="/fees/due" element={<DueFeesPage />} />
              <Route path="/fees/ledger" element={<StudentLedgerPage />} />
              <Route path="/fees/reminders" element={<FeeReminderPage />} />
              <Route path="/fees/settings" element={<FeeSettingsPage />} />

              {/* EXAM MODULE */}
              <Route path="/grade-settings" element={<GradeSettings />} />
              <Route path="/exams/consolidated-report/:studentId" element={<ConsolidatedReportCard />} />
              <Route path="/exams/create" element={<CreateEditExam />} />
              <Route path="/exams/edit/:id" element={<CreateEditExam />} />
              <Route path="/exams/:id/subjects" element={<ExamSubjects />} />
              <Route path="/exams/:id/marks" element={<MarksEntry />} />
              <Route path="/exams/:id/results" element={<Results />} />
              <Route path="/exams/:examId/report-card/:studentId" element={<ReportCard />} />
              <Route path="/exams" element={<ExamList />} />
              <Route path="/exam-dashboard" element={<ExamDashboard />} />
              <Route path="/exam-schedule/:id" element={<ExamSchedule />} />
              <Route path="/exam-seating/:id" element={<SeatingArrangement />} />
              <Route path="/exam-admit-cards/:id" element={<AdmitCard />} />
              <Route path="/exam-seating-plan" element={<SeatingArrangementPage />} />
              <Route path="/exam-admit-card" element={<AdmitCardPage />} />
              <Route path="/rooms" element={<RoomManagement />} />
              <Route path="/exam-question-papers/:id" element={<QuestionPaper />} />
              <Route path="/exam-invigilators/:id" element={<InvigilatorAssignment />} />
              <Route path="/exam-reports" element={<ExamReports />} />
              <Route path="/report-card-select" element={<ReportCardSelect />} />

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {/* NEW MODULE ROUTES                                  */}
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

              {/* HOSTEL MODULE */}
              <Route path="/hostel" element={<RoomAllocation />} />
              <Route path="/hostel/rooms" element={<RoomAllocation />} />
              <Route path="/hostel/fees" element={<HostelFees />} />
              <Route path="/hostel/mess" element={<MessManage />} />

              {/* HR MODULE */}
              <Route path="/hr" element={<StaffList />} />
              <Route path="/hr/staff" element={<StaffList />} />
              <Route path="/hr/payroll" element={<Payroll />} />
              <Route path="/hr/leave" element={<LeaveManage />} />
              <Route path="/hr/attendance" element={<StaffAttendance />} />

              {/* COMMUNICATION MODULE */}
              <Route path="/communication/notices" element={<NoticeBoard />} />
              <Route path="/communication/sms" element={<SMSSend />} />
              <Route path="/communication/whatsapp" element={<WhatsAppSend />} />
              <Route path="/communication/circular" element={<CircularCreate />} />

              {/* CERTIFICATES MODULE */}
              <Route path="/certificates/tc" element={<TCGenerate />} />
              <Route path="/certificates/character" element={<CharacterCert />} />
              <Route path="/certificates/migration" element={<MigrationCert />} />

              {/* INVENTORY MODULE */}
              <Route path="/inventory" element={<AssetList />} />
              <Route path="/inventory/assets" element={<AssetList />} />
              <Route path="/inventory/issue" element={<AssetIssue />} />
              <Route path="/inventory/stock" element={<StockManage />} />

              {/* ADMISSION MODULE */}
              <Route path="/admission" element={<AdmissionList />} />
              <Route path="/admission/new" element={<NewAdmission />} />
              <Route path="/admission/:id" element={<AdmissionDetail />} />

              {/* DESIGNER */}
              <Route path="/designer/:type" element={<DesignerPage />} />

              {/* YN-UDP Template Designer */}
              <Route path="/yn-udp" element={<YnUdpPage />} />

              <Route path="/analytics" element={<AnalyticsPage />} />

              {/* BACKUP */}
              <Route path="/backup" element={<BackupPage />} />

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {/* ENTERPRISE MODULES                                  */}
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

              {/* GATE PASS */}
              <Route path="/gate-pass" element={<GatePassDashboard />} />

              {/* EVENTS */}
              <Route path="/events" element={<EventDashboard />} />

              {/* HELP DESK */}
              <Route path="/helpdesk" element={<HelpDeskDashboard />} />

              {/* FOUNDATION ENGINES */}
              <Route path="/workflow" element={<WorkflowEngine />} />
              <Route path="/form-builder" element={<FormBuilder />} />
              <Route path="/report-builder" element={<ReportBuilder />} />
              <Route path="/audit" element={<AuditDashboard />} />
              <Route path="/scheduler" element={<SchedulerDashboard />} />
              <Route path="/dashboard-builder" element={<DashboardBuilder />} />

              {/* ENTERPRISE FEATURES */}
              <Route path="/qr-barcode" element={<QRManager />} />
              <Route path="/payment-gateway" element={<PaymentGateway />} />
              <Route path="/file-manager" element={<FileManager />} />
              <Route path="/notifications" element={<NotificationCenter />} />
              <Route path="/import-export" element={<ImportExport />} />
              <Route path="/queue-monitor" element={<QueueMonitor />} />
              <Route path="/digital-signature" element={<DigitalSignature />} />
              <Route path="/languages" element={<LanguageManager />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />

              {/* MASTER MODULE */}
              <Route path="/masters" element={<MasterModule />} />
              <Route path="/masters/:category" element={<MasterModule />} />
              <Route path="/masters/:category/:model" element={<MasterModule />} />

            </Route>
          </Route>

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
////////////MasterModule.tsx/////// ═══════════════════════════════════════════════════════════════════
// MASTER MODULE - Dashboard Style Grid Navigation (FULLY RESPONSIVE)
// Flat Categories -> Child Grid Layout -> Data Matrix
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  Building2, GraduationCap, Users, UserCog, IndianRupee,
  ClipboardList, CalendarCheck, BookOpen, BedDouble, Bus,
  Package, Briefcase, MessageSquare, Award, Shield,
  FileCheck, CalendarHeart, UserRound, Brain, Settings,
  Search, Plus, Download, Upload, RefreshCw, Filter, Database, ArrowLeft, Grid
} from "lucide-react";
import MasterTable from "./MasterTable";
import MasterForm from "./MasterForm";

// Dashboard-style dynamic background color generator map matrix
const RECENT_COLORS = [
  "bg-blue-600/10 text-blue-500 dark:bg-blue-500/20 border-blue-500/30",
  "bg-emerald-600/10 text-emerald-500 dark:bg-emerald-500/20 border-emerald-500/30",
  "bg-teal-600/10 text-teal-500 dark:bg-teal-500/20 border-teal-500/30",
  "bg-rose-600/10 text-rose-500 dark:bg-rose-500/20 border-rose-500/30",
  "bg-indigo-600/10 text-indigo-500 dark:bg-indigo-500/20 border-indigo-500/30",
  "bg-purple-600/10 text-purple-500 dark:bg-purple-500/20 border-purple-500/30",
  "bg-amber-600/10 text-amber-500 dark:bg-amber-500/20 border-amber-500/30",
  "bg-cyan-600/10 text-cyan-500 dark:bg-cyan-500/20 border-cyan-500/30",
];

const CATEGORY_ICONS: Record<string, any> = {
  Building2, GraduationCap, Users, UserCog, IndianRupee,
  ClipboardList, CalendarCheck, BookOpen, BedDouble, Bus,
  Package, Briefcase, MessageSquare, Award, Shield,
  FileCheck, CalendarHeart, UserRound, Brain, Settings,
};

function getCategoryIcon(iconName: string, size = 22) {
  const Icon = CATEGORY_ICONS[iconName];
  return Icon ? <Icon size={size} /> : <Database size={size} />;
}

interface MasterModel {
  key: string;
  label: string;
  icon?: string;
  description?: string;
}

interface MasterCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  modelCount: number;
  models: MasterModel[];
}

interface FieldConfig {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function MasterModule() {
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MasterCategory | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedModelLabel, setSelectedModelLabel] = useState<string>("");

  // Workflow State Control: 'categories' | 'child_grid' | 'table_view'
  const [currentView, setCurrentView] = useState<"categories" | "child_grid" | "table_view">("categories");

  const [entries, setEntries] = useState<any[]>([]);
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1, limit: 25, total: 0, totalPages: 0, hasNext: false, hasPrev: false,
  });

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/masters/categories"));
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load master categories:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchEntries = useCallback(async (modelKey: string, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        search,
        showInactive: showInactive.toString(),
      });
      const res = await axios.get(getFullUrl(`/api/masters/${modelKey}?${params}`));
      if (res.data.success) {
        setEntries(res.data.data);
        setPagination(res.data.pagination);
        if (res.data.config?.fields) {
          setFields(res.data.config.fields);
        }
      }
    } catch (err) {
      console.error("Failed to load entries:", err);
    } finally {
      setLoading(false);
    }
  }, [search, showInactive]);

  useEffect(() => {
    if (selectedModel) {
      fetchEntries(selectedModel);
    }
  }, [selectedModel, search, showInactive, fetchEntries]);

  const handleCategoryClick = (category: MasterCategory) => {
    setSelectedCategory(category);
    setCurrentView("child_grid");
  };

  const handleModelClick = (model: MasterModel) => {
    setSelectedModel(model.key);
    setSelectedModelLabel(model.label);
    setSearch("");
    setPagination({ page: 1, limit: 25, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
    setCurrentView("table_view");
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedModel(null);
    setCurrentView("categories");
  };

  const handleBackToChildGrid = () => {
    setSelectedModel(null);
    setCurrentView("child_grid");
  };

  const handleCreate = () => {
    setEditingEntry(null);
    setShowForm(true);
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!selectedModel) return;
    if (!window.confirm("Are you sure you want to deactivate this entry?")) return;
    try {
      await axios.delete(getFullUrl(`/api/masters/${selectedModel}/${id}`));
      fetchEntries(selectedModel, pagination.page);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleToggle = async (id: string) => {
    if (!selectedModel) return;
    try {
      await axios.put(getFullUrl(`/api/masters/${selectedModel}/${id}/toggle`));
      fetchEntries(selectedModel, pagination.page);
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const handleClone = async (id: string) => {
    if (!selectedModel) return;
    try {
      await axios.post(getFullUrl(`/api/masters/${selectedModel}/${id}/clone`));
      fetchEntries(selectedModel, pagination.page);
    } catch (err) {
      console.error("Clone failed:", err);
    }
  };

  const handleExport = async () => {
    if (!selectedModel) return;
    try {
      const res = await axios.get(getFullUrl(`/api/masters/${selectedModel}/export`));
      if (res.data.success) {
        const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedModel}-export.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (!selectedModel) return;
    setFormLoading(true);
    try {
      if (editingEntry) {
        await axios.put(getFullUrl(`/api/masters/${selectedModel}/${editingEntry.id}`), data);
      } else {
        await axios.post(getFullUrl(`/api/masters/${selectedModel}`), data);
      }
      setShowForm(false);
      setEditingEntry(null);
      fetchEntries(selectedModel, pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.message || "Operation failed");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-slate-950 text-slate-100 overflow-y-auto p-4 md:p-6 [scrollbar-gutter:stable]">
      
      {/* ═══════ VIEW 1: CATEGORIES GRID (Dashboard Layout Like Image 1000412908.jpg) ═══════ */}
      {currentView === "categories" && (
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
          <div className="border-b border-slate-800 pb-4">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Grid className="text-indigo-500" size={24} />
              Master Control Setup
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select any architecture base matrix block to handle child structural models
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.map((category, index) => {
              const colorClass = RECENT_COLORS[index % RECENT_COLORS.length];
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className="flex flex-col items-center justify-center text-center p-4 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 transition-all group shadow-md relative outline-none active:scale-95 cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-3 transition-transform group-hover:scale-105 shadow-inner ${colorClass}`}>
                    {getCategoryIcon(category.icon, 24)}
                  </div>
                  <span className="text-xs md:text-sm font-medium tracking-wide block line-clamp-2 px-1 text-slate-200 group-hover:text-white">
                    {category.label}
                  </span>
                  <span className="absolute top-2 right-2 bg-slate-800 text-[10px] text-slate-400 font-semibold px-1.5 py-0.5 rounded-md border border-slate-700/50">
                    {category.modelCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════ VIEW 2: CHILD MASTERS HORIZONTAL ICON GRID (With Back Button) ═══════ */}
      {currentView === "child_grid" && selectedCategory && (
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
          {/* Header Action Row with Navigation Context */}
          <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
            <button
              onClick={handleBackToCategories}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              title="Back to Main Menu"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-indigo-400">{getCategoryIcon(selectedCategory.icon, 20)}</span>
                <h1 className="text-lg md:text-xl font-bold text-white">{selectedCategory.label}</h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Select a master target collection mapping below</p>
            </div>
          </div>

          {/* Child Icons layout rendering logic */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {selectedCategory.models.map((model) => (
              <button
                key={model.key}
                onClick={() => handleModelClick(model)}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-indigo-500/10 bg-indigo-950/10 hover:bg-indigo-950/20 hover:border-indigo-500/30 text-center transition-all outline-none active:scale-95 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-2.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Database size={18} />
                </div>
                <span className="text-xs md:text-sm font-medium text-slate-300 group-hover:text-white">
                  {model.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ VIEW 3: FULL MASTER DATA TABLE CONTAINER ═══════ */}
      {currentView === "table_view" && selectedModel && (
        <div className="max-w-7xl mx-auto space-y-4 animate-fadeIn flex flex-col h-full">
          {/* Header Controls Menu Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToChildGrid}
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition-colors cursor-pointer"
                  title="Back to Models"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="text-base md:text-lg font-bold text-white truncate max-w-[240px]">
                    {selectedModelLabel}
                  </h1>
                  <p className="text-xs text-slate-400">
                    {pagination.total} entries found inside dataset matrix
                  </p>
                </div>
              </div>

              {/* Dynamic Operations Toolbar Wrap */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[130px] sm:flex-initial">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filter records..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-1.5 w-full sm:w-44 border border-slate-800 rounded-lg text-xs bg-slate-950 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <button
                  onClick={() => setShowInactive(!showInactive)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs border flex items-center gap-1 transition-colors cursor-pointer ${
                    showInactive
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                      : "border-slate-800 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Filter size={12} />
                  {showInactive ? "All" : "Active"}
                </button>

                <button
                  onClick={handleExport}
                  className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-800 text-slate-400 hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Download size={12} /> Export
                </button>

                <button
                  onClick={() => setShowImport(true)}
                  className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-800 text-slate-400 hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Upload size={12} /> Import
                </button>

                <button
                  onClick={handleCreate}
                  className="px-3 py-1.5 rounded-lg text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1 shadow-sm cursor-pointer ml-auto sm:ml-0 font-medium"
                >
                  <Plus size={14} /> Add New
                </button>
              </div>
            </div>
          </div>

          {/* Table Implementation Engine Panel Wrap */}
          <div className="flex-1 overflow-x-auto">
            <MasterTable
              entries={entries}
              fields={fields}
              loading={loading}
              pagination={pagination}
              onPageChange={(p) => fetchEntries(selectedModel, p)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onClone={handleClone}
            />
          </div>
        </div>
      )}

      {/* Dynamic Structural Operational Modals */}
      {showForm && (
        <MasterForm
          fields={fields}
          initialData={editingEntry}
          onSubmit={handleFormSubmit}
          onClose={() => { setShowForm(false); setEditingEntry(null); }}
          loading={formLoading}
          title={editingEntry ? `Edit ${selectedModelLabel}` : `Add ${selectedModelLabel}`}
        />
      )}

      {showImport && (
        <ImportModal
          modelKey={selectedModel!}
          modelLabel={selectedModelLabel}
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            if (selectedModel) fetchEntries(selectedModel);
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// IMPORT MODAL COMPONENT (Tailored UI styling alignment maps)
// ═══════════════════════════════════════════════════════════════════
function ImportModal({
  modelKey, modelLabel, onClose, onSuccess,
}: {
  modelKey: string;
  modelLabel: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [jsonData, setJsonData] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const data = JSON.parse(text);
        setJsonData(JSON.stringify(data, null, 2));
      } catch {
        setJsonData(text);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      let entries;
      try {
        entries = JSON.parse(jsonData);
        if (!Array.isArray(entries)) entries = [entries];
      } catch {
        const lines = jsonData.trim().split("\n");
        const headers = lines[0].split(",").map(h => h.trim());
        entries = lines.slice(1).map(line => {
          const values = line.split(",").map(v => v.trim());
          const obj: any = {};
          headers.forEach((h, i) => { obj[h] = values[i]; });
          return obj;
        });
      }

      const res = await axios.post(getFullUrl(`/api/masters/${modelKey}/bulk`), { entries });
      setResult(res.data.data);
      if (res.data.data.failed === 0) {
        setTimeout(onSuccess, 1000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Sync execution error caught");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex-shrink-0 flex items-center justify-between">
          <h3 className="text-sm md:text-base font-semibold flex items-center gap-2">
            <Upload size={16} className="text-indigo-400" />
            Bulk Import: {modelLabel}
          </h3>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4 [scrollbar-gutter:stable]">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Select local file target sheet (JSON, CSV)
            </label>
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-700 file:text-xs file:font-medium file:bg-slate-800 file:text-slate-200 file:hover:bg-slate-700 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Raw Data Array String Area
            </label>
            <textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              rows={5}
              className="w-full p-2.5 border border-slate-800 rounded-lg text-xs font-mono bg-slate-950 text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder={`[\n  { "code": "X1", "name": "Direct Row Sync" }\n]`}
            />
          </div>

          {result && (
            <div className={`p-3 rounded-lg border text-xs ${result.failed > 0 ? "bg-amber-950/40 border-amber-500/30 text-amber-300" : "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"}`}>
              <p className="font-semibold">Execution Statistics:</p>
              <p className="mt-0.5">Success counts: {result.success} | Structural failures: {result.failed}</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-800 flex justify-end gap-2 bg-slate-950 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs border border-slate-800 text-slate-400 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!jsonData.trim() || importing}
            className="px-3.5 py-1.5 rounded-lg text-xs bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {importing ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
            Push Integration
          </button>
        </div>
      </div>
    </div>
  );
}