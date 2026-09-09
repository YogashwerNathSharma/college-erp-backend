import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { getFullUrl } from "../utils/url";

//////////////////////////////////////////////////////
// 🔐 AUTH CONTEXT
//////////////////////////////////////////////////////

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string | null;
  photo?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Tenant/session-scoped browser state must never survive a change of identity.
// In particular, dashboard_cache:<academicYearId> was previously shared by all tenants.
function clearTenantScopedBrowserState() {
  localStorage.removeItem("tenant");
  localStorage.removeItem("selectedAcademicYearId");
  localStorage.removeItem("academicYearExplicitSelection");

  // Remove all dashboard snapshots created by the old, non-tenant-scoped cache key.
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith("dashboard_cache:")) {
      localStorage.removeItem(key);
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await axios.post(getFullUrl("/api/auth/login"), { email, password });
      const { token: newToken, user: userData } = res.data.data;

      // IMPORTANT: do this before installing the new identity so a previous
      // tenant's cached dashboard/tenant/academic-year state cannot leak into it.
      clearTenantScopedBrowserState();

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearTenantScopedBrowserState();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    navigate("/");
  };

  const updateUser = (data: Partial<User>) => {
    const updated = { ...user, ...data } as User;
    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used within AuthProvider");
  return context;
}
