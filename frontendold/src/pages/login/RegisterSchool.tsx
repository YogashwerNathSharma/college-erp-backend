

import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function RegisterSchool() {
  const [schoolName, setSchoolName] = useState("");
  const [type, setType] = useState("School");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [logo, setLogo] = useState<File | null>(null);           
  const [background, setBackground] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [freeTrialBlocked, setFreeTrialBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const navigate = useNavigate();

 const handleRegister = async () => {
  if (!schoolName || !name || !email) {
    alert("School Name, Admin Name and Email are required!");
    return;
  }

  try {
    setLoading(true);

    // ✅ FormData — supports file upload
    const formData = new FormData();
    formData.append("schoolName", schoolName.trim());
    formData.append("name", name.trim());
    formData.append("email", email.toLowerCase().trim());
    formData.append("phone", phone.trim());
    formData.append("address", address.trim());
    if (logo) formData.append("logo", logo);
    if (background) formData.append("background", background);

    const res = await axios.post(
      "http://localhost:5000/api/auth/register-tenant",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    console.log("REGISTER RESPONSE:", res.data);

    if (res.data?.success) {
      setAdminPassword(res.data?.adminPassword || "123456");

      if (res.data?.freeTrialBlocked) {
        setFreeTrialBlocked(true);
        setBlockReason(res.data?.blockReason || "Free trial already used");
      }

      setSuccess(true);
    } else {
      alert(res.data?.message || "Registration failed");
    }
  } catch (err: any) {
    console.log("REGISTER ERROR:", err);
    alert(
      err?.response?.data?.message ||
        err?.message ||
        "Registration Failed ❌"
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
          width: "35%",
          background: "linear-gradient(135deg, #8A2BE2, #00C6FF, #1E90FF)",
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
            fontSize: "42px",
            fontWeight: "bold",
            marginBottom: "10px",
            textAlign: "center",
          }}
        >
          School ERP
        </h1>

        <p
          style={{
            fontSize: "18px",
            opacity: 0.9,
            textAlign: "center",
            maxWidth: "280px",
          }}
        >
          Register your school and get 14 days free trial!
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div
        style={{
          width: "65%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "40px 60px",
          background: "#fff",
        }}
      >
        {/* SUCCESS STATE */}
        {success ? (
          <div style={{ textAlign: "center", maxWidth: "400px", margin: "0 auto" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 15px",
                fontSize: "28px",
                color: "#fff",
              }}
            >
              ✓
            </div>

            <h2
              style={{
                fontSize: "24px",
                marginBottom: "10px",
                color: "#1e293b",
              }}
            >
              🎉 Registration Successful!
            </h2>

            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "20px",
              }}
            >
              {freeTrialBlocked ? (
                <>
                  Your school has been registered.{" "}
                  <span style={{ color: "#f59e0b", fontWeight: "600" }}>
                    ⚠️ Free trial not available: {blockReason}
                  </span>
                  <br />
                  Please purchase a plan after login.
                </>
              ) : (
                <>
                  Your school has been registered with a{" "}
                  <b>14-day free trial</b>.
                </>
              )}
            </p>

            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "10px",
                padding: "15px",
                marginBottom: "20px",
                textAlign: "left",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  color: "#166534",
                  marginBottom: "8px",
                }}
              >
                <b>Login Credentials:</b>
              </p>
              <p style={{ fontSize: "14px", color: "#1e293b" }}>
                📧 Email: <b>{email}</b>
              </p>
              <p style={{ fontSize: "14px", color: "#1e293b" }}>
                🔑 Password: <b>{adminPassword}</b>
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  marginTop: "8px",
                }}
              >
                ⚠️ Please change your password after first login.
              </p>
            </div>

            <button
              onClick={() => navigate("/")}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #1E90FF, #8A2BE2)",
                color: "#fff",
                fontSize: "16px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
              }}
            >
              Go to Login →
            </button>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <h2
              style={{
                marginBottom: "4px",
                fontSize: "26px",
                color: "#1e293b",
              }}
            >
              Register Your School
            </h2>
            <p
              style={{
                marginBottom: "20px",
                fontSize: "14px",
                color: "#64748b",
              }}
            >
              Get started with 14 days free trial
            </p>

            {/* ===== BASIC INFORMATION ===== */}
            <h4 style={sectionTitle}>Basic Information</h4>

            {/* ROW 1: School Name + Type */}
            <div style={rowStyle}>
              <div style={{ flex: 2 }}>
                <label style={labelStyle}>
                  School / Institute Name <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Delhi Public School"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>
                  Type <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={inputStyle}
                >
                  <option value="School">School</option>
                  <option value="College">College</option>
                  <option value="Institute">Institute</option>
                  <option value="Coaching">Coaching</option>
                </select>
              </div>
            </div>

            {/* ROW 2: Admin Name + Phone */}
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>
                  Admin Name <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Phone</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* ROW 3: Email + Address */}
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>
                  Email <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="admin@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trimStart())}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Address</label>
                <input
                  type="text"
                  placeholder="Full address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* INFO BOX */}
            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
                padding: "8px 12px",
                marginTop: "16px",
                marginBottom: "16px",
                fontSize: "12px",
                color: "#1e40af",
              }}
            >
              ℹ️ Default password: <b>123456</b> | Role: <b>Admin</b>{" "}
              (pre-assigned). Change password after first login.
            </div>
              {/* ===== BRANDING (Logo + Background) ===== */}
              <h4 style={sectionTitle}>Branding (Optional)</h4>

              <div style={rowStyle}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>School Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setLogo(file);
                    }}
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Background Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setBackground(file);
                    }}
                    style={{ fontSize: "13px" }}
                  />
                </div>
              </div>
            {/* REGISTER BUTTON */}
            <button
              onClick={handleRegister}
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "8px",
                background: loading
                  ? "#999"
                  : "linear-gradient(135deg, #8A2BE2, #1E90FF)",
                color: "#fff",
                fontSize: "16px",
                fontWeight: "600",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Registering..." : "Register School 🚀"}
            </button>

            {/* LOGIN LINK */}
            <p
              style={{
                textAlign: "center",
                marginTop: "14px",
                fontSize: "14px",
                color: "#64748b",
              }}
            >
              Already have an account?{" "}
              <span
                onClick={() => navigate("/")}
                style={{
                  color: "#1E90FF",
                  fontWeight: "600",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Login
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ===== STYLES =====
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "4px",
  fontSize: "13px",
  fontWeight: "500",
  color: "#374151",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  marginBottom: "12px",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#1e293b",
  marginBottom: "10px",
  marginTop: "8px",
  borderBottom: "1px solid #e2e8f0",
  paddingBottom: "4px",
};

