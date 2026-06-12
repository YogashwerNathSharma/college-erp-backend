
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function RegisterSchool() {
  const [schoolName, setSchoolName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!schoolName || !name || !email) {
      alert("All fields are required!");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/auth/register-tenant",
        {
          schoolName: schoolName.trim(),
          name: name.trim(),
          email: email.toLowerCase().trim(),
        }
      );

      console.log("REGISTER RESPONSE:", res.data);

      if (res.data?.success) {
        setAdminPassword(res.data?.adminPassword || "123456");
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
          width: "40%",
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
          width: "60%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            width: "420px",
            padding: "35px",
            borderRadius: "14px",
            background: "#fff",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          }}
        >
          {/* SUCCESS STATE */}
          {success ? (
            <div style={{ textAlign: "center" }}>
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
                }}
              >
                ✓
              </div>

              <h2 style={{ fontSize: "24px", marginBottom: "10px", color: "#1e293b" }}>
                🎉 Registration Successful!
              </h2>

              <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px" }}>
                Your school has been registered with a <b>14-day free trial</b>.
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
                <p style={{ fontSize: "13px", color: "#166534", marginBottom: "8px" }}>
                  <b>Login Credentials:</b>
                </p>
                <p style={{ fontSize: "14px", color: "#1e293b" }}>
                  📧 Email: <b>{email}</b>
                </p>
                <p style={{ fontSize: "14px", color: "#1e293b" }}>
                  🔑 Password: <b>{adminPassword}</b>
                </p>
                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>
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
              {/* REGISTER FORM */}
              <h2
                style={{
                  textAlign: "center",
                  marginBottom: "8px",
                  fontSize: "28px",
                  color: "#1e293b",
                }}
              >
                Register Your School
              </h2>

              <p
                style={{
                  textAlign: "center",
                  marginBottom: "25px",
                  fontSize: "14px",
                  color: "#64748b",
                }}
              >
                Get started with 14 days free trial
              </p>

              {/* SCHOOL NAME */}
              <label style={labelStyle}>School / Institute Name</label>
              <input
                type="text"
                placeholder="e.g. Delhi Public School"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                style={inputStyle}
              />

              {/* ADMIN NAME */}
              <label style={labelStyle}>Admin Name</label>
              <input
                type="text"
                placeholder="e.g. Rajesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />

              {/* ADMIN EMAIL */}
              <label style={labelStyle}>Admin Email</label>
              <input
                type="email"
                placeholder="e.g. admin@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value.trimStart())}
                style={inputStyle}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              />

              {/* INFO BOX */}
              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  marginBottom: "20px",
                  fontSize: "12px",
                  color: "#1e40af",
                }}
              >
                ℹ️ Default password will be <b>123456</b>. You will be asked to change it on first login.
                Role: <b>Admin</b> (pre-assigned).
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
                  marginTop: "20px",
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
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  color: "#374151",
  marginBottom: "5px",
};

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

