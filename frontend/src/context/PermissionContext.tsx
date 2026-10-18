import { createContext, useContext, useMemo, ReactNode } from "react";

//////////////////////////////////////////////////////
// 🛡️ PERMISSION CONTEXT
//////////////////////////////////////////////////////

interface PermissionContextType {
  permissions: string[];
  hasPermission: (perm: string) => boolean;
  hasAnyPermission: (perms: string[]) => boolean;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  TENANT_ADMIN: ["*"],
  PRINCIPAL: ["student:view", "teacher:view", "fee:view", "fee:reports", "exam:view", "exam:publish", "attendance:view", "notice:view", "notice:create", "hr:view", "reports:view", "reports:export"],
  TEACHER: ["student:view", "exam:view", "exam:marks", "attendance:view", "attendance:mark", "notice:view"],
  STUDENT: ["notice:view"],
};

export function PermissionProvider({ children, role }: { children: ReactNode; role: string }) {
  const permissions = useMemo(() => ROLE_PERMISSIONS[role] || [], [role]);

  const hasPermission = (perm: string): boolean => {
    if (permissions.includes("*")) return true;
    return permissions.includes(perm);
  };

  const hasAnyPermission = (perms: string[]): boolean => {
    if (permissions.includes("*")) return true;
    return perms.some((p) => permissions.includes(p));
  };

  return (
    <PermissionContext.Provider value={{ permissions, hasPermission, hasAnyPermission }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext() {
  const context = useContext(PermissionContext);
  if (!context) throw new Error("usePermissionContext must be used within PermissionProvider");
  return context;
}
