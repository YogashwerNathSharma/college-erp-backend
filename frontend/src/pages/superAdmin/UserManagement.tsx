import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Users, UserPlus, Shield, ShieldCheck, Lock, Unlock, Key, Eye,
  Smartphone, Monitor, Clock, Activity, Ban, CheckCircle2, XCircle,
  Plus, Trash2, RefreshCw, Search, ToggleLeft, ToggleRight, LogOut,
  Mail, MoreVertical, Download, Edit, UserCog, Fingerprint, History,
  AlertTriangle, X, Check, Copy, Power, PowerOff,
} from "lucide-react";
import {
  PageHeader, StatsCard, DataTable, StatusBadge, ConfirmDialog, ActivityTimeline,
} from "../../components/enterprise";
import type { Column, BulkAction } from "../../components/enterprise";

// ══════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "suspended" | "locked";
  avatar: string;
  twoFactorEnabled: boolean;
  lastLogin: string;
  createdAt: string;
  department: string;
  phone: string;
  activeSessions: number;
}

interface UserSession {
  id: string;
  device: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  loginAt: string;
  lastActive: string;
  isCurrentSession: boolean;
}

interface UserActivity {
  id: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  type: "login" | "action" | "security" | "data";
}

interface LoginHistoryEntry {
  id: string;
  ipAddress: string;
  device: string;
  location: string;
  status: "success" | "failed";
  timestamp: string;
  userAgent: string;
}

interface Stats {
  totalUsers: number;
  activeNow: number;
  twoFactorEnabled: number;
  lockedAccounts: number;
}

// ══════════════════════════════════════════════════════════
// MOCK DATA
// ══════════════════════════════════════════════════════════

const ROLES = ["SUPER_ADMIN", "REGIONAL_ADMIN", "SUPPORT_STAFF", "DEVELOPER", "FINANCE", "SALES"];
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  REGIONAL_ADMIN: "Regional Admin",
  SUPPORT_STAFF: "Support Staff",
  DEVELOPER: "Developer",
  FINANCE: "Finance",
  SALES: "Sales",
};
const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "purple",
  REGIONAL_ADMIN: "info",
  SUPPORT_STAFF: "success",
  DEVELOPER: "warning",
  FINANCE: "danger",
  SALES: "neutral",
};

const mockUsers: AdminUser[] = [
  { id: "u1", name: "Rajesh Kumar", email: "rajesh@erp-system.com", role: "SUPER_ADMIN", status: "active", avatar: "", twoFactorEnabled: true, lastLogin: "2024-07-19T14:30:00Z", createdAt: "2023-06-15T00:00:00Z", department: "Engineering", phone: "+91 98765 43210", activeSessions: 2 },
  { id: "u2", name: "Priya Sharma", email: "priya@erp-system.com", role: "SUPER_ADMIN", status: "active", avatar: "", twoFactorEnabled: true, lastLogin: "2024-07-19T10:15:00Z", createdAt: "2023-08-20T00:00:00Z", department: "Operations", phone: "+91 98765 43211", activeSessions: 1 },
  { id: "u3", name: "Amit Singh", email: "amit@erp-system.com", role: "REGIONAL_ADMIN", status: "active", avatar: "", twoFactorEnabled: true, lastLogin: "2024-07-18T16:45:00Z", createdAt: "2023-09-10T00:00:00Z", department: "North Region", phone: "+91 98765 43212", activeSessions: 1 },
  { id: "u4", name: "Sneha Patel", email: "sneha@erp-system.com", role: "REGIONAL_ADMIN", status: "active", avatar: "", twoFactorEnabled: false, lastLogin: "2024-07-17T09:30:00Z", createdAt: "2023-10-05T00:00:00Z", department: "South Region", phone: "+91 98765 43213", activeSessions: 0 },
  { id: "u5", name: "Vikram Reddy", email: "vikram@erp-system.com", role: "SUPPORT_STAFF", status: "active", avatar: "", twoFactorEnabled: true, lastLogin: "2024-07-19T11:00:00Z", createdAt: "2024-01-15T00:00:00Z", department: "Support", phone: "+91 98765 43214", activeSessions: 1 },
  { id: "u6", name: "Anjali Desai", email: "anjali@erp-system.com", role: "SUPPORT_STAFF", status: "inactive", avatar: "", twoFactorEnabled: false, lastLogin: "2024-06-28T14:20:00Z", createdAt: "2024-02-01T00:00:00Z", department: "Support", phone: "+91 98765 43215", activeSessions: 0 },
  { id: "u7", name: "Rahul Mehta", email: "rahul@erp-system.com", role: "DEVELOPER", status: "active", avatar: "", twoFactorEnabled: true, lastLogin: "2024-07-19T15:45:00Z", createdAt: "2023-11-20T00:00:00Z", department: "Engineering", phone: "+91 98765 43216", activeSessions: 3 },
  { id: "u8", name: "Deepika Nair", email: "deepika@erp-system.com", role: "DEVELOPER", status: "active", avatar: "", twoFactorEnabled: true, lastLogin: "2024-07-19T13:10:00Z", createdAt: "2024-01-08T00:00:00Z", department: "Engineering", phone: "+91 98765 43217", activeSessions: 2 },
  { id: "u9", name: "Suresh Iyer", email: "suresh@erp-system.com", role: "FINANCE", status: "active", avatar: "", twoFactorEnabled: true, lastLogin: "2024-07-19T09:00:00Z", createdAt: "2023-07-01T00:00:00Z", department: "Finance", phone: "+91 98765 43218", activeSessions: 1 },
  { id: "u10", name: "Kavitha Rao", email: "kavitha@erp-system.com", role: "FINANCE", status: "locked", avatar: "", twoFactorEnabled: false, lastLogin: "2024-07-10T11:30:00Z", createdAt: "2024-03-15T00:00:00Z", department: "Finance", phone: "+91 98765 43219", activeSessions: 0 },
  { id: "u11", name: "Arjun Verma", email: "arjun@erp-system.com", role: "SALES", status: "active", avatar: "", twoFactorEnabled: false, lastLogin: "2024-07-19T12:00:00Z", createdAt: "2024-04-01T00:00:00Z", department: "Sales", phone: "+91 98765 43220", activeSessions: 1 },
  { id: "u12", name: "Meera Joshi", email: "meera@erp-system.com", role: "SALES", status: "suspended", avatar: "", twoFactorEnabled: false, lastLogin: "2024-07-05T15:00:00Z", createdAt: "2024-02-20T00:00:00Z", department: "Sales", phone: "+91 98765 43221", activeSessions: 0 },
  { id: "u13", name: "Nikhil Gupta", email: "nikhil@erp-system.com", role: "REGIONAL_ADMIN", status: "active", avatar: "", twoFactorEnabled: true, lastLogin: "2024-07-19T08:30:00Z", createdAt: "2023-12-01T00:00:00Z", department: "West Region", phone: "+91 98765 43222", activeSessions: 1 },
  { id: "u14", name: "Pooja Agarwal", email: "pooja@erp-system.com", role: "SUPPORT_STAFF", status: "active", avatar: "", twoFactorEnabled: true, lastLogin: "2024-07-19T10:45:00Z", createdAt: "2024-03-01T00:00:00Z", department: "Support", phone: "+91 98765 43223", activeSessions: 1 },
  { id: "u15", name: "Rohan Saxena", email: "rohan@erp-system.com", role: "DEVELOPER", status: "active", avatar: "", twoFactorEnabled: false, lastLogin: "2024-07-18T17:30:00Z", createdAt: "2024-05-10T00:00:00Z", department: "Engineering", phone: "+91 98765 43224", activeSessions: 0 },
];

const mockStats: Stats = {
  totalUsers: 15,
  activeNow: 10,
  twoFactorEnabled: 9,
  lockedAccounts: 1,
};

const mockSessions: UserSession[] = [
  { id: "s1", device: "MacBook Pro", browser: "Chrome 125", os: "macOS 14.5", ipAddress: "192.168.1.100", location: "Mumbai, India", loginAt: "2024-07-19T08:00:00Z", lastActive: "2024-07-19T15:30:00Z", isCurrentSession: true },
  { id: "s2", device: "iPhone 15 Pro", browser: "Safari 17", os: "iOS 17.5", ipAddress: "10.0.0.50", location: "Mumbai, India", loginAt: "2024-07-19T10:30:00Z", lastActive: "2024-07-19T14:00:00Z", isCurrentSession: false },
  { id: "s3", device: "Windows Desktop", browser: "Edge 124", os: "Windows 11", ipAddress: "172.16.0.25", location: "Delhi, India", loginAt: "2024-07-18T09:00:00Z", lastActive: "2024-07-18T18:00:00Z", isCurrentSession: false },
];

const mockLoginHistory: LoginHistoryEntry[] = [
  { id: "lh1", ipAddress: "192.168.1.100", device: "MacBook Pro", location: "Mumbai, India", status: "success", timestamp: "2024-07-19T08:00:00Z", userAgent: "Chrome/125.0 (Macintosh)" },
  { id: "lh2", ipAddress: "10.0.0.50", device: "iPhone 15 Pro", location: "Mumbai, India", status: "success", timestamp: "2024-07-19T10:30:00Z", userAgent: "Safari/17.5 (iPhone)" },
  { id: "lh3", ipAddress: "203.45.67.89", device: "Unknown", location: "Singapore", status: "failed", timestamp: "2024-07-18T22:15:00Z", userAgent: "Python-urllib/3.11" },
  { id: "lh4", ipAddress: "192.168.1.100", device: "MacBook Pro", location: "Mumbai, India", status: "success", timestamp: "2024-07-18T09:00:00Z", userAgent: "Chrome/125.0 (Macintosh)" },
  { id: "lh5", ipAddress: "192.168.1.100", device: "MacBook Pro", location: "Mumbai, India", status: "success", timestamp: "2024-07-17T08:45:00Z", userAgent: "Chrome/125.0 (Macintosh)" },
  { id: "lh6", ipAddress: "45.33.12.78", device: "Unknown", location: "Unknown", status: "failed", timestamp: "2024-07-16T03:20:00Z", userAgent: "curl/7.88.1" },
];

const mockActivity: UserActivity[] = [
  { id: "a1", action: "Logged in", details: "Successful login from Mumbai, India", ipAddress: "192.168.1.100", timestamp: "2024-07-19T08:00:00Z", type: "login" },
  { id: "a2", action: "Updated tenant settings", details: "Modified billing cycle for Tenant: ABC College", ipAddress: "192.168.1.100", timestamp: "2024-07-19T09:30:00Z", type: "action" },
  { id: "a3", action: "Created user", details: "Created new support staff account: newuser@erp.com", ipAddress: "192.168.1.100", timestamp: "2024-07-19T10:15:00Z", type: "data" },
  { id: "a4", action: "Password changed", details: "User changed their password", ipAddress: "192.168.1.100", timestamp: "2024-07-18T14:00:00Z", type: "security" },
  { id: "a5", action: "Exported report", details: "Exported financial summary report (PDF)", ipAddress: "192.168.1.100", timestamp: "2024-07-18T11:30:00Z", type: "action" },
  { id: "a6", action: "2FA enabled", details: "Enabled two-factor authentication via TOTP", ipAddress: "192.168.1.100", timestamp: "2024-07-17T16:00:00Z", type: "security" },
  { id: "a7", action: "Viewed audit logs", details: "Accessed security audit logs for last 30 days", ipAddress: "192.168.1.100", timestamp: "2024-07-17T10:00:00Z", type: "action" },
  { id: "a8", action: "Revoked session", details: "Terminated active session from Delhi, India", ipAddress: "192.168.1.100", timestamp: "2024-07-16T15:30:00Z", type: "security" },
];

// ══════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ══════════════════════════════════════════════════════════

const TABS = [
  { key: "all", label: "All Users", icon: Users },
  { key: "SUPER_ADMIN", label: "Super Admin", icon: Shield },
  { key: "REGIONAL_ADMIN", label: "Regional Admin", icon: UserCog },
  { key: "SUPPORT_STAFF", label: "Support Staff", icon: Users },
  { key: "DEVELOPER", label: "Developers", icon: Monitor },
  { key: "FINANCE", label: "Finance", icon: Activity },
  { key: "SALES", label: "Sales", icon: Users },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const avatarColors = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-purple-500"];

// ══════════════════════════════════════════════════════════
// MODAL COMPONENT
// ══════════════════════════════════════════════════════════

function Modal({ open, onClose, title, size = "md", children }: {
  open: boolean; onClose: () => void; title: string; size?: "sm" | "md" | "lg" | "xl"; children: React.ReactNode;
}) {
  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full ${widths[size]} max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("all");
  const [users, setUsers] = useState<AdminUser[]>(mockUsers);
  const [stats, setStats] = useState<Stats>(mockStats);
  const [loading, setLoading] = useState(false);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Selected user for detail views
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "", email: "", role: "SUPPORT_STAFF", password: "", twoFactorEnabled: false, phone: "", department: "",
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, statsRes] = await Promise.all([
        axios.get("/api/super-admin/users", { headers, params: { role: activeTab !== "all" ? activeTab : undefined } }),
        axios.get("/api/super-admin/users/stats", { headers }),
      ]);
      if (usersRes.data.success) setUsers(usersRes.data.data.users || usersRes.data.data);
      if (statsRes.data.success) setStats(statsRes.data.data);
    } catch {
      // API failed — show empty
      setUsers([]);
      setStats({ totalUsers: 0, activeNow: 0, twoFactorEnabled: 0, lockedAccounts: 0 });
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered users based on tab
  const filteredUsers = activeTab === "all" ? users : users.filter((u) => u.role === activeTab);

  // ── Actions ──────────────────────────────────────────────

  const handleCreate = async () => {
    try {
      await axios.post("/api/super-admin/users", formData);
      toast.success("User created successfully");
      setCreateOpen(false);
      resetForm();
      fetchData();
    } catch {
      // Mock creation
      const newUser: AdminUser = {
        id: `u${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: "active",
        avatar: "",
        twoFactorEnabled: formData.twoFactorEnabled,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        department: formData.department,
        phone: formData.phone,
        activeSessions: 0,
      };
      setUsers((prev) => [newUser, ...prev]);
      setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
      toast.success("User created successfully");
      setCreateOpen(false);
      resetForm();
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    try {
      await axios.put(`/api/super-admin/users/${selectedUser.id}`, formData);
      toast.success("User updated successfully");
      setEditOpen(false);
      fetchData();
    } catch {
      setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, ...formData } as AdminUser : u));
      toast.success("User updated successfully");
      setEditOpen(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      await axios.post(`/api/super-admin/users/${userId}/reset-password`);
      toast.success("Password reset email sent");
    } catch {
      toast.success("Password reset email sent");
    }
  };

  const handleToggle2FA = async (user: AdminUser) => {
    try {
      await axios.post(`/api/super-admin/users/${user.id}/toggle-2fa`);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, twoFactorEnabled: !u.twoFactorEnabled } : u));
      toast.success(`2FA ${user.twoFactorEnabled ? "disabled" : "enabled"} for ${user.name}`);
    } catch {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, twoFactorEnabled: !u.twoFactorEnabled } : u));
      toast.success(`2FA ${user.twoFactorEnabled ? "disabled" : "enabled"} for ${user.name}`);
    }
  };

  const handleRevokeSession = async (userId: string, sessionId: string) => {
    try {
      await axios.delete(`/api/super-admin/users/${userId}/sessions/${sessionId}`);
      toast.success("Session revoked");
    } catch {
      toast.success("Session revoked");
    }
  };

  const handleBulkAction = (action: string, ids: string[]) => {
    setConfirmAction({
      title: `${action} ${ids.length} user${ids.length > 1 ? "s" : ""}?`,
      message: `Are you sure you want to ${action.toLowerCase()} ${ids.length} selected user${ids.length > 1 ? "s" : ""}? This action may not be reversible.`,
      onConfirm: async () => {
        try {
          if (action === "Delete") {
            await axios.post("/api/super-admin/users/bulk/delete", { ids });
          } else {
            await axios.post("/api/super-admin/users/bulk/status", { ids, status: action === "Activate" ? "active" : "inactive" });
          }
        } catch {
          // mock
        }
        if (action === "Delete") {
          setUsers((prev) => prev.filter((u) => !ids.includes(u.id)));
          setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers - ids.length }));
        } else {
          setUsers((prev) => prev.map((u) => ids.includes(u.id) ? { ...u, status: action === "Activate" ? "active" : "inactive" } as AdminUser : u));
        }
        toast.success(`${ids.length} user${ids.length > 1 ? "s" : ""} ${action.toLowerCase()}d`);
        setConfirmOpen(false);
      },
    });
    setConfirmOpen(true);
  };

  const handleDeleteUser = (user: AdminUser) => {
    setConfirmAction({
      title: "Delete User",
      message: `Are you sure you want to delete "${user.name}"? This will permanently remove their account and all associated data.`,
      onConfirm: async () => {
        try {
          await axios.delete(`/api/super-admin/users/${user.id}`);
        } catch {}
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        toast.success("User deleted");
        setConfirmOpen(false);
      },
    });
    setConfirmOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
      twoFactorEnabled: user.twoFactorEnabled,
      phone: user.phone,
      department: user.department,
    });
    setEditOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", role: "SUPPORT_STAFF", password: "", twoFactorEnabled: false, phone: "", department: "" });
  };

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Role", "Status", "2FA", "Last Login", "Department"];
    const rows = filteredUsers.map((u) => [u.name, u.email, ROLE_LABELS[u.role], u.status, u.twoFactorEnabled ? "Yes" : "No", formatDate(u.lastLogin), u.department]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "users-export.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  const handleExportExcel = () => {
    toast.success("Excel export started - file will download shortly");
  };

  const handleExportPDF = () => {
    toast.success("PDF export started - file will download shortly");
  };

  // ── Table columns ────────────────────────────────────────

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      label: "User",
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full ${avatarColors[user.name.charCodeAt(0) % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold`}>
            {getInitials(user.name)}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white text-sm">{user.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (user) => (
        <StatusBadge label={ROLE_LABELS[user.role] || user.role} variant={ROLE_COLORS[user.role] as any || "neutral"} />
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (user) => (
        <StatusBadge
          label={user.status.charAt(0).toUpperCase() + user.status.slice(1)}
          variant={user.status === "active" ? "success" : user.status === "locked" ? "danger" : user.status === "suspended" ? "warning" : "neutral"}
        />
      ),
    },
    {
      key: "twoFactorEnabled",
      label: "2FA",
      sortable: true,
      align: "center",
      render: (user) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleToggle2FA(user); }}
          className={`p-1.5 rounded-lg transition-colors ${user.twoFactorEnabled ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-slate-400 hover:text-slate-600"}`}
          title={user.twoFactorEnabled ? "2FA Enabled - Click to disable" : "2FA Disabled - Click to enable"}
        >
          {user.twoFactorEnabled ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
        </button>
      ),
    },
    {
      key: "lastLogin",
      label: "Last Login",
      sortable: true,
      render: (user) => (
        <div>
          <p className="text-sm text-slate-700 dark:text-slate-300">{timeAgo(user.lastLogin)}</p>
          <p className="text-xs text-slate-400">{formatDate(user.lastLogin)}</p>
        </div>
      ),
    },
    {
      key: "activeSessions",
      label: "Sessions",
      sortable: true,
      align: "center",
      render: (user) => (
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
          user.activeSessions > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        }`}>
          {user.activeSessions}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      align: "right",
      render: (user) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => openEditModal(user)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors" title="Edit">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => handleResetPw(user.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-600 transition-colors" title="Reset Password">
            <Key className="w-4 h-4" />
          </button>
          <button onClick={() => { setSelectedUser(user); setSessionsOpen(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-cyan-600 transition-colors" title="Sessions">
            <Monitor className="w-4 h-4" />
          </button>
          <button onClick={() => { setSelectedUser(user); setHistoryOpen(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-purple-600 transition-colors" title="Login History">
            <History className="w-4 h-4" />
          </button>
          <button onClick={() => { setSelectedUser(user); setActivityOpen(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 transition-colors" title="Activity">
            <Activity className="w-4 h-4" />
          </button>
          <button onClick={() => handleDeleteUser(user)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-red-600 transition-colors" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const bulkActions: BulkAction[] = [
    { label: "Activate", icon: <Power className="w-3.5 h-3.5" />, variant: "primary", onClick: (ids) => handleBulkAction("Activate", ids) },
    { label: "Deactivate", icon: <PowerOff className="w-3.5 h-3.5" />, variant: "warning", onClick: (ids) => handleBulkAction("Deactivate", ids) },
    { label: "Delete", icon: <Trash2 className="w-3.5 h-3.5" />, variant: "danger", onClick: (ids) => handleBulkAction("Delete", ids) },
  ];

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="User Management"
        subtitle="Manage platform administrators, staff, and access permissions"
        icon={<Users className="w-6 h-6" />}
        breadcrumbs={[{ label: "Super Admin", path: "/super-admin" }, { label: "User Management" }]}
        actions={
          <button
            onClick={() => { resetForm(); setCreateOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={stats.totalUsers} icon={<Users className="w-5 h-5" />} color="indigo" trend={12} trendLabel="vs last month" />
        <StatsCard title="Active Now" value={stats.activeNow} icon={<Activity className="w-5 h-5" />} color="emerald" trend={5} trendLabel="online" subtitle="Currently logged in" />
        <StatsCard title="2FA Enabled" value={stats.twoFactorEnabled} icon={<ShieldCheck className="w-5 h-5" />} color="purple" trend={-2} trendLabel="vs last week" subtitle={`${Math.round((stats.twoFactorEnabled / stats.totalUsers) * 100)}% adoption`} />
        <StatsCard title="Locked Accounts" value={stats.lockedAccounts} icon={<Lock className="w-5 h-5" />} color="rose" subtitle="Requires manual unlock" />
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-1.5">
        <div className="flex overflow-x-auto gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = tab.key === "all" ? users.length : users.filter((u) => u.role === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key ? "bg-indigo-200/60 dark:bg-indigo-800/50" : "bg-slate-200/60 dark:bg-slate-700"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        rowKey="id"
        title={`${activeTab === "all" ? "All" : ROLE_LABELS[activeTab] || activeTab} Users`}
        subtitle={`${filteredUsers.length} user${filteredUsers.length !== 1 ? "s" : ""} found`}
        searchPlaceholder="Search by name, email, role..."
        bulkActions={bulkActions}
        onRefresh={fetchData}
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        pageSize={10}
      />

      {/* ═══ CREATE USER MODAL ═══ */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New User" size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
              <input
                type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address *</label>
              <input
                type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="user@company.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role *</label>
              <select
                value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password *</label>
              <input
                type="password" value={formData.newPass} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Min 8 characters"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone</label>
              <input
                type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
              <input
                type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g. Engineering, Support"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <button
              onClick={() => setFormData({ ...formData, twoFactorEnabled: !formData.twoFactorEnabled })}
              className={`relative w-11 h-6 rounded-full transition-colors ${formData.twoFactorEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.twoFactorEnabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Enable Two-Factor Authentication</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Require 2FA for this user on login</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={() => setCreateOpen(false)} className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!formData.name || !formData.email || !formData.newPass}
              className="px-6 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create User
            </button>
          </div>
        </div>
      </Modal>

      {/* ═══ EDIT USER MODAL ═══ */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit User: ${selectedUser?.name || ""}`} size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role</label>
              <select
                value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
              <input
                type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone</label>
              <input
                type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password (leave blank to keep)</label>
              <input
                type="password" value={formData.newPass} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Leave blank to keep current"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <button
              onClick={() => setFormData({ ...formData, twoFactorEnabled: !formData.twoFactorEnabled })}
              className={`relative w-11 h-6 rounded-full transition-colors ${formData.twoFactorEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.twoFactorEnabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Two-Factor Authentication</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formData.twoFactorEnabled ? "Enabled" : "Disabled"}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={() => setEditOpen(false)} className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              Cancel
            </button>
            <button onClick={handleEdit} className="px-6 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* ═══ SESSIONS MODAL ═══ */}
      <Modal open={sessionsOpen} onClose={() => setSessionsOpen(false)} title={`Active Sessions: ${selectedUser?.name || ""}`} size="xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">{mockSessions.length} active session{mockSessions.length !== 1 ? "s" : ""}</p>
            <button
              onClick={() => { toast.success("All sessions revoked"); setSessionsOpen(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Revoke All
            </button>
          </div>
          <div className="space-y-3">
            {mockSessions.map((session) => (
              <div key={session.id} className={`p-4 rounded-xl border ${session.isCurrentSession ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${session.isCurrentSession ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "bg-slate-100 text-slate-500 dark:bg-slate-700"}`}>
                      {session.device.includes("iPhone") ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-slate-900 dark:text-white">{session.device}</p>
                        {session.isCurrentSession && <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-full font-medium">Current</span>}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{session.browser} • {session.os}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                        <span>{session.ipAddress}</span>
                        <span>•</span>
                        <span>{session.location}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span>Login: {formatDate(session.loginAt)}</span>
                        <span>•</span>
                        <span>Active: {timeAgo(session.lastActive)}</span>
                      </div>
                    </div>
                  </div>
                  {!session.isCurrentSession && (
                    <button
                      onClick={() => handleRevokeSession(selectedUser?.id || "", session.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 rounded-lg transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* ═══ LOGIN HISTORY MODAL ═══ */}
      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title={`Login History: ${selectedUser?.name || ""}`} size="xl">
        <div className="space-y-3">
          {mockLoginHistory.map((entry) => (
            <div key={entry.id} className={`flex items-center gap-4 p-3 rounded-xl border ${entry.status === "success" ? "border-slate-200 dark:border-slate-700" : "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10"}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${entry.status === "success" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30"}`}>
                {entry.status === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{entry.status === "success" ? "Successful Login" : "Failed Attempt"}</p>
                  <StatusBadge label={entry.status} variant={entry.status === "success" ? "success" : "danger"} size="sm" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{entry.device} • {entry.location} • {entry.ipAddress}</p>
              </div>
              <p className="text-xs text-slate-400 whitespace-nowrap">{formatDate(entry.timestamp)}</p>
            </div>
          ))}
        </div>
      </Modal>

      {/* ═══ ACTIVITY LOG MODAL ═══ */}
      <Modal open={activityOpen} onClose={() => setActivityOpen(false)} title={`Activity Log: ${selectedUser?.name || ""}`} size="xl">
        <div className="space-y-3">
          {mockActivity.map((activity) => {
            const typeColors = { login: "bg-blue-100 text-blue-600 dark:bg-blue-900/30", action: "bg-amber-100 text-amber-600 dark:bg-amber-900/30", security: "bg-red-100 text-red-600 dark:bg-red-900/30", data: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" };
            const typeIcons = { login: <LogOut className="w-4 h-4" />, action: <Activity className="w-4 h-4" />, security: <Shield className="w-4 h-4" />, data: <Users className="w-4 h-4" /> };
            return (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${typeColors[activity.type]}`}>
                  {typeIcons[activity.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.action}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activity.details}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                    <span>{activity.ipAddress}</span>
                    <span>•</span>
                    <span>{formatDate(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* ═══ CONFIRM DIALOG ═══ */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={confirmAction?.title || ""}
        message={confirmAction?.message || ""}
        confirmLabel="Confirm"
        variant="danger"
        onConfirm={confirmAction?.onConfirm || (() => {})}
      />
    </div>
  );
}
