import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authService, LoginPayload } from "../services/auth.service";

//////////////////////////////////////////////////////
// 🔐 AUTH HOOK
//////////////////////////////////////////////////////

export function useAuth() {
  const [user, setUser] = useState(authService.getUser());
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = authService.getToken();
    const storedUser = authService.getUser();
    if (token && storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    try {
      const data = await authService.login(payload);
      setUser(data.user);
      setIsAuthenticated(true);
      navigate("/");
      return data;
    } catch (error: any) {
      throw error?.response?.data?.message || "Login failed";
    }
  }, [navigate]);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    navigate("/login");
  }, [navigate]);

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
  };
}
