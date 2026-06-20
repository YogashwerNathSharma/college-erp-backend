import { useEffect, useState } from "react";
import axios from "axios";
import { User, Palette, Shield, Save, Eye, EyeOff } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [successMsg, setSuccessMsg] = useState("");

  // Profile
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  // Platform
  const [platform, setPlatform] = useState({ appName: "", tagline: "", primaryColor: "#4f46e5" });

  // System Config
  const [systemConfig, setSystemConfig] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data.data;
        setProfile({ name: d.profile.name, email: d.profile.email });
        setPlatform({
          appName: d.platform.appName || "",
          tagline: d.platform.tagline || "",
          primaryColor: d.platform.primaryColor || "#4f46e5",
        });
        setSystemConfig(d.systemConfig);
      } catch (err) {
        console.error("Settings fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const saveProfile = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const body: any = { name: profile.name, email: profile.email };

      if (passwords.newPassword) {
        if (passwords.newPassword !== passwords.confirmPassword) {
          alert("❌ Passwords don't match!");
          return;
        }
        body.currentPassword = passwords.currentPassword;
        body.newPassword = passwords.newPassword;
      }

      await axios.put("/api/settings/profile", body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMsg("Profile updated successfully!");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      alert("❌ " + (err.response?.data?.message || "Error updating profile"));
    } finally {
      setSaving(false);
    }
  };

  const savePlatform = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      await axios.put("/api/settings/platform", platform, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Apply theme color live (no reload needed)
      document.documentElement.style.setProperty("--primary-color", platform.primaryColor);

      setSuccessMsg("Platform settings updated!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      alert("❌ " + (err.response?.data?.message || "Error updating settings"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading settings...</div>;

  const menuItems = [
    { key: "profile", label: "Profile", icon: <User size={18} />, desc: "Name, email & password" },
    { key: "platform", label: "Platform", icon: <Palette size={18} />, desc: "Branding & appearance" },
    { key: "system", label: "System", icon: <Shield size={18} />, desc: "API keys & config" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your platform configuration</p>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
          ✅ {successMsg}
        </div>
      )}

      {/* Main Layout — Sidebar + Content */}
      <div className="flex gap-6">
        {/* ====== LEFT SIDEBAR ====== */}
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-2xl border shadow-sm p-3 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
                  activeTab === item.key
                    ? "bg-primary-50 text-primary-700 border border-primary-200"
                    : "text-slate-600 hover:bg-gray-50"
                }`}
              >
                <div className={`${activeTab === item.key ? "text-primary-600" : "text-slate-400"}`}>
                  {item.icon}
                </div>
                <div>
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs text-slate-400">{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ====== RIGHT CONTENT ====== */}
        <div className="flex-1 min-w-0">

          {/* PROFILE */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <User size={20} className="text-primary-600" /> Profile Settings
                </h2>
                <p className="text-sm text-slate-500 mt-1">Update your personal information and password</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1.5 block">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1.5 block">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50"
                  />
                </div>
              </div>

              <div className="border-t pt-5">
                <h3 className="font-semibold text-slate-700 mb-4">🔒 Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1.5 block">Current Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1.5 block">New Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1.5 block">Confirm Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-sm text-primary-600 flex items-center gap-1 mt-3 hover:text-primary-800"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showPassword ? "Hide" : "Show"} passwords
                </button>
              </div>

              <div className="border-t pt-4">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 transition"
                >
                  <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* PLATFORM */}
          {activeTab === "platform" && (
            <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Palette size={20} className="text-primary-600" /> Platform Branding
                </h2>
                <p className="text-sm text-slate-500 mt-1">Customize your ERP appearance</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1.5 block">App Name</label>
                  <input
                    type="text"
                    value={platform.appName}
                    onChange={(e) => setPlatform({ ...platform, appName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1.5 block">Tagline</label>
                  <input
                    type="text"
                    value={platform.tagline}
                    onChange={(e) => setPlatform({ ...platform, tagline: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-1.5 block">Primary Color</label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={platform.primaryColor}
                    onChange={(e) => setPlatform({ ...platform, primaryColor: e.target.value })}
                    className="w-14 h-14 rounded-xl border-2 border-gray-200 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-mono text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">{platform.primaryColor}</span>
                    <p className="text-xs text-gray-400 mt-1">Used for buttons, links & accents</p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-400 mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: platform.primaryColor }}></div>
                  <div>
                    <p className="font-bold text-slate-800">{platform.appName || "App Name"}</p>
                    <p className="text-xs text-slate-500">{platform.tagline || "Your tagline here"}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <button
                  onClick={savePlatform}
                  disabled={saving}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 transition"
                >
                  <Save size={16} /> {saving ? "Saving..." : "Save Platform Settings"}
                </button>
              </div>
            </div>
          )}

          {/* SYSTEM */}
          {activeTab === "system" && (
            <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Shield size={20} className="text-primary-600" /> System Configuration
                </h2>
                <p className="text-sm text-slate-500 mt-1">API keys and server configuration (read-only)</p>
              </div>

              <div className="space-y-3">
                {Object.entries(systemConfig).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-sm font-medium text-slate-700">{key.replace(/([A-Z])/g, ' \$1').trim()}</span>
                    </div>
                    <span className="text-sm font-mono bg-white px-3 py-1.5 rounded-lg border text-slate-700">{value as string}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800 font-medium">⚠️ Environment Variables</p>
                <p className="text-xs text-amber-600 mt-1">
                  These values are configured in the <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">.env</code> file. 
                  Restart the server after making changes.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}