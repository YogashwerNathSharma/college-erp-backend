
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🔥 Generate device fingerprint (basic browser fingerprint)
  const getDeviceFingerprint = (): string => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx?.fillText("fingerprint", 10, 10);
    const canvasData = canvas.toDataURL();

    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || "unknown",
      canvasData.slice(0, 50),
    ].join("|");

    // Simple hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return "FP-" + Math.abs(hash).toString(36);
  };

  const handleLogin = async () => {
    try {
      setLoading(true);

      const payload = {
        email: email.toLowerCase().trim(),
        password: password.trim(),
      };

      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        payload,
        {
          headers: {
            "X-Device-Fingerprint": getDeviceFingerprint(),
          },
        }
      );

      console.log("LOGIN RESPONSE:", res.data);

      // ✅ Check if subscription is expired
      if (res.data?.subscriptionExpired) {
        localStorage.setItem("token", res.data?.token || "");
        localStorage.setItem("user", JSON.stringify(res.data?.data || {}));
        localStorage.setItem("tenant", JSON.stringify(res.data?.tenant || {}));
        localStorage.setItem("subscriptionExpired", "true");
        navigate("/subscription-expired");
        return;
      }

      // ✅ Normal login flow
      localStorage.setItem("token", res.data?.token || res.data?.data?.token || "");
      localStorage.setItem("user", JSON.stringify(res.data?.data || {}));
      localStorage.removeItem("subscriptionExpired");

      // ✅ Redirect
      if (res.data?.forcePasswordChange) {
        navigate("/change-password");
      } else {
        navigate("/dashboard");
      }

    } catch (err: any) {
      console.log("LOGIN ERROR:", err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Login Failed ❌"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      {/* LEFT SIDE */}
      <div
        style={{
          width: "40%",
          background: "linear-gradient(135deg, #1E90FF, #00C6FF, #8A2BE2)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
        }}
      >
        <img
          src="/ynlogo.png"
          alt="logo"
          style={{
            width: "180px",
            marginBottom: "20px",
          }}
        />

        <h1
          style={{
            fontSize: "48px",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        >
          School ERP
        </h1>

        <p
          style={{
            fontSize: "20px",
            opacity: 0.9,
            textAlign: "center",
          }}
        >
          Manage your school digitally
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div
        style={{
          width: "60%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            width: "380px",
            padding: "35px",
            borderRadius: "14px",
            background: "#fff",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              marginBottom: "25px",
              fontSize: "30px",
            }}
          >
            Login
          </h2>

          {/* EMAIL */}
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trimStart())}
            style={inputStyle}
          />

          {/* PASSWORD */}
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />

          {/* SHOW + FORGOT */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
              fontSize: "14px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              Show Password
            </label>

            <span
              onClick={() => navigate("/forgot-password")}
              style={{
                color: "#1E90FF",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Forgot?
            </span>
          </div>

          {/* LOGIN BUTTON */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "8px",
              background: loading
                ? "#999"
                : "linear-gradient(135deg, #1E90FF, #8A2BE2)",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "600",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* 🔥 REGISTER LINK */}
          <p
            style={{
              textAlign: "center",
              marginTop: "20px",
              fontSize: "14px",
              color: "#64748b",
            }}
          >
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register-school")}
              style={{
                color: "#8A2BE2",
                fontWeight: "600",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Register Your School
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  marginBottom: "15px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box",
};

