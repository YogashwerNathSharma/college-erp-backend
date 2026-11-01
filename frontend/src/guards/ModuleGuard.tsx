import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useModules } from "../context/ModuleContext";
import { ShieldX } from "lucide-react";

/**
 * 🔒 Module Guard
 * 
 * Wraps a route element — if the module is not permitted for this tenant,
 * shows an "Access Denied" page instead of the actual content.
 * 
 * Usage in App.tsx:
 *   <Route path="/students" element={<ModuleGuard module="students"><StudentsPage /></ModuleGuard>} />
 *   
 * OR wrap a layout:
 *   <Route path="/fees/*" element={<ModuleGuard module="fees"><Outlet /></ModuleGuard>} />
 */

interface ModuleGuardProps {
  module: string;
  children: ReactNode;
  /** If true, redirects to /dashboard instead of showing block page */
  redirect?: boolean;
}

export default function ModuleGuard({ module, children, redirect = false }: ModuleGuardProps) {
  const { isModuleAllowed, mode } = useModules();

  // While loading, show nothing (avoid flash)
  if (mode === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Module is allowed — render children normally
  if (isModuleAllowed(module)) {
    return <>{children}</>;
  }

  // Module is blocked
  if (redirect) {
    return <Navigate to="/dashboard" replace />;
  }

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
          The <span className="font-semibold text-red-500">{module}</span> module 
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
