
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Settings,
  Save,
  Loader2,
  School,
  User,
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Upload,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import PermissionManager from "./PermissionManager";

//////////////////////////////////////////////////////
// 🏫 TENANT ADMIN SETTINGS PAGE
// Tab 1: School Info (branding + logo/bg upload)
// Tab 2: Profile (name, email, password change)
// Tab 3: User Management (create/edit/delete users role-wise)
//////////////////////////////////////////////////////

export default function TenantAdminSettings() {
  //////////////////////////////////////////////////////
  // STATE
  //////////////////////////////////////////////////////

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("school");

  // School Info state
  const [schoolInfo, setSchoolInfo] = useState({
    name: "",
    logoUrl: "",
    backgroundUrl: "",
    address: "",
    phone: "",
    email: "",
  });

  // Profile state
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    currentPwd: "",
    newPwd: "",
  });

  // Usage stats
  const [usage, setUsage] = useState<any>(null);

  // User Management state
  const [users, setUsers] = useState<any[]>([]);
  const [userPagination, setUserPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Dialog state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Permission Manager state
  const [showPermissionPanel, setShowPermissionPanel] = useState(false);
  const [permissionUser, setPermissionUser] = useState<any>(null);

  // Create user form
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    autoGenerate: true,
    pwd: "",
  });
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    pwd: string;
  } | null>(null);

  // Edit user form
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    status: "",
  });

  // Password visibility
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  //////////////////////////////////////////////////////
  // FETCH SETTINGS (School Info + Profile + Usage)
  //////////////////////////////////////////////////////

  const fetchSettings = async () => {
    try {
      const res = await axios.get("/api/settings", {
        headers,
      });
      const data = res.data.data;

      if (data.tenant) {
        setSchoolInfo({
          name: data.tenant.name || "",
          logoUrl: data.tenant.logoUrl || "",
          backgroundUrl: data.tenant.backgroundUrl || "",
          address: data.tenant.address || "",
          phone: data.tenant.phone || "",
          email: data.tenant.email || "",
        });
      }

      if (data.profile) {
        setProfile((prev) => ({
          ...prev,
          name: data.profile.name || "",
          email: data.profile.email || "",
        }));
      }

      if (data.usage) {
        setUsage(data.usage);
      }
    } catch (err: any) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  //////////////////////////////////////////////////////
  // FETCH USERS
  //////////////////////////////////////////////////////

  const fetchUsers = async (page = 1) => {
    try {
      setUsersLoading(true);
      const params: any = { page, limit: 10 };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (roleFilter !== "ALL") params.role = roleFilter;
      if (statusFilter !== "ALL") params.status = statusFilter;

      const res = await axios.get("/api/settings/users", {
        headers,
        params,
      });

      setUsers(res.data.data || []);
      setUserPagination(
        res.data.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 }
      );
    } catch (err: any) {
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  //////////////////////////////////////////////////////
  // EFFECTS
  //////////////////////////////////////////////////////

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers(1);
    }
  }, [activeTab, roleFilter, statusFilter]);

  // Search debounce
  useEffect(() => {
    if (activeTab !== "users") return;
    const timeout = setTimeout(() => fetchUsers(1), 500);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  //////////////////////////////////////////////////////
  // FILE UPLOAD HANDLER (Logo + Background)
  //////////////////////////////////////////////////////

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "background"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size check
    const maxSize = type === "logo" ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large! Max ${type === "logo" ? "2MB" : "5MB"}`);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      toast.loading("Uploading...", { id: "upload" });
      const res = await axios.post(
        "/api/settings/upload",
        formData,
        {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadedUrl = res.data.data.url;

      if (type === "logo") {
        setSchoolInfo({ ...schoolInfo, logoUrl: uploadedUrl });
      } else {
        setSchoolInfo({ ...schoolInfo, backgroundUrl: uploadedUrl });
      }

      toast.success(
        `${type === "logo" ? "Logo" : "Background"} uploaded! ✅`,
        { id: "upload" }
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed", {
        id: "upload",
      });
    }
  };

  //////////////////////////////////////////////////////
  // UPDATE SCHOOL INFO
  //////////////////////////////////////////////////////

  const handleUpdateSchoolInfo = async () => {
    setSaving(true);
    try {
      await axios.put("/api/settings", schoolInfo, {
        headers,
      });
      toast.success("School info updated! 🏫");
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
      const payload: any = { name: profile.name, email: profile.email };
      if (profile.newPwd) {
        payload.currentPassword = profile.currentPwd;
        payload.newPassword = profile.newPwd;
      }

      await axios.put(
        "/api/settings/profile",
        payload,
        { headers }
      );
      toast.success("Profile updated! ✅");
      setProfile((prev) => ({
        ...prev,
        currentPwd: "",
        newPwd: "",
      }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  //////////////////////////////////////////////////////
  // CREATE USER
  //////////////////////////////////////////////////////

  const handleCreateUser = async () => {
    if (!createForm.name || !createForm.email || !createForm.role) {
      toast.error("Name, Email aur Role required hain");
      return;
    }
    if (!createForm.autoGenerate && createForm.pwd.length < 6) {
      toast.error("Password minimum 6 characters hona chahiye");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: createForm.name.trim(),
        email: createForm.email.trim().toLowerCase(),
        phone: createForm.phone.trim() || undefined,
        role: createForm.role,
      };
      if (!createForm.autoGenerate && createForm.pwd) {
        payload["password"] = createForm.pwd;
      }

      const res = await axios.post(
        "/api/settings/users",
        payload,
        { headers }
      );

      if (res.data.generatedPassword) {
        setCreatedCredentials({
          email: createForm.email.trim().toLowerCase(),
          pwd: res.data.generatedPassword,
        });
      } else {
        toast.success("User created successfully! ✅");
        setShowCreateModal(false);
        resetCreateForm();
      }

      fetchUsers(1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  //////////////////////////////////////////////////////
  // UPDATE USER
  //////////////////////////////////////////////////////

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await axios.put(
        `/api/settings/users/${selectedUser.id}`,
        editForm,
        { headers }
      );
      toast.success("User updated! ✅");
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers(userPagination.page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  //////////////////////////////////////////////////////
  // DELETE USER
  //////////////////////////////////////////////////////

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await axios.delete(
        `/api/settings/users/${selectedUser.id}`,
        { headers }
      );
      toast.success("User deactivated! 🗑️");
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      fetchUsers(userPagination.page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    } finally {
      setSaving(false);
    }
  };

  //////////////////////////////////////////////////////
  // HELPERS
  //////////////////////////////////////////////////////

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      email: "",
      phone: "",
      role: "",
      autoGenerate: true,
      pwd: "",
    });
    setCreatedCredentials(null);
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "",
      status: user.status || "ACTIVE",
    });
    setShowEditModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard! 📋");
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "PRINCIPAL":
        return "bg-purple-100 text-purple-700";
      case "TEACHER":
        return "bg-primary-100 text-primary-700";
      case "STUDENT":
        return "bg-green-100 text-green-700";
      case "STAFF":
        return "bg-orange-100 text-orange-700";
      case "ADMIN":
        return "bg-primary-100 text-primary-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  //////////////////////////////////////////////////////
  // LOADING
  //////////////////////////////////////////////////////

  if (loading) {
    return (
      <div className="p-10 flex items-center gap-3 text-gray-500 text-lg">
        <Loader2 className="animate-spin" size={24} />
        Loading Settings...
      </div>
    );
  }

  //////////////////////////////////////////////////////
  // TABS
  //////////////////////////////////////////////////////

  const tabs = [
    { id: "school", label: "School Info", icon: <School size={18} /> },
    { id: "profile", label: "Profile", icon: <User size={18} /> },
    { id: "users", label: "User Management", icon: <Users size={18} /> },
  ];

  //////////////////////////////////////////////////////
  // RENDER
  //////////////////////////////////////////////////////

  return (
    <div className="p-6 md:p-8 bg-slate-100 min-h-screen">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Settings size={28} className="text-primary-600" />
          Settings
        </h1>
        <p className="text-slate-500 mt-1">
          School info, profile, aur users manage karo
        </p>

        {/* Usage Stats Bar */}
        {usage && (
          <div className="flex gap-4 mt-4 flex-wrap">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm">
              <span className="text-slate-500">Students:</span>{" "}
              <span className="font-bold text-primary-600">
                {usage.students.used}/{usage.students.max}
              </span>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm">
              <span className="text-slate-500">Teachers:</span>{" "}
              <span className="font-bold text-primary-600">
                {usage.teachers.used}/{usage.teachers.max}
              </span>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm">
              <span className="text-slate-500">Users:</span>{" "}
              <span className="font-bold text-primary-600">
                {usage.admins.used}/{usage.admins.max}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${
              activeTab === tab.id
                ? "bg-primary-600 text-white shadow-lg"
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
        {/* ============================== */}
        {/* SCHOOL INFO TAB */}
        {/* ============================== */}

        {activeTab === "school" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <School size={22} className="text-primary-600" />
              <h2 className="text-xl font-bold text-slate-800">
                School Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  School Name
                </label>
                <input
                  type="text"
                  value={schoolInfo.name}
                  onChange={(e) =>
                    setSchoolInfo({ ...schoolInfo, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={schoolInfo.email}
                  onChange={(e) =>
                    setSchoolInfo({ ...schoolInfo, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={schoolInfo.phone}
                  onChange={(e) =>
                    setSchoolInfo({ ...schoolInfo, phone: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={schoolInfo.address}
                  onChange={(e) =>
                    setSchoolInfo({ ...schoolInfo, address: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  School Logo
                </label>
                <div className="flex items-center gap-4">
                  {schoolInfo.logoUrl && (
                    <img
                      src={
                        schoolInfo.logoUrl.startsWith("http")
                          ? schoolInfo.logoUrl
                          : `${schoolInfo.logoUrl}`
                      }
                      alt="Logo"
                      className="w-16 h-16 object-contain rounded-xl border border-slate-200"
                    />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      id="logo-upload"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "logo")}
                    />
                    <label
                      htmlFor="logo-upload"
                      className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 text-sm font-medium text-slate-600"
                    >
                      <Upload size={16} />
                      {schoolInfo.logoUrl ? "Change Logo" : "Upload Logo"}
                    </label>
                    <p className="text-xs text-slate-400 mt-1">
                      PNG, JPG (max 2MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Background Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Background Image
                </label>
                <div className="flex items-center gap-4">
                  {schoolInfo.backgroundUrl && (
                    <img
                      src={
                        schoolInfo.backgroundUrl.startsWith("http")
                          ? schoolInfo.backgroundUrl
                          : `${schoolInfo.backgroundUrl}`
                      }
                      alt="Background"
                      className="w-24 h-16 object-cover rounded-xl border border-slate-200"
                    />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      id="bg-upload"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "background")}
                    />
                    <label
                      htmlFor="bg-upload"
                      className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 text-sm font-medium text-slate-600"
                    >
                      <Upload size={16} />
                      {schoolInfo.backgroundUrl
                        ? "Change Background"
                        : "Upload Background"}
                    </label>
                    <p className="text-xs text-slate-400 mt-1">
                      PNG, JPG (max 5MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleUpdateSchoolInfo}
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Save School Info
            </button>
          </div>
        )}

        {/* ============================== */}
        {/* PROFILE TAB */}
        {/* ============================== */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <User size={22} className="text-primary-600" />
              <h2 className="text-xl font-bold text-slate-800">My Profile</h2>
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
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
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
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPwd ? "text" : "password"}
                    value={profile.currentPwd}
                    onChange={(e) =>
                      setProfile({ ...profile, currentPwd: e.target.value })
                    }
                    placeholder="Enter current password"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPwd ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPwd ? "text" : "password"}
                    value={profile.newPwd}
                    onChange={(e) =>
                      setProfile({ ...profile, newPwd: e.target.value })
                    }
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleUpdateProfile}
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all disabled:opacity-50"
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

        {/* ============================== */}
        {/* USER MANAGEMENT TAB */}
        {/* ============================== */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Header + Add Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <Users size={22} className="text-primary-600" />
                <h2 className="text-xl font-bold text-slate-800">
                  User Management
                </h2>
              </div>
              <button
                onClick={() => {
                  resetCreateForm();
                  setShowCreateModal(true);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all text-sm"
              >
                <Plus size={16} />
                Add User
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white"
              >
                <option value="ALL">All Roles</option>
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="STAFF">Staff</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <button
                onClick={() => fetchUsers(userPagination.page)}
                className="p-2.5 border border-slate-300 rounded-xl hover:bg-slate-50"
                title="Refresh"
              >
                <RefreshCw size={18} className="text-slate-500" />
              </button>
            </div>

            {/* Users Table */}
            {usersLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 size={24} className="animate-spin mr-2" />
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-lg">Koi users nahi mile</p>
                <p className="text-sm">
                  Filters change karo ya naya user add karo
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">
                          Name
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">
                          Email
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">
                          Phone
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">
                          Role
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">
                          Status
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {user.name}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {user.email}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {user.phone || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getRoleBadgeColor(
                                user.role
                              )}`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                                user.status === "ACTIVE"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {user.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(user)}
                                className="p-2 hover:bg-primary-50 rounded-lg text-primary-600"
                                title="Edit"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setPermissionUser(user);
                                  setShowPermissionPanel(true);
                                }}
                                className="p-2 hover:bg-amber-50 rounded-lg text-amber-600"
                                title="Permissions"
                              >
                                <Shield size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDeleteConfirm(true);
                                }}
                                className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                                title="Deactivate"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-slate-500">
                    Showing{" "}
                    {(userPagination.page - 1) * userPagination.limit + 1} to{" "}
                    {Math.min(
                      userPagination.page * userPagination.limit,
                      userPagination.total
                    )}{" "}
                    of {userPagination.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchUsers(userPagination.page - 1)}
                      disabled={userPagination.page <= 1}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-1"
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <span className="text-sm font-medium px-2">
                      {userPagination.page} / {userPagination.totalPages}
                    </span>
                    <button
                      onClick={() => fetchUsers(userPagination.page + 1)}
                      disabled={
                        userPagination.page >= userPagination.totalPages
                      }
                      className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-1"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ============================== */}
      {/* CREATE USER MODAL */}
      {/* ============================== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6">
              {!createdCredentials ? (
                <>
                  {/* Create Form */}
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Plus size={20} className="text-primary-600" />
                      Create New User
                    </h3>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="p-1 hover:bg-slate-100 rounded-lg"
                    >
                      <X size={20} className="text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={createForm.name}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, name: e.target.value })
                        }
                        placeholder="Enter full name"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={createForm.email}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            email: e.target.value,
                          })
                        }
                        placeholder="Enter email"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={createForm.phone}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            phone: e.target.value,
                          })
                        }
                        placeholder="Enter phone (optional)"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Role *
                      </label>
                      <select
                        value={createForm.role}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, role: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                      >
                        <option value="">Select Role</option>
                        <option value="STUDENT">Student</option>
                        <option value="TEACHER">Teacher</option>
                        <option value="PRINCIPAL">Principal</option>
                        <option value="STAFF">Other Staff</option>
                      </select>
                    </div>

                    {/* Auto-generate toggle */}
                    <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          Auto-generate password
                        </p>
                        <p className="text-xs text-slate-400">
                          System random password create karega
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createForm.autoGenerate}
                          onChange={(e) =>
                            setCreateForm({
                              ...createForm,
                              autoGenerate: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    {!createForm.autoGenerate && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          value={createForm.pwd}
                          onChange={(e) =>
                            setCreateForm({
                              ...createForm,
                              pwd: e.target.value,
                            })
                          }
                          placeholder="Min 6 characters"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateUser}
                      disabled={saving}
                      className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Plus size={16} />
                      )}
                      Create User
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Success — Show generated credentials */}
                  <div className="text-center py-4">
                    <CheckCircle
                      size={48}
                      className="text-green-500 mx-auto mb-3"
                    />
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                      User Created Successfully!
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Yeh credentials user ko share karo (sirf ek baar dikhega)
                    </p>

                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-left space-y-3">
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="font-mono text-sm">
                          {createdCredentials.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Password</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm font-bold bg-white px-3 py-1.5 rounded-lg border">
                            {createdCredentials.pwd}
                          </p>
                          <button
                            onClick={() =>
                              copyToClipboard(createdCredentials.pwd)
                            }
                            className="p-2 hover:bg-green-100 rounded-lg text-green-600"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-amber-600 font-medium mt-3">
                      ⚠️ Yeh password dobara nahi dikhega. Abhi copy kar lo!
                    </p>

                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        resetCreateForm();
                      }}
                      className="mt-4 px-6 py-2.5 bg-primary-600 text-white rounded-xl font-medium"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================== */}
      {/* EDIT USER MODAL */}
      {/* ============================== */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Pencil size={20} className="text-primary-600" />
                  Edit User
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="PRINCIPAL">Principal</option>
                    <option value="STAFF">Other Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Update User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================== */}
      {/* DELETE CONFIRM MODAL */}
      {/* ============================== */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                User Deactivate karna hai?
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                <strong>{selectedUser.name}</strong> ({selectedUser.email}) ko
                deactivate kar diya jayega. Yeh user login nahi kar payega. Baad
                mein wapas activate kar sakte ho.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={saving}
                  className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Yes, Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permission Manager Slide-over */}
      {showPermissionPanel && permissionUser && (
        <PermissionManager
          user={permissionUser}
          onClose={() => {
            setShowPermissionPanel(false);
            setPermissionUser(null);
          }}
        />
      )}
    </div>
  );
}

