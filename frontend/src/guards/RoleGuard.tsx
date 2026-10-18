import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

//////////////////////////////////////////////////////
// 👤 ROLE GUARD
//////////////////////////////////////////////////////

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export default function RoleGuard({ children, allowedRoles, redirectTo = "/dashboard" }: RoleGuardProps) {
  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
