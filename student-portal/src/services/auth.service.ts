import axios from "axios";
import { API_URL } from "../config/api.config";

//////////////////////////////////////////////////////
// 🔐 AUTH SERVICE
//////////////////////////////////////////////////////

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    studentId: string;
    tenantId: string;
    photo?: string;
  };
}

export const authService = {
  /**
   * Login student
   */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const res = await axios.post(`${API_URL}/auth/login`, payload);
    const data = res.data.data || res.data;
    if (data.token) {
      localStorage.setItem("student_token", data.token);
      localStorage.setItem("student_user", JSON.stringify(data.user));
    }
    return data;
  },

  /**
   * Logout student
   */
  logout(): void {
    localStorage.removeItem("student_token");
    localStorage.removeItem("student_user");
  },

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem("student_token");
  },

  /**
   * Get stored user
   */
  getUser(): LoginResponse["user"] | null {
    const user = localStorage.getItem("student_user");
    return user ? JSON.parse(user) : null;
  },

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  /**
   * Get auth headers
   */
  getAuthHeaders() {
    return {
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
    };
  },
};
