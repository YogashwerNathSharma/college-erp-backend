import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getFullUrl } from "../../utils/url";

/**
 * ChangePassword — forced password change screen.
 * Shown after login when the backend returns forcePasswordChange: true
 * (e.g. first login, or after a Super Admin / OTP password reset).
 * On success the backend sets isFirstLogin: false, so this won't loop.
 */

// Mirror of backend passwordPolicy (auth.controller changePassword)
const rules = [
  { test: (p: string) => p.length >= 8, label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), label: "One lowercase letter" },
  { test: (p: string) => /[0-9]/.test(p), label: "One number" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "One special character" },
];

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const allPass = rules.every((r) => r.test(newPassword));
  const matches = newPassword.length > 0 && newPassword === confirm;

  const roleHome = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const portal = JSON.parse(localStorage.getItem("portalConfig") || "{}");
      if (portal?.homeRoute) return portal.homeRoute;
      if (user?.role === "SUPER_ADMIN") return "/super-admin/dashboard";
      if (user?.role === "STUDENT") return "/student-portal";
      return "/dashboard";
    } catch {
      return "/dashboard";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!allPass) {
      setError("Password does not meet the security requirements.");
      return;
    }
    if (!matches) {
      setError("Passwords do not match.");
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.post(
        getFullUrl("/api/auth/change-password"),
        { newPassword: newPassword.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update cached user so we don't get sent back here
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        user.isFirstLogin = false;
        localStorage.setItem("user", JSON.stringify(user));
      } catch { /* ignore */ }
      navigate(roleHome());
    } catch (err: any) {
      setError(err?.response?.data?.message || "Password update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#1e293b,#0f172a)", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Set a New Password</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>
          For your security, you must set a new password before continuing. Aapko aage badhne se pehle ek naya password banana hoga.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>New Password</label>
          <input
            type={show ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoFocus
            style={{ width: "100%", padding: "11px 14px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 14, marginBottom: 14, boxSizing: "border-box" }}
          />

          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Confirm New Password</label>
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={{ width: "100%", padding: "11px 14px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 14, marginBottom: 10, boxSizing: "border-box" }}
          />

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", marginBottom: 16, cursor: "pointer" }}>
            <input type="checkbox" checked={show} onChange={() => setShow(!show)} />
            Show password
          </label>

          <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, marginBottom: 18 }}>
            {rules.map((r, i) => {
              const ok = r.test(newPassword);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: ok ? "#16a34a" : "#94a3b8", marginBottom: i < rules.length - 1 ? 4 : 0 }}>
                  <span>{ok ? "✓" : "○"}</span> {r.label}
                </div>
              );
            })}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: matches ? "#16a34a" : "#94a3b8", marginTop: 4 }}>
              <span>{matches ? "✓" : "○"}</span> Passwords match
            </div>
          </div>

          {error && (
            <div style={{ background: "#fef2f2", color: "#dc2626", fontSize: 13, padding: "10px 12px", borderRadius: 10, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !allPass || !matches}
            style={{ width: "100%", padding: "12px", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, color: "#fff", cursor: loading || !allPass || !matches ? "not-allowed" : "pointer", background: loading || !allPass || !matches ? "#94a3b8" : "#4f46e5" }}
          >
            {loading ? "Saving..." : "Set Password & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
