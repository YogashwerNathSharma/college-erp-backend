

import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🔒 Zoom Lock — only for this page
  useEffect(() => {
    // Prevent Ctrl + scroll wheel zoom
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    // Prevent Ctrl + / Ctrl - / Ctrl 0 zoom
    const handleKeydown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0")
      ) {
        e.preventDefault();
      }
    };

    // Set viewport meta to prevent pinch zoom on mobile
    const meta = document.querySelector('meta[name="viewport"]');
    const originalContent = meta?.getAttribute("content") || "";
    if (meta) {
      meta.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      );
    }

    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("keydown", handleKeydown);
      if (meta) meta.setAttribute("content", originalContent);
    };
  }, []);

  // 🔥 Your other products — edit this list as needed
  const otherProducts = [
    "📚 YN Library Management",
    "💰 YN Fee Manager",
    "🚌 YN Transport Tracker",
    "📊 YN Analytics Dashboard",
    "📝 YN Online Exam Portal",
    "👨‍🏫 YN HR & Payroll",
  ];

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
        password,
      };

      const res = await axios.post(
        "/api/auth/login",
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
        overflow: "hidden",
        fontFamily: "sans-serif",
      }}
    >
      {/* LEFT SIDE */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "40vw",
          height: "100vh",
          zIndex: 10,
          backgroundImage: "url('/school-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "0px",
          overflow: "hidden",
        }}
      >
        {/* Dark overlay for text readability — very light so image stays clear */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.25)",
            zIndex: 1,
          }}
        />

        {/* 🔥 NEWS TICKER BANNER — Top scrolling patti */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            padding: "10px 0",
            overflow: "hidden",
            whiteSpace: "nowrap",
            zIndex: 12,
          }}
        >
          <div
            style={{
              display: "inline-block",
              animation: "ticker 20s linear infinite",
              paddingLeft: "100%",
            }}
          >
            {otherProducts.map((product, index) => (
              <span
                key={index}
                style={{
                  marginRight: "50px",
                  fontSize: "14px",
                  fontWeight: "500",
                  letterSpacing: "0.5px",
                }}
              >
                {product}
                {index < otherProducts.length - 1 && (
                  <span style={{ margin: "0 20px", opacity: 0.5 }}>|</span>
                )}
              </span>
            ))}
          </div>
        </div>

        <div
  style={{
    position: "absolute",
    top: "160px",
    left: "10px",
    width: "300px",
    textAlign: "left",
    zIndex: 20,
  }}
>
  <img
    src="/ynlogo.png"
    alt="logo"
    style={{
      width: "200px",
      marginBottom: "25px",
    }}
  />

  <h1
    style={{
      fontSize: "36px",
      fontWeight: "bold",
      marginBottom: "10px",
      textShadow: "2px 2px 8px rgba(0,0,0,0.5)",
    }}
  >
    School ERP
  </h1>

  <p
    style={{
      fontSize: "20px",
      textShadow: "2px 1px 4px rgba(0,0,0,0)",
    }}
  >
    Manage your school digitally
  </p>
</div>

        {/* 🔥 Product Cards — COMMENTED OUT (optional, uncomment if needed)
        <div
          style={{
            marginTop: "30px",
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            justifyContent: "center",
            maxWidth: "320px",
          }}
        >
          {otherProducts.map((product, index) => (
            <div
              key={index}
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(4px)",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLDivElement).style.background = "rgba(255, 255, 255, 0.3)";
                (e.target as HTMLDivElement).style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLDivElement).style.background = "rgba(255, 255, 255, 0.15)";
                (e.target as HTMLDivElement).style.transform = "scale(1)";
              }}
            >
              {product}
            </div>
          ))}
        </div>
        */}
      </div>

      {/* RIGHT SIDE */}
      <div
        style={{
          width: "60vw",
          marginLeft: "40vw",
          height: "100vh",
          overflowY: "auto" as const,
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

      {/* 🔥 CSS Keyframes for ticker animation */}
      <style>
        {`
          @keyframes ticker {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        `}
      </style>
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


