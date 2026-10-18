import { useMemo } from "react";
import { useAuth } from "./useAuth";

//////////////////////////////////////////////////////
// 🛡️ PERMISSION HOOK
//////////////////////////////////////////////////////

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  TENANT_ADMIN: ["*"],
  PRINCIPAL: ["student:view", "teacher:view", "fee:view", "exam:view", "attendance:view", "notice:view", "notice:create", "reports:view"],
  TEACHER: ["student:view", "exam:view", "exam:marks", "attendance:view", "attendance:mark", "notice:view"],
  STUDENT: ["notice:view"],
};

export function usePermission() {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user?.role) return [];
    return ROLE_PERMISSIONS[user.role] || [];
  }, [user?.role]);

  const hasPermission = (permission: string): boolean => {
    if (permissions.includes("*")) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: string[]): boolean => {
    if (permissions.includes("*")) return true;
    return perms.some((p) => permissions.includes(p));
  };

  const hasAllPermissions = (perms: string[]): boolean => {
    if (permissions.includes("*")) return true;
    return perms.every((p) => permissions.includes(p));
  };

  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "TENANT_ADMIN";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  return { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, isSuperAdmin, permissions };
}
