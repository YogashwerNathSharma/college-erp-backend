// ═══════════════════════════════════════════════════════════════════
// SIDEBAR COMPONENT - STANDARD CLEAN INTEGRATION WITH BACK NAVIGATION
// ═══════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
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
        path: "/masters" 
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
        ],
      },
      {
        name: "Teachers",
        icon: <UserCog size={20} />,
        children: [
          { name: "Dashboard", icon: <LayoutDashboard size={16} />, path: "/teacher-dashboard" },
          { name: "All Teachers", icon: <UserCog size={16} />, path: "/teachers" },
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
  const menu = isSuperAdmin ? [] : tenantMenu;

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
        <div className="flex items-center gap-2 min-w-0">
          {location.pathname.startsWith("/masters") && (
            <button
              onClick={() => navigate("/dashboard")}
              className="p-1 rounded-md bg-white/5 text-amber-400 border border-amber-400/20 mr-1 hover:bg-white/10 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
          )}
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
              const isMastersActive = item.name === "Masters" && location.pathname.startsWith("/masters");
              const isActive = isMastersActive || location.pathname === item.path;

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
