import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";

//////////////////////////////////////////////////////
// 🔒 AUTH GUARD
//////////////////////////////////////////////////////

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
