
import { useState } from "react";
import axios from "axios";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    schoolName: "",
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async () => {
    if (!formData.schoolName.trim()) {
      alert("School name is required");
      return;
    }
    if (!formData.name.trim()) {
      alert("Admin name is required");
      return;
    }
    if (!formData.email.trim()) {
      alert("Email is required");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/auth/register-tenant",
        {
          schoolName: formData.schoolName.trim(),
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
        }
      );

      console.log("REGISTER RESPONSE:", res.data);

      setAdminPassword(res.data?.adminPassword || "123456");
      setSuccess(true);
    } catch (err: any) {
      console.log("REGISTER ERROR:", err);
      alert(
        err?.response?.data?.message || err?.message || "Registration Failed ❌"
      );
    } finally {
      setLoading(false);
    }
  };

  //////////////////////////////////////////////////////
  // SUCCESS SCREEN
  //////////////////////////////////////////////////////

  if (success) {
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
            width: "420px",
            padding: "35px",
            borderRadius: "14px",
            background: "#fff",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "60px", marginBottom: "15px" }}>🎉</div>
          <h2 style={{ color: "#10b981", marginBottom: "10px" }}>
            Registration Successful!
          </h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            Your school has been registered on the platform.
          </p>

          <div
            style={{
              background: "#f1f5f9",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "20px",
              textAlign: "left",
            }}
          >
            <p style={{ margin: "5px 0", fontSize: "14px" }}>
              <strong>School:</strong> {formData.schoolName}
            </p>
            <p style={{ margin: "5px 0", fontSize: "14px" }}>
              <strong>Admin:</strong> {formData.name}
            </p>
            <p style={{ margin: "5px 0", fontSize: "14px" }}>
              <strong>Email:</strong> {formData.email}
            </p>
            <p style={{ margin: "5px 0", fontSize: "14px" }}>
              <strong>Password:</strong>{" "}
              <span
                style={{
                  background: "#fef3c7",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              >
                {adminPassword}
              </span>
            </p>
          </div>

          <p
            style={{
              fontSize: "12px",
              color: "#ef4444",
              marginBottom: "20px",
            }}
          >
            ⚠️ Please save this password! You'll need to change it on first login.
          </p>

          <button
            onClick={() => (window.location.href = "/")}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "8px",
              border: "none",
              color: "white",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: "pointer",
              background: "linear-gradient(135deg, #1E90FF, #00C6FF, #8A2BE2)",
            }}
          >
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  //////////////////////////////////////////////////////
  // REGISTER FORM
  //////////////////////////////////////////////////////

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
          Register your school
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
            width: "400px",
            padding: "35px",
            borderRadius: "14px",
            background: "#fff",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              marginBottom: "8px",
              fontSize: "28px",
            }}
          >
            Register School
          </h2>

          <p
            style={{
              textAlign: "center",
              marginBottom: "25px",
              fontSize: "14px",
              color: "#666",
            }}
          >
            Register your school & get admin access
          </p>

          {/* SCHOOL NAME */}
          <input
            type="text"
            name="schoolName"
            placeholder="School / College Name"
            value={formData.schoolName}
            onChange={handleChange}
            style={inputStyle}
          />

          {/* ADMIN NAME */}
          <input
            type="text"
            name="name"
            placeholder="Admin Full Name"
            value={formData.name}
            onChange={handleChange}
            style={inputStyle}
          />

          {/* EMAIL */}
          <input
            type="email"
            name="email"
            placeholder="Admin Email"
            value={formData.email}
            onChange={handleChange}
            style={inputStyle}
          />

          {/* INFO */}
          <p
            style={{
              fontSize: "12px",
              color: "#888",
              marginBottom: "15px",
              padding: "8px 12px",
              background: "#f1f5f9",
              borderRadius: "6px",
            }}
          >
            🔒 A default password will be generated. You can change it after first login.
          </p>

          {/* REGISTER BUTTON */}
          <button
            onClick={handleRegister}
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
            {loading ? "Registering..." : "Register School"}
          </button>

          {/* LOGIN LINK */}
          <p
            style={{
              textAlign: "center",
              marginTop: "18px",
              fontSize: "15px",
            }}
          >
            Already have an account?{" "}
            <span
              onClick={() => (window.location.href = "/")}
              style={{
                color: "#8A2BE2",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Login
            </span>
          </p>
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

