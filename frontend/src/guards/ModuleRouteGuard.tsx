import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useModules } from "../context/ModuleContext";
import { ShieldX } from "lucide-react";

/**
 * 🔒 Module Route Guard
 * 
 * Automatically checks if the current route's module is permitted.
 * Place this inside the main layout — it reads the current URL path
 * and maps it to a module slug.
 * 
 * If the module is blocked, shows an "Access Denied" page.
 * If allowed (or no module mapping for the route), renders children.
 */

// Map URL path prefixes → module slugs
const ROUTE_MODULE_MAP: Record<string, string> = {
  // STUDENTS
  "/students": "students",
  "/student-dashboard": "students",

  // TEACHERS
  "/teachers": "teachers",
  "/teacher-dashboard": "teachers",
  "/teacher-timetable": "teachers",
  "/teacher-attendance": "teachers",
  "/teacher-leave": "teachers",
  "/teacher-salary": "teachers",
  "/teacher-performance": "teachers",
  "/teacher-documents": "teachers",
  "/teacher-communication": "teachers",
  "/teacher-reports": "teachers",
  "/teacher-settings": "teachers",
  "/teacher-id-card": "teachers",
  "/assign-subject": "teachers",

  // ATTENDANCE
  "/attendance": "attendance",
  "/attendance-dashboard": "attendance",
  "/attendance-report": "attendance",

  // EXAMS
  "/exams": "exams",
  "/exam-dashboard": "exams",
  "/exam-schedule": "exams",
  "/exam-seating": "exams",
  "/exam-admit-card": "exams",
  "/exam-reports": "exams",
  "/exam-question-papers": "exams",
  "/exam-invigilators": "exams",
  "/exam-schedule-print": "exams",
  "/exam-seating-plan": "exams",
  "/grade-settings": "exams",
  "/rooms": "exams",

  // FEES
  "/fees": "fees",
  "/payment-gateway": "fees",

  // TIMETABLE
  "/timeTable": "timetable",

  // TRANSPORT
  "/transport": "transport",

  // LIBRARY
  "/library": "library",

  // HOSTEL
  "/hostel": "hostel",

  // HR
  "/hr": "hr",

  // INVENTORY
  "/inventory": "inventory",

  // GATE PASS
  "/gate-pass": "gate-pass",

  // COMMUNICATION
  "/communication": "communication",

  // EVENTS
  "/events": "events",

  // CERTIFICATES
  "/certificates": "certificates",

  // TOOLS
  "/workflow": "workflow",
  "/approvals": "workflow",
  "/form-builder": "form-builder",
  "/report-builder": "report-builder",
  "/import-export": "import-export",
  "/scheduler": "scheduler",

  // DESIGN
  "/yn-udp": "template-designer",
  "/dashboard-builder": "dashboard-builder",

  // DOCUMENTS
  "/file-manager": "file-manager",
  "/qr-barcode": "id-cards",

  // SUPPORT
  "/helpdesk": "helpdesk",
};

/**
 * Given a pathname, find the matching module slug.
 * Tries exact match first, then prefix match (longest first).
 */
function getModuleForPath(pathname: string): string | null {
  // Exact match
  if (ROUTE_MODULE_MAP[pathname]) return ROUTE_MODULE_MAP[pathname];

  // Prefix match — sort by length descending so longer prefixes match first
  const sortedPrefixes = Object.keys(ROUTE_MODULE_MAP).sort((a, b) => b.length - a.length);
  for (const prefix of sortedPrefixes) {
    if (pathname.startsWith(prefix + "/") || pathname === prefix) {
      return ROUTE_MODULE_MAP[prefix];
    }
  }

  return null; // No module mapping — allow access (core routes like /dashboard, /settings)
}

interface ModuleRouteGuardProps {
  children: ReactNode;
}

export default function ModuleRouteGuard({ children }: ModuleRouteGuardProps) {
  const location = useLocation();
  const { isModuleAllowed, mode } = useModules();

  // While loading module permissions, show loader
  if (mode === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const requiredModule = getModuleForPath(location.pathname);

  // No module mapping for this route — it's a core/system route, allow access
  if (!requiredModule) {
    return <>{children}</>;
  }

  // Module is allowed
  if (isModuleAllowed(requiredModule)) {
    return <>{children}</>;
  }

  // Module is blocked — show access denied
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-800/50 p-8 max-w-md w-full text-center shadow-lg">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <ShieldX size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          Module Not Available
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
          The <span className="font-semibold text-red-500 capitalize">{requiredModule.replace(/-/g, " ")}</span> module
          is not enabled for your institution. Please contact your administrator to
          request access.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
