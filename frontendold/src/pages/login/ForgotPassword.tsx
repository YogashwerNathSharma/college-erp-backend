import { useState } from "react";
import axios from "axios";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = email, 2 = OTP + new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  //////////////////////////////////////////////////////
  // STEP 1: Send OTP
  //////////////////////////////////////////////////////
  const handleSendOtp = async () => {
    if (!email.trim()) return alert("Enter your email");

    try {
      setLoading(true);

      await axios.post("/api/auth/forgot-password", {
        email: email.toLowerCase().trim(),
      });

      alert("✅ OTP sent to your email! Check console/email.");
      setStep(2);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  //////////////////////////////////////////////////////
  // STEP 2: Verify OTP & Reset Password
  //////////////////////////////////////////////////////
  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword.trim()) {
      return alert("Enter OTP and new password");
    }

    try {
      setLoading(true);

      await axios.post("/api/auth/reset-password", {
        email: email.toLowerCase().trim(),
        otp: otp.trim(),
        newPassword: newPassword.trim(),
      });

      alert("✅ Password reset successful! Please login.");
      window.location.href = "/";
    } catch (err: any) {
      alert(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
        background: "#f8fafc",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: "380px",
          padding: "30px",
          borderRadius: "12px",
          background: "white",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          🔑 Forgot Password
        </h2>

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <>
            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />

            <button
              onClick={handleSendOtp}
              disabled={loading}
              style={btnStyle}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {/* STEP 2: Enter OTP + New Password */}
        {step === 2 && (
          <>
            <p style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
              OTP sent to: <b>{email}</b>
            </p>

            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              style={inputStyle}
            />

            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle}
            />

            <button
              onClick={handleResetPassword}
              disabled={loading}
              style={btnStyle}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <p
              onClick={() => setStep(1)}
              style={{
                textAlign: "center",
                marginTop: "12px",
                fontSize: "13px",
                color: "#1E90FF",
                cursor: "pointer",
              }}
            >
              ← Back to email
            </p>
          </>
        )}

        {/* Back to Login */}
        <p
          onClick={() => (window.location.href = "/")}
          style={{
            textAlign: "center",
            marginTop: "15px",
            fontSize: "13px",
            color: "#8A2BE2",
            cursor: "pointer",
          }}
        >
          ← Back to Login
        </p>
      </div>
    </div>
  );
}

//////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  marginBottom: "12px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  outline: "none",
};

const btnStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "none",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  background: "linear-gradient(135deg, #1E90FF, #00C6FF, #8A2BE2)",
};
