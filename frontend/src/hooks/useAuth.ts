import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

//////////////////////////////////////////////////////
// 🔐 AUTH HOOK
//////////////////////////////////////////////////////

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  photo?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const isAuthenticated = !!token && !!user;

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      const { token: newToken, user: userData } = res.data.data;
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tenant");
    setUser(null);
    navigate("/");
  }, [navigate]);

  return { user, token, isAuthenticated, loading, login, logout };
}
