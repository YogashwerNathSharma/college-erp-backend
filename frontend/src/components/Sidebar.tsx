// ═══════════════════════════════════════════════════════════════════
// SIDEBAR COMPONENT - FIXED ROUTING MATRIX
// ═══════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { getFullUrl } from "../utils/url";

import {
  LayoutDashboard, Users, UserPlus, UserCog, School, BookOpen,
  ClipboardCheck, FileText, IndianRupee, Bus, Library, BarChart3,
  Settings, Building2, CreditCard, Calendar, Layers, IdCard,
  FileClockIcon, ChevronRight, ChevronDown, Bell, BookOpenCheck,
  PieChart, UserCheck, GraduationCap, CalendarClock, Grid3X3,
  Star, FolderOpen, MessageSquare, Clock, Wallet, ClipboardEdit,
  PenTool, Database, Palette, Brush, X, Award, Package, BedDouble,
  Send, MapPin, LogOut, ChevronLeft, DoorOpen, CalendarDays,
  HelpCircle, FileArchive, ShieldCheck, Activity, Ticket
} from "lucide-react";

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
        path: "/masters" // 🔥 Direct base router targeting
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
          { name: "User Management", path: "/settings/users", icon: <UserPlus size={16} /> },
          { name: "Theme", path: "/settings/theme", icon: <Palette size={16} /> },
        ],
      },
    ],
  },
];

type SidebarProps = { tenant?: any; sidebarOpen?: boolean; onClose?: () => void; };

export default function Sidebar({ tenant, sidebarOpen = false, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const localTenant = JSON.parse(localStorage.getItem("tenant") || "{}");
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const safeTenant = tenant || localTenant || {};
  const sidebarTitle = isSuperAdmin ? "Super Admin" : safeTenant?.name || "School Name";
  const menu = isSuperAdmin ? [
    {
      section: "SaaS Control",
      items: [
        { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
        { name: "Tenants", icon: <Building2 size={20} />, path: "/tenants" },
        { name: "Subscriptions", icon: <CreditCard size={20} />, path: "/subscriptions" },
        { name: "Settings", icon: <Settings size={20} />, path: "/settings" },
      ]
    }
  ] : tenantMenu;

  // Sync open structural state accordion logic based on route mapping matrices
  useEffect(() => {
    menu.forEach(group => {
      group.items.forEach(item => {
        if (item.children?.some(c => location.pathname.startsWith(c.path))) {
          setOpenMenus(prev => ({ ...prev, [item.name]: true }));
        }
      });
    });
  }, [location.pathname]);

  const toggleSubMenu = (name: string) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col print:hidden w-[260px] transition-transform duration-300 border-r border-white/10 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
      style={{ background: "linear-gradient(180deg, #1e2a4a 0%, #152038 50%, #0f1729 100%)" }}
    >
      <div className="relative flex-shrink-0 border-b border-white/10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-base border border-amber-400/30 flex-shrink-0">
            {sidebarTitle.charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-bold text-white leading-tight truncate">{sidebarTitle}</h1>
            <p className="text-[10px] text-amber-400/70 truncate">Institution Control</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-white/5 text-slate-400 md:hidden cursor-pointer">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 sidebar-scroll">
        <style>{`.sidebar-scroll::-webkit-scrollbar { width: 0px; }`}</style>
        {menu.map((group, gi) => (
          <div key={gi} className="space-y-1">
            {group.section && (
              <p className="text-[9px] text-slate-500 font-bold tracking-wider uppercase px-3 pt-2 select-none">
                {group.section}
              </p>
            )}
            
            {group.items.map((item, i) => {
              const hasChildren = !!item.children;
              const isOpen = !!openMenus[item.name];
              const isActive = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path || ""));

              if (!hasChildren) {
                return (
                  <NavLink
                    key={i}
                    to={item.path!}
                    onClick={onClose}
                    className={() =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive 
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30" 
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </NavLink>
                );
              }

              return (
                <div key={i} className="space-y-1">
                  <button
                    onClick={() => toggleSubMenu(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-slate-400 hover:bg-white/5 hover:text-slate-200 cursor-pointer ${
                      isActive ? "text-indigo-400 bg-white/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {isOpen && (
                    <div className="pl-6 pr-2 py-1 space-y-1 bg-black/10 rounded-xl">
                      {item.children?.map((child, ci) => {
                        const isChildActive = location.pathname.startsWith(child.path);
                        return (
                          <NavLink
                            key={ci}
                            to={child.path}
                            onClick={onClose}
                            className={() =>
                              `flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] transition-all ${
                                isChildActive ? "text-indigo-400 font-medium bg-white/5" : "text-slate-400 hover:text-slate-200"
                              }`
                            }
                          >
                            {child.icon}
                            <span>{child.name}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
