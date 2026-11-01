import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useModules } from "../../context/ModuleContext";
import {
  LayoutDashboard,
  Users,
  IndianRupee,
  ClipboardCheck,
  Menu,
  X,
  UserCog,
  FileText,
  Bus,
  Library,
  Settings,
  BarChart3,
} from "lucide-react";

/**
 * 📱 Mobile Bottom Navigation
 *
 * Fixed bar at the bottom on screens < 768px.
 * Shows the 4 most-used nav items + "More" overflow drawer.
 * Respects module permissions — hidden items don't appear.
 * Hides on scroll-down, re-appears on scroll-up.
 * Only renders for ADMIN role (portals have their own nav).
 */

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  moduleSlug?: string;
}

const ALL_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Students", path: "/students", icon: Users, moduleSlug: "students" },
  { label: "Fees", path: "/fees/collection", icon: IndianRupee, moduleSlug: "fees" },
  { label: "Attendance", path: "/attendance", icon: ClipboardCheck, moduleSlug: "attendance" },
  { label: "Teachers", path: "/teachers", icon: UserCog, moduleSlug: "teachers" },
  { label: "Exams", path: "/exams", icon: FileText, moduleSlug: "exams" },
  { label: "Transport", path: "/transport", icon: Bus, moduleSlug: "transport" },
  { label: "Library", path: "/library", icon: Library, moduleSlug: "library" },
  { label: "Reports", path: "/reports", icon: BarChart3 },
  { label: "Settings", path: "/settings/subscription", icon: Settings },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { isModuleAllowed } = useModules();
  const [moreOpen, setMoreOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Only show for Admin on mobile
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  })();
  const isAdmin = user?.role === "ADMIN" || user?.role === "TENANT_ADMIN";

  // Filter by module permission
  const allowed = ALL_ITEMS.filter(
    (item) => !item.moduleSlug || isModuleAllowed(item.moduleSlug)
  );
  const primary = allowed.slice(0, 4);
  const overflow = allowed.slice(4);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      setVisible(currentY < lastScrollY.current || currentY < 60);
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close overflow on navigate
  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  if (!isAdmin) return null;

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <>
      {/* Overflow drawer */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[999] md:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-[60px] left-0 right-0 z-[1000] md:hidden animate-slide-up">
            <div className="mx-3 mb-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  More Modules
                </span>
                <button onClick={() => setMoreOpen(false)}>
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {overflow.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition ${
                        active
                          ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-[10px] font-medium leading-tight">
                        {item.label}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom bar */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-[998] md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 transition-transform duration-300 ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-around px-1 py-1.5">
          {primary.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center min-w-[48px] py-1 px-2 rounded-xl transition ${
                  active
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span
                  className={`text-[10px] mt-0.5 font-medium ${
                    active ? "font-bold" : ""
                  }`}
                >
                  {item.label}
                </span>
                {active && (
                  <span className="absolute -top-0.5 w-5 h-0.5 rounded-full bg-indigo-500" />
                )}
              </NavLink>
            );
          })}

          {/* More button */}
          {overflow.length > 0 && (
            <button
              onClick={() => setMoreOpen((o) => !o)}
              className={`flex flex-col items-center justify-center min-w-[48px] py-1 px-2 rounded-xl transition ${
                moreOpen
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              <Menu size={20} strokeWidth={moreOpen ? 2.5 : 1.8} />
              <span className="text-[10px] mt-0.5 font-medium">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* Spacer so content isn't hidden behind nav */}
      <div className="h-16 md:hidden" />

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slide-up { animation: slide-up .2s ease-out; }
      `}</style>
    </>
  );
}
