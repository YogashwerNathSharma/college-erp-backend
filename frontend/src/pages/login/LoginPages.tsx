
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => { if (e.ctrlKey) e.preventDefault(); };
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0")) e.preventDefault();
    };
    const meta = document.querySelector('meta[name="viewport"]');
    const originalContent = meta?.getAttribute("content") || "";
    if (meta) meta.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no");
    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("keydown", handleKeydown);
      if (meta) meta.setAttribute("content", originalContent);
    };
  }, []);

  const otherProducts = [
    "📚 YN Library Management",
    "💰 YN Fee Manager",
    "🚌 YN Transport Tracker",
    "📊 YN Analytics Dashboard",
    "📝 YN Online Exam Portal",
    "👨🏫 YN HR & Payroll",
  ];

  const getDeviceFingerprint = (): string => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx?.fillText("fingerprint", 10, 10);
    const canvasData = canvas.toDataURL();
    const data = [navigator.userAgent, navigator.language, screen.width + "x" + screen.height, screen.colorDepth, new Date().getTimezoneOffset(), navigator.hardwareConcurrency || "unknown", canvasData.slice(0, 50)].join("|");
    let hash = 0;
    for (let i = 0; i < data.length; i++) { const char = data.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash |= 0; }
    return "FP-" + Math.abs(hash).toString(36);
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const res = await axios.post("/api/auth/login", { email: email.toLowerCase().trim(), password }, { headers: { "X-Device-Fingerprint": getDeviceFingerprint() } });
      if (res.data?.subscriptionExpired) {
        localStorage.setItem("token", res.data?.token || "");
        localStorage.setItem("user", JSON.stringify(res.data?.data || {}));
        localStorage.setItem("tenant", JSON.stringify(res.data?.tenant || {}));
        localStorage.setItem("subscriptionExpired", "true");
        navigate("/subscription-expired");
        return;
      }
      localStorage.setItem("token", res.data?.token || res.data?.data?.token || "");
      localStorage.setItem("user", JSON.stringify(res.data?.data || {}));
      localStorage.removeItem("subscriptionExpired");
      if (res.data?.forcePasswordChange) {
        navigate("/change-password");
      } else {
        // Role-based redirect
        const userData = res.data?.data || {};
        const role = userData.role;
        if (role === "STUDENT") {
          navigate("/student-portal");
        } else if (role === "TEACHER") {
          navigate("/teacher-portal");
        } else if (role === "PRINCIPAL") {
          navigate("/principal-portal");
        } else {
          // SUPER_ADMIN, ADMIN, STAFF → admin dashboard
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Login Failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        * { margin: 0; padding: 0; }

        .page-bg {
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          font-family: 'Segoe UI', sans-serif;
          background-image: url('/school-bg.jpg');
          background-size: cover;
          background-position: center;
          position: relative;
          display: flex;
          align-items: center;
          padding-top: 38px;
          box-sizing: border-box;
        }

        .page-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(15,23,42,0.88), rgba(30,58,138,0.78));
          z-index: 1;
        }

        .ticker-strip {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 38px;
          background: linear-gradient(90deg, #1e293b, #312e81);
          display: flex;
          align-items: center;
          overflow: hidden;
          z-index: 100;
        }

        .ticker-scroll {
          display: inline-block;
          white-space: nowrap;
          animation: ticker 25s linear infinite;
          padding-left: 100%;
        }

        .login-card {
          position: relative;
          z-index: 10;
          width: 420px;
          margin-left: 40px;
          background: #ffffff;
          border-radius: 20px;
          padding: 30px 34px 22px;
          box-sizing: border-box;
          box-shadow: 0 25px 60px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
          max-height: calc(100vh - 58px);
        }

        .right-content {
          position: relative;
          z-index: 2;
          margin-left: auto;
          margin-right: 60px;
          max-width: 500px;
        }

        .form-input {
          width: 100%;
          padding: 13px 14px 13px 42px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          background: #f8fafc;
          transition: border-color 0.2s;
        }
        .form-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
        }

        @media (max-width: 1100px) {
          .right-content { display: none !important; }
          .login-card { margin: 0 auto !important; }
        }
        @media (max-width: 480px) {
          .login-card { width: 90% !important; margin: 0 auto !important; padding: 28px 20px 20px !important; }
        }
      `}</style>

      <div className="page-bg">

        {/* Ticker */}
        <div className="ticker-strip">
          <div className="ticker-scroll">
            {otherProducts.map((p, i) => (
              <span key={i} style={{ marginRight: 50, fontSize: 13, fontWeight: 500, color: "#fff", letterSpacing: 0.5 }}>
                {p}{i < otherProducts.length - 1 && <span style={{ margin: "0 18px", opacity: 0.4 }}>|</span>}
              </span>
            ))}
          </div>
        </div>

        {/* ===== LOGIN CARD (floating) ===== */}
        <div className="login-card">

          <img src="/ynlogo.png" alt="YN Software" style={{ width: 130, marginBottom: 0, marginTop:0 }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginTop: 0 , marginBottom:2}}>YN-School ERP</h1>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 5 }}>Manage your school digitally with YN-UDP</p>

          {/* Email */}
          <div style={{ position: "relative", width: "100%", marginBottom: 14 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#94a3b8" }}>✉</span>
            <input className="form-input" type="email" placeholder="Enter Email" value={email} onChange={(e) => setEmail(e.target.value.trimStart())} />
          </div>

          {/* Password */}
          <div style={{ position: "relative", width: "100%", marginBottom: 14 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#94a3b8" }}>🔒</span>
            <input className="form-input" type={showPassword ? "text" : "password"} placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} style={{ paddingRight: 42 }} />
            <span onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: 16, color: "#94a3b8" }}>
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          {/* Remember + Forgot */}
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: 18, fontSize: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 5, color: "#475569", cursor: "pointer" }}>
              <input type="checkbox" /> Remember Me
            </label>
            <span onClick={() => navigate("/forgot-password")} style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }}>Forgot Password?</span>
          </div>

          {/* Login Btn */}
          <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: 13, borderRadius: 10, background: loading ? "#999" : "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: 15, fontWeight: 600, border: "none", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            📥 {loading ? "Logging in..." : "Login"}
          </button>

          {/* OR */}
          <div style={{ display: "flex", alignItems: "center", width: "100%", margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ padding: "0 10px", color: "#94a3b8", fontSize: 12 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          {/* Register */}
          <button onClick={() => navigate("/register-school")} style={{ width: "100%", padding: 12, borderRadius: 10, background: "transparent", color: "#6366f1", fontSize: 14, fontWeight: 600, border: "2px solid #6366f1", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            🏫 Register Your School
          </button>

          {/* Trust */}
          <div style={{ display: "flex", justifyContent: "center", gap: 28, marginTop: 18 }}>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 18 }}>🛡️</div><p style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Secure<br/>Platform</p></div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 18 }}>☁️</div><p style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Cloud<br/>Based</p></div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 18 }}>🎧</div><p style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>24/7<br/>Support</p></div>
          </div>

          <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 12 }}>© 2025 YN Software. All rights reserved.</p>
        </div>

        {/* ===== RIGHT — Features (floating text) ===== */}
        <div className="right-content">
          <h2 style={{ fontSize: 32, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 8 }}>A Complete Digital Solution<br/>for Modern Schools</h2>
          <div style={{ width: 50, height: 4, background: "#6366f1", borderRadius: 2, marginBottom: 18 }} />
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", marginBottom: 30 }}>Streamline administration, enhance learning<br/>and build a better future.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>👥</div>
              <div><h4 style={{ color: "#fff", fontSize: 15, fontWeight: 600, marginBottom: 3 }}>Smart Administration</h4><p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.5 }}>Automate admissions, attendance, fees, examinations and more.</p></div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>💬</div>
              <div><h4 style={{ color: "#fff", fontSize: 15, fontWeight: 600, marginBottom: 3 }}>Better Learning</h4><p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.5 }}>Digital classrooms, e-learning, assignments and performance tracking.</p></div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📊</div>
              <div><h4 style={{ color: "#fff", fontSize: 15, fontWeight: 600, marginBottom: 3 }}>Real-Time Insights</h4><p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.5 }}>Powerful reports and analytics for better decision making.</p></div>
            </div>
          </div>

          <div style={{ marginTop: 24, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(4px)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ fontSize: 22 }}>🛡️</div>
            <div><h5 style={{ color: "#fff", fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Your data is safe with us</h5><p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>We use enterprise-grade security to protect your information.</p></div>
          </div>
        </div>

      </div>
    </>
  );
}
