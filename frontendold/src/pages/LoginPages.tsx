
import { useState } from "react";
import axios from "axios";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      const payload = {
        email: email.toLowerCase().trim(),
        password: password,
      };

      console.log("LOGIN PAYLOAD:", payload);

      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        payload
      );

      console.log("LOGIN RESPONSE:", res.data);

      // ✅ Save token
      localStorage.setItem(
        "token",
        res.data?.token || res.data?.data?.token || ""
      );

      // ✅ Save user
      localStorage.setItem(
        "user",
        JSON.stringify(res.data?.data || {})
      );

      alert("Login successful 🚀");

      // ✅ Redirect
      window.location.href = "/dashboard";
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
              onClick={() => (window.location.href = "/forgot-password")}
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
              border: "none",
              color: "white",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              background: "linear-gradient(135deg, #1E90FF, #00C6FF, #8A2BE2)",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "14px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  outline: "none",
  fontSize: "15px",
  boxSizing: "border-box" as const,
};
