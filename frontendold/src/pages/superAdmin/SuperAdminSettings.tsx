
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Settings,
  Save,
  Loader2,
  Palette,
  Globe,
  User,
  Shield,
  Server,
} from "lucide-react";
import toast from "react-hot-toast";

//////////////////////////////////////////////////////
// 🚀 SUPER ADMIN SETTINGS PAGE
//////////////////////////////////////////////////////

export default function SuperAdminSettings() {
  //////////////////////////////////////////////////////
  // STATE
  //////////////////////////////////////////////////////

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("platform");

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  });

  const [platform, setPlatform] = useState({
    appName: "",
    tagline: "",
    primaryColor: "#4f46e5",
    logoUrl: "",
    faviconUrl: "",
  });

  const [systemConfig, setSystemConfig] = useState({
    razorpayKeyId: "",
    smtpHost: "",
    smtpPort: "",
    smtpEmail: "",
    baseUrl: "",
  });

  //////////////////////////////////////////////////////
  // FETCH SETTINGS
  //////////////////////////////////////////////////////

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/super-admin/settings",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res.data.data;
      if (data.profile) {
        setProfile((prev) => ({
          ...prev,
          name: data.profile.name || "",
          email: data.profile.email || "",
        }));
      }
      if (data.platform) {
        setPlatform({
          appName: data.platform.appName || "",
          tagline: data.platform.tagline || "",
          primaryColor: data.platform.primaryColor || "#4f46e5",
          logoUrl: data.platform.logoUrl || "",
          faviconUrl: data.platform.faviconUrl || "",
        });
      }
      if (data.systemConfig) {
        setSystemConfig(data.systemConfig);
      }
    } catch (err: any) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  //////////////////////////////////////////////////////
  // UPDATE PLATFORM
  //////////////////////////////////////////////////////

  const handleUpdatePlatform = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/super-admin/settings/platform",
        platform,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Platform settings updated! 🎉");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  //////////////////////////////////////////////////////
  // UPDATE PROFILE
  //////////////////////////////////////////////////////

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/super-admin/settings/profile",
        profile,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Profile updated! ✅");
      setProfile((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  //////////////////////////////////////////////////////
  // LOADING
  //////////////////////////////////////////////////////

  if (loading) {
    return (
      <div className="p-10 text-gray-500 text-lg">Loading Settings...</div>
    );
  }

  //////////////////////////////////////////////////////
  // TABS
  //////////////////////////////////////////////////////

  const tabs = [
    { id: "platform", label: "Platform", icon: <Globe size={18} /> },
    { id: "profile", label: "Profile", icon: <User size={18} /> },
    { id: "system", label: "System Config", icon: <Server size={18} /> },
  ];

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////

  return (
    <div className="p-6 md:p-8 bg-slate-100 min-h-screen">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Settings size={28} className="text-indigo-600" />
          Super Admin Settings
        </h1>
        <p className="text-slate-500 mt-1">
          Manage platform, profile, and system configuration
        </p>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-6">
        {/* ////////////////////////////////////////////////////// */}
        {/* PLATFORM TAB */}
        {/* ////////////////////////////////////////////////////// */}

        {activeTab === "platform" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Palette size={22} className="text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-800">
                Platform Settings
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  App Name
                </label>
                <input
                  type="text"
                  value={platform.appName}
                  onChange={(e) =>
                    setPlatform({ ...platform, appName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={platform.tagline}
                  onChange={(e) =>
                    setPlatform({ ...platform, tagline: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={platform.primaryColor}
                    onChange={(e) =>
                      setPlatform({ ...platform, primaryColor: e.target.value })
                    }
                    className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={platform.primaryColor}
                    onChange={(e) =>
                      setPlatform({ ...platform, primaryColor: e.target.value })
                    }
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="text"
                  value={platform.logoUrl}
                  onChange={(e) =>
                    setPlatform({ ...platform, logoUrl: e.target.value })
                  }
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleUpdatePlatform}
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Save Platform Settings
            </button>
          </div>
        )}

        {/* ////////////////////////////////////////////////////// */}
        {/* PROFILE TAB */}
        {/* ////////////////////////////////////////////////////// */}

        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={22} className="text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-800">
                Admin Profile
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={profile.currentPassword}
                  onChange={(e) =>
                    setProfile({ ...profile, currentPassword: e.target.value })
                  }
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={profile.newPassword}
                  onChange={(e) =>
                    setProfile({ ...profile, newPassword: e.target.value })
                  }
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleUpdateProfile}
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Update Profile
            </button>
          </div>
        )}

        {/* ////////////////////////////////////////////////////// */}
        {/* SYSTEM CONFIG TAB */}
        {/* ////////////////////////////////////////////////////// */}

        {activeTab === "system" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Server size={22} className="text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-800">
                System Configuration
              </h2>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-amber-700 text-sm">
                ⚠️ These values are read from environment variables (.env file).
                To change them, update your .env and restart the server.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Razorpay Key
                </label>
                <input
                  type="text"
                  value={systemConfig.razorpayKeyId}
                  disabled
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={systemConfig.smtpHost}
                  disabled
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  SMTP Port
                </label>
                <input
                  type="text"
                  value={systemConfig.smtpPort}
                  disabled
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  SMTP Email
                </label>
                <input
                  type="text"
                  value={systemConfig.smtpEmail}
                  disabled
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Base URL
                </label>
                <input
                  type="text"
                  value={systemConfig.baseUrl}
                  disabled
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

