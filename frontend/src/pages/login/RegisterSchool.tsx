import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getFullUrl } from "../../utils/url";
import TenantAgreement, { TENANT_AGREEMENT_VERSION } from "./TenantAgreement";

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
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [showAgreement, setShowAgreement] = useState(true);
  const [agreementRecorded, setAgreementRecorded] = useState(false);
  const [agreementError, setAgreementError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setShowAgreement(true);
    setAgreementAccepted(false);
  }, []);

  const handleRegister = async () => {
    if (!schoolName.trim() || !name.trim() || !email.trim()) {
      alert("School Name, Admin Name and Email are required!");
      return;
    }
    if (!agreementAccepted) {
      setShowAgreement(true);
      alert("Please read and accept the YN Software School ERP SaaS Subscription & License Agreement.");
      return;
    }

    try {
      setLoading(true);
      setAgreementError("");
      const formData = new FormData();
      formData.append("schoolName", schoolName.trim());
      formData.append("type", type);
      formData.append("name", name.trim());
      formData.append("email", email.toLowerCase().trim());
      formData.append("phone", phone.trim());
      formData.append("address", address.trim());
      formData.append("agreementAccepted", "true");
      formData.append("agreementVersion", TENANT_AGREEMENT_VERSION);
      if (logo) formData.append("logo", logo);
      if (background) formData.append("background", background);

      const res = await axios.post(getFullUrl("/api/auth/register-tenant"), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!res.data?.success) {
        alert(res.data?.message || "Registration failed");
        return;
      }

      const tenantId = res.data?.tenantId;
      if (!tenantId) throw new Error("Registration succeeded but tenant ID was not returned.");

      try {
        const agreementRes = await axios.post(getFullUrl("/api/auth/tenant-agreement/accept"), {
          tenantId,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          agreementVersion: TENANT_AGREEMENT_VERSION,
        });
        if (!agreementRes.data?.success) throw new Error(agreementRes.data?.message || "Agreement acceptance could not be recorded.");
        setAgreementRecorded(true);
      } catch (agreementErr: any) {
        console.error("TENANT AGREEMENT RECORDING ERROR:", agreementErr);
        setAgreementRecorded(false);
        setAgreementError(agreementErr?.response?.data?.message || agreementErr?.message || "Agreement acceptance could not be recorded.");
      }

      setAdminPassword(res.data?.adminPassword || "123456");
      if (res.data?.freeTrialBlocked) {
        setFreeTrialBlocked(true);
        setBlockReason(res.data?.blockReason || "Free trial already used");
      }
      setSuccess(true);
    } catch (err: any) {
      console.error("REGISTER ERROR:", err);
      alert(err?.response?.data?.message || err?.message || "Registration Failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const acceptAgreement = () => {
    setAgreementAccepted(true);
    setShowAgreement(false);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ width: "35%", background: "linear-gradient(135deg, #8A2BE2, #00C6FF, #1E90FF)", color: "white", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px" }}>
        <img src="/ynlogo.png" alt="YN Software logo" style={{ width: "180px", marginBottom: "20px" }} />
        <h1 style={{ fontSize: "42px", fontWeight: "bold", marginBottom: "10px", textAlign: "center" }}>School ERP</h1>
        <p style={{ fontSize: "18px", opacity: 0.9, textAlign: "center", maxWidth: "280px" }}>Register your school and get 14 days free trial!</p>
        <div style={{ marginTop: "30px", fontSize: "13px", opacity: 0.9, textAlign: "center" }}><b>YN Software</b><br />Owned &amp; developed by Yogashwer Nath Sharma</div>
      </div>

      <div style={{ width: "65%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 60px", background: "#fff" }}>
        {success ? (
          <div style={{ textAlign: "center", maxWidth: "520px", margin: "0 auto" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 15px", fontSize: "28px", color: "#fff" }}>✓</div>
            <h2 style={{ fontSize: "24px", marginBottom: "10px" }}>🎉 Registration Successful!</h2>
            <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px" }}>{freeTrialBlocked ? <>Your school has been registered. <b style={{ color: "#f59e0b" }}>⚠️ Free trial not available: {blockReason}</b><br />Please purchase a plan after login.</> : <>Your school has been registered with a <b>14-day free trial</b>.</>}</p>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "15px", marginBottom: "15px", textAlign: "left" }}>
              <p style={{ fontSize: "13px", color: "#166534" }}><b>Login Credentials:</b></p>
              <p style={{ fontSize: "14px" }}>📧 Email: <b>{email}</b></p>
              <p style={{ fontSize: "14px" }}>🔑 Password: <b>{adminPassword}</b></p>
              <p style={{ fontSize: "12px", color: "#64748b" }}>⚠️ Please change your password after first login.</p>
            </div>
            <div style={{ background: agreementRecorded ? "#eff6ff" : "#fff7ed", border: `1px solid ${agreementRecorded ? "#bfdbfe" : "#fed7aa"}`, borderRadius: "10px", padding: "12px", marginBottom: "20px", textAlign: "left", fontSize: "12px", color: agreementRecorded ? "#1e40af" : "#9a3412" }}>{agreementRecorded ? `✓ SaaS Agreement v${TENANT_AGREEMENT_VERSION} accepted and recorded for this tenant.` : `⚠ ${agreementError || "Agreement acceptance record is pending."}`}</div>
            <button onClick={() => navigate("/")} style={primaryButton}>Go to Login →</button>
          </div>
        ) : (
          <>
            <h2 style={{ marginBottom: "4px", fontSize: "26px", color: "#1e293b" }}>Register Your School</h2>
            <p style={{ marginBottom: "20px", fontSize: "14px", color: "#64748b" }}>Get started with 14 days free trial</p>
            <h4 style={sectionTitle}>Basic Information</h4>
            <div style={rowStyle}><Field label="School / Institute Name" required value={schoolName} onChange={setSchoolName} placeholder="e.g. Delhi Public School" flex={2} /><div style={{ flex: 1 }}><label style={labelStyle}>Type <span style={{ color: "red" }}>*</span></label><select value={type} onChange={e => setType(e.target.value)} style={inputStyle}><option>School</option><option>College</option><option>Institute</option><option>Coaching</option></select></div></div>
            <div style={rowStyle}><Field label="Admin Name" required value={name} onChange={setName} placeholder="e.g. Rajesh Kumar" /><Field label="Phone" value={phone} onChange={setPhone} placeholder="+91 98765 43210" /></div>
            <div style={rowStyle}><Field label="Email" required value={email} onChange={setEmail} placeholder="admin@school.com" type="email" /><Field label="Address" value={address} onChange={setAddress} placeholder="Full address..." /></div>
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "8px 12px", margin: "16px 0", fontSize: "12px", color: "#1e40af" }}>ℹ️ Default password: <b>123456</b> | Role: <b>Admin</b>. Change password after first login.</div>
            <h4 style={sectionTitle}>Branding (Optional)</h4>
            <div style={rowStyle}><div style={{ flex: 1 }}><label style={labelStyle}>School Logo</label><input type="file" accept="image/*" onChange={e => setLogo(e.target.files?.[0] || null)} /></div><div style={{ flex: 1 }}><label style={labelStyle}>Background Image</label><input type="file" accept="image/*" onChange={e => setBackground(e.target.files?.[0] || null)} /></div></div>
            <div style={{ marginTop: "12px", marginBottom: "14px", padding: "14px", border: "2px solid #4f46e5", background: "#eef2ff", borderRadius: "10px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#312e81" }}>🔐 Legal Agreement Required</div>
              <div style={{ fontSize: "12px", lineHeight: 1.6, color: "#3730a3", marginTop: "6px" }}>Before creating a tenant, the authorized institution representative must review and accept the <b>YN Software School ERP SaaS Subscription &amp; License Agreement</b> (Version {TENANT_AGREEMENT_VERSION}).</div>
              <button type="button" onClick={() => setShowAgreement(true)} style={{ marginTop: "10px", border: "none", background: "#4338ca", color: "#fff", fontWeight: 700, borderRadius: "7px", padding: "8px 12px", cursor: "pointer" }}>{agreementAccepted ? "✓ Agreement Accepted · Review Again" : "Open & Review Full Agreement"}</button>
              <div style={{ marginTop: "7px", fontSize: "11px", color: "#475569" }}>Software owner: <b>Yogashwer Nath Sharma · YN Software</b>. Source-code ownership is not transferred by subscription.</div>
            </div>
            <button onClick={handleRegister} disabled={loading || !agreementAccepted} style={{ ...primaryButton, background: loading || !agreementAccepted ? "#94a3b8" : primaryButton.background, cursor: loading || !agreementAccepted ? "not-allowed" : "pointer" }}>{loading ? "Registering..." : "Register School 🚀"}</button>
            <p style={{ textAlign: "center", marginTop: "14px", fontSize: "14px", color: "#64748b" }}>Already have an account? <span onClick={() => navigate("/")} style={{ color: "#1E90FF", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>Login</span></p>
          </>
        )}
      </div>
      {showAgreement && !success && <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(15,23,42,.78)", padding: "14px", overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}><TenantAgreement onClose={() => setShowAgreement(false)} onAccept={acceptAgreement} /></div>}
    </div>
  );
}

function Field({ label, required, value, onChange, placeholder, type = "text", flex = 1 }: { label: string; required?: boolean; value: string; onChange: (v: string) => void; placeholder: string; type?: string; flex?: number }) {
  return <div style={{ flex }}><label style={labelStyle}>{label} {required && <span style={{ color: "red" }}>*</span>}</label><input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} /></div>;
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" };
const labelStyle: React.CSSProperties = { display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: 500, color: "#374151" };
const rowStyle: React.CSSProperties = { display: "flex", gap: "12px", marginBottom: "12px" };
const sectionTitle: React.CSSProperties = { fontSize: "15px", fontWeight: 600, color: "#1e293b", marginBottom: "10px", marginTop: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" };
const primaryButton: React.CSSProperties = { width: "100%", padding: "13px", borderRadius: "8px", background: "linear-gradient(135deg, #8A2BE2, #1E90FF)", color: "#fff", fontSize: "16px", fontWeight: 600, border: "none", cursor: "pointer" };
