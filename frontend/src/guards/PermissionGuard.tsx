import { ReactNode } from "react";

//////////////////////////////////////////////////////
// 🛡️ PERMISSION GUARD
//////////////////////////////////////////////////////

interface PermissionGuardProps {
  children: ReactNode;
  permission: string | string[];
  fallback?: ReactNode;
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  TENANT_ADMIN: ["*"],
  PRINCIPAL: ["student:view", "teacher:view", "fee:view", "exam:view", "attendance:view", "notice:view", "notice:create", "reports:view"],
  TEACHER: ["student:view", "exam:view", "exam:marks", "attendance:view", "attendance:mark", "notice:view"],
  STUDENT: ["notice:view"],
};

export default function PermissionGuard({ children, permission, fallback = null }: PermissionGuardProps) {
  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;
  const userPermissions = ROLE_PERMISSIONS[user?.role] || [];

  const requiredPerms = Array.isArray(permission) ? permission : [permission];

  const hasAccess =
    userPermissions.includes("*") ||
    requiredPerms.some((p) => userPermissions.includes(p));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
