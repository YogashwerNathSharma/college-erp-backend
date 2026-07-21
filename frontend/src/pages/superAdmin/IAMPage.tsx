import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Shield, ShieldCheck, Key, Lock, Unlock, Users, Settings, Plus,
  Trash2, Edit, Check, X, Eye, Copy, RefreshCw, AlertTriangle,
  CheckSquare, Square, Grid3X3, Layers, FileKey, Globe, Code2,
  Palette, ChevronDown, ChevronRight, Search, MoreVertical, Zap,
  Building2, CreditCard, BarChart3, Activity, Package, BookOpen,
} from "lucide-react";
import {
  PageHeader, StatsCard, DataTable, StatusBadge, ConfirmDialog,
} from "../../components/enterprise";
import type { Column, BulkAction } from "../../components/enterprise";

// ══════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  parentRole: string | null;
  isSystem: boolean;
  usersCount: number;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: string;
  key: string;
  label: string;
  description: string;
  module: string;
  category: string;
}

interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  permissions: string[];
  color: string;
  createdAt: string;
}

interface ResourcePolicy {
  id: string;
  name: string;
  description: string;
  resource: string;
  effect: "ALLOW" | "DENY";
  principals: string[];
  actions: string[];
  conditions: Record<string, any>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiKey {
  id: string;
  name: string;
  maskedKey: string;
  scopes: string[];
  rateLimit: number;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdBy: string;
  status: "active" | "revoked" | "expired";
  createdAt: string;
}

interface IAMStats {
  totalRoles: number;
  totalPermissions: number;
  totalPolicies: number;
  activeApiKeys: number;
  permissionGroups: number;
  customRoles: number;
}

// ══════════════════════════════════════════════════════════
// MOCK DATA
// ══════════════════════════════════════════════════════════

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  REGIONAL_ADMIN: "Regional Admin",
  SUPPORT_STAFF: "Support Staff",
  DEVELOPER: "Developer",
  FINANCE: "Finance",
  SALES: "Sales",
};

const mockRoles: Role[] = [
  { id: "role-1", name: "SUPER_ADMIN", displayName: "Super Administrator", description: "Full system access with all privileges", color: "#6366f1", parentRole: null, isSystem: true, usersCount: 3, permissions: ["*"], createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-06-15T10:00:00Z" },
  { id: "role-2", name: "REGIONAL_ADMIN", displayName: "Regional Administrator", description: "Manages multiple tenants within a region", color: "#8b5cf6", parentRole: "SUPER_ADMIN", isSystem: true, usersCount: 8, permissions: ["tenants.read", "tenants.write", "reports.read", "users.read", "billing.read"], createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-05-20T14:30:00Z" },
  { id: "role-3", name: "SUPPORT_STAFF", displayName: "Support Staff", description: "Customer support access", color: "#06b6d4", parentRole: "REGIONAL_ADMIN", isSystem: true, usersCount: 12, permissions: ["tenants.read", "tickets.read", "tickets.write", "users.read", "users.reset-password"], createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-04-10T09:15:00Z" },
  { id: "role-4", name: "DEVELOPER", displayName: "Developer", description: "Technical access for development and debugging", color: "#10b981", parentRole: "SUPER_ADMIN", isSystem: true, usersCount: 6, permissions: ["system.logs", "system.diagnostics", "api.manage", "modules.read", "modules.write"], createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-06-01T16:45:00Z" },
  { id: "role-5", name: "FINANCE", displayName: "Finance Manager", description: "Billing, subscriptions, and financial reports", color: "#f59e0b", parentRole: "SUPER_ADMIN", isSystem: true, usersCount: 4, permissions: ["billing.read", "billing.write", "subscriptions.read", "subscriptions.write", "reports.financial"], createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-03-22T11:00:00Z" },
  { id: "role-6", name: "SALES", displayName: "Sales Representative", description: "Access to leads, demos, and trial management", color: "#ef4444", parentRole: "REGIONAL_ADMIN", isSystem: false, usersCount: 5, permissions: ["tenants.read", "tenants.create-trial", "leads.read", "leads.write", "demos.manage"], createdAt: "2024-02-15T00:00:00Z", updatedAt: "2024-06-10T13:20:00Z" },
];

const mockPermissions: Permission[] = [
  { id: "p-1", key: "tenants.read", label: "View Tenants", description: "View tenant list and details", module: "Tenants", category: "Read" },
  { id: "p-2", key: "tenants.write", label: "Edit Tenants", description: "Create, update tenant settings", module: "Tenants", category: "Write" },
  { id: "p-3", key: "tenants.delete", label: "Delete Tenants", description: "Remove tenants", module: "Tenants", category: "Delete" },
  { id: "p-4", key: "tenants.create-trial", label: "Create Trial", description: "Create trial accounts", module: "Tenants", category: "Write" },
  { id: "p-5", key: "tenants.suspend", label: "Suspend Tenants", description: "Suspend tenant access", module: "Tenants", category: "Admin" },
  { id: "p-6", key: "billing.read", label: "View Billing", description: "View invoices and payments", module: "Billing", category: "Read" },
  { id: "p-7", key: "billing.write", label: "Manage Billing", description: "Create invoices, manage payments", module: "Billing", category: "Write" },
  { id: "p-8", key: "billing.refund", label: "Issue Refunds", description: "Process refund requests", module: "Billing", category: "Admin" },
  { id: "p-9", key: "users.read", label: "View Users", description: "View user list and profiles", module: "Users", category: "Read" },
  { id: "p-10", key: "users.write", label: "Manage Users", description: "Create, update users", module: "Users", category: "Write" },
  { id: "p-11", key: "users.delete", label: "Delete Users", description: "Remove user accounts", module: "Users", category: "Delete" },
  { id: "p-12", key: "users.reset-password", label: "Reset Passwords", description: "Reset user passwords", module: "Users", category: "Admin" },
  { id: "p-13", key: "users.manage-2fa", label: "Manage 2FA", description: "Enable/disable 2FA", module: "Users", category: "Admin" },
  { id: "p-14", key: "system.settings", label: "System Settings", description: "Modify system config", module: "System", category: "Admin" },
  { id: "p-15", key: "system.logs", label: "View Logs", description: "Access system logs", module: "System", category: "Read" },
  { id: "p-16", key: "system.diagnostics", label: "Diagnostics", description: "Run diagnostics", module: "System", category: "Admin" },
  { id: "p-17", key: "system.backup", label: "Manage Backups", description: "Backup and restore", module: "System", category: "Admin" },
  { id: "p-18", key: "reports.read", label: "View Reports", description: "Access reports", module: "Reports", category: "Read" },
  { id: "p-19", key: "reports.financial", label: "Financial Reports", description: "Financial reports", module: "Reports", category: "Read" },
  { id: "p-20", key: "reports.export", label: "Export Reports", description: "Export to CSV/PDF", module: "Reports", category: "Write" },
  { id: "p-21", key: "modules.read", label: "View Modules", description: "View modules", module: "Modules", category: "Read" },
  { id: "p-22", key: "modules.write", label: "Manage Modules", description: "Install/remove modules", module: "Modules", category: "Write" },
  { id: "p-23", key: "modules.configure", label: "Configure Modules", description: "Module settings", module: "Modules", category: "Admin" },
  { id: "p-24", key: "subscriptions.read", label: "View Subscriptions", description: "View plans", module: "Subscriptions", category: "Read" },
  { id: "p-25", key: "subscriptions.write", label: "Manage Subscriptions", description: "Create/modify plans", module: "Subscriptions", category: "Write" },
  { id: "p-26", key: "security.read", label: "View Security", description: "View security settings", module: "Security", category: "Read" },
  { id: "p-27", key: "security.write", label: "Manage Security", description: "Configure policies", module: "Security", category: "Admin" },
  { id: "p-28", key: "security.firewall", label: "Firewall Rules", description: "Manage firewall", module: "Security", category: "Admin" },
  { id: "p-29", key: "api.manage", label: "Manage APIs", description: "API key management", module: "API", category: "Admin" },
  { id: "p-30", key: "api.read", label: "View API Docs", description: "API documentation", module: "API", category: "Read" },
  { id: "p-31", key: "tickets.read", label: "View Tickets", description: "View support tickets", module: "Support", category: "Read" },
  { id: "p-32", key: "tickets.write", label: "Manage Tickets", description: "Handle tickets", module: "Support", category: "Write" },
  { id: "p-33", key: "leads.read", label: "View Leads", description: "View sales leads", module: "Sales", category: "Read" },
  { id: "p-34", key: "leads.write", label: "Manage Leads", description: "Create/update leads", module: "Sales", category: "Write" },
  { id: "p-35", key: "demos.manage", label: "Manage Demos", description: "Schedule demos", module: "Sales", category: "Write" },
];

const mockPermissionGroups: PermissionGroup[] = [
  { id: "grp-1", name: "Tenant Management", description: "All permissions related to tenant operations", icon: "Building2", permissions: ["tenants.read", "tenants.write", "tenants.delete", "tenants.create-trial", "tenants.suspend"], color: "#6366f1", createdAt: "2024-01-01T00:00:00Z" },
  { id: "grp-2", name: "Billing & Finance", description: "Financial operations and billing management", icon: "CreditCard", permissions: ["billing.read", "billing.write", "billing.refund", "subscriptions.read", "subscriptions.write", "reports.financial"], color: "#f59e0b", createdAt: "2024-01-01T00:00:00Z" },
  { id: "grp-3", name: "User Administration", description: "User account management", icon: "Users", permissions: ["users.read", "users.write", "users.delete", "users.reset-password", "users.manage-2fa"], color: "#8b5cf6", createdAt: "2024-01-01T00:00:00Z" },
  { id: "grp-4", name: "System Operations", description: "System configuration and maintenance", icon: "Settings", permissions: ["system.settings", "system.logs", "system.diagnostics", "system.backup"], color: "#10b981", createdAt: "2024-01-01T00:00:00Z" },
  { id: "grp-5", name: "Reporting", description: "Access to reports and analytics", icon: "BarChart3", permissions: ["reports.read", "reports.financial", "reports.export"], color: "#06b6d4", createdAt: "2024-01-01T00:00:00Z" },
  { id: "grp-6", name: "Security Management", description: "Security policies and firewall", icon: "Shield", permissions: ["security.read", "security.write", "security.firewall"], color: "#ef4444", createdAt: "2024-01-01T00:00:00Z" },
];

const mockPolicies: ResourcePolicy[] = [
  { id: "pol-1", name: "Tenant Data Isolation", description: "Tenants can only access their own data", resource: "tenant:*:data", effect: "ALLOW", principals: ["role:REGIONAL_ADMIN", "role:SUPPORT_STAFF"], actions: ["read", "write"], conditions: { "tenant.region": "${user.region}" }, enabled: true, createdAt: "2024-01-15T00:00:00Z", updatedAt: "2024-06-01T00:00:00Z" },
  { id: "pol-2", name: "Financial Data Access", description: "Restricts financial data to finance team", resource: "billing:*", effect: "ALLOW", principals: ["role:FINANCE", "role:SUPER_ADMIN"], actions: ["read", "write", "export"], conditions: {}, enabled: true, createdAt: "2024-02-01T00:00:00Z", updatedAt: "2024-05-20T00:00:00Z" },
  { id: "pol-3", name: "Developer Debug Access", description: "Developers can access logs and diagnostics", resource: "system:diagnostics:*", effect: "ALLOW", principals: ["role:DEVELOPER"], actions: ["read", "execute"], conditions: { environment: "staging,production" }, enabled: true, createdAt: "2024-03-01T00:00:00Z", updatedAt: "2024-06-10T00:00:00Z" },
  { id: "pol-4", name: "Deny Delete Production Data", description: "Prevents deletion of production data", resource: "tenant:production:*", effect: "DENY", principals: ["role:*"], actions: ["delete"], conditions: { environment: "production" }, enabled: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "pol-5", name: "Sales Trial Access", description: "Sales can only create and manage trial tenants", resource: "tenant:trial:*", effect: "ALLOW", principals: ["role:SALES"], actions: ["create", "read", "update"], conditions: { "tenant.type": "trial" }, enabled: true, createdAt: "2024-03-15T00:00:00Z", updatedAt: "2024-06-05T00:00:00Z" },
];

const mockApiKeys: ApiKey[] = [
  { id: "key-1", name: "Production API", maskedKey: "sk_prod_****...****a3f2", scopes: ["tenants.read", "billing.read", "reports.read"], rateLimit: 1000, expiresAt: "2025-12-31T23:59:59Z", lastUsedAt: "2024-07-19T14:30:00Z", createdBy: "admin@system.com", status: "active", createdAt: "2024-01-01T00:00:00Z" },
  { id: "key-2", name: "Staging Integration", maskedKey: "sk_stg_****...****b7e1", scopes: ["tenants.read", "tenants.write", "users.read", "system.diagnostics"], rateLimit: 5000, expiresAt: null, lastUsedAt: "2024-07-18T09:15:00Z", createdBy: "dev@system.com", status: "active", createdAt: "2024-03-15T00:00:00Z" },
  { id: "key-3", name: "Webhook Service", maskedKey: "sk_whk_****...****c4d8", scopes: ["tenants.read", "billing.read"], rateLimit: 500, expiresAt: "2024-06-30T23:59:59Z", lastUsedAt: "2024-06-30T23:50:00Z", createdBy: "integrations@system.com", status: "expired", createdAt: "2024-01-10T00:00:00Z" },
  { id: "key-4", name: "Mobile App", maskedKey: "sk_mob_****...****e9a5", scopes: ["users.read", "tenants.read"], rateLimit: 2000, expiresAt: "2025-06-30T23:59:59Z", lastUsedAt: "2024-07-19T16:45:00Z", createdBy: "mobile-team@system.com", status: "active", createdAt: "2024-04-01T00:00:00Z" },
];

const mockIAMStats: IAMStats = {
  totalRoles: 6,
  totalPermissions: 35,
  totalPolicies: 5,
  activeApiKeys: 3,
  permissionGroups: 6,
  customRoles: 1,
};

// ══════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════

const TABS = [
  { key: "roles", label: "Roles", icon: Shield },
  { key: "matrix", label: "Permission Matrix", icon: Grid3X3 },
  { key: "groups", label: "Permission Groups", icon: Layers },
  { key: "policies", label: "Resource Policies", icon: FileKey },
  { key: "api", label: "API Permissions", icon: Code2 },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
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

// ══════════════════════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════════════════════

function Modal({ open, onClose, title, size = "md", children }: {
  open: boolean; onClose: () => void; title: string; size?: "sm" | "md" | "lg" | "xl" | "2xl"; children: React.ReactNode;
}) {
  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl", "2xl": "max-w-6xl" };
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
// ICON MAP
// ══════════════════════════════════════════════════════════

const iconMap: Record<string, React.ReactNode> = {
  Building2: <Building2 className="w-5 h-5" />,
  CreditCard: <CreditCard className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  Settings: <Settings className="w-5 h-5" />,
  BarChart3: <BarChart3 className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
  Folder: <Package className="w-5 h-5" />,
};

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════

export default function IAMPage() {
  const [activeTab, setActiveTab] = useState("roles");
  const [stats, setStats] = useState<IAMStats>(mockIAMStats);
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [permissions] = useState<Permission[]>(mockPermissions);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>(mockPermissionGroups);
  const [policies, setPolicies] = useState<ResourcePolicy[]>(mockPolicies);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys);
  const [loading, setLoading] = useState(false);

  // Permission matrix state
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [matrixSearch, setMatrixSearch] = useState("");
  const [expandedModules, setExpandedModules] = useState<string[]>(["Tenants", "Billing", "Users", "System", "Reports"]);

  // Modals
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form states
  const [roleForm, setRoleForm] = useState({ name: "", displayName: "", description: "", color: "#6366f1", parentRole: "" as string | null, permissions: [] as string[] });
  const [groupForm, setGroupForm] = useState({ name: "", description: "", icon: "Folder", permissions: [] as string[], color: "#6366f1" });
  const [policyForm, setPolicyForm] = useState({ name: "", description: "", resource: "", effect: "ALLOW" as "ALLOW" | "DENY", principals: [] as string[], actions: [] as string[], enabled: true });
  const [apiKeyForm, setApiKeyForm] = useState({ name: "", scopes: [] as string[], rateLimit: 1000, expiresAt: "" });

  // Initialize matrix
  useEffect(() => {
    const m: Record<string, Record<string, boolean>> = {};
    for (const role of roles) {
      m[role.name] = {};
      for (const perm of permissions) {
        m[role.name][perm.key] = role.permissions.includes("*") || role.permissions.includes(perm.key);
      }
    }
    setMatrix(m);
  }, [roles, permissions]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [rolesRes, statsRes] = await Promise.all([
        axios.get("/api/super-admin/iam/roles", { headers }),
        axios.get("/api/super-admin/iam/stats", { headers }),
      ]);
      if (rolesRes.data.success) setRoles(rolesRes.data.data);
      if (statsRes.data.success) setStats(statsRes.data.data);
    } catch {
      // Fallback: use actual user roles from DB
      setRoles([]);
      setStats({ totalRoles: 0, totalPermissions: 0, totalPolicies: 0, totalApiKeys: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Matrix Helpers ────────────────────────────────────────

  const permissionsByModule = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};
    permissions.forEach((p) => {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push(p);
    });
    return grouped;
  }, [permissions]);

  const filteredModules = useMemo(() => {
    if (!matrixSearch) return Object.keys(permissionsByModule);
    const s = matrixSearch.toLowerCase();
    return Object.keys(permissionsByModule).filter((mod) =>
      mod.toLowerCase().includes(s) || permissionsByModule[mod].some((p) => p.label.toLowerCase().includes(s) || p.key.toLowerCase().includes(s))
    );
  }, [permissionsByModule, matrixSearch]);

  const toggleMatrixPermission = (roleName: string, permKey: string) => {
    if (roleName === "SUPER_ADMIN") {
      toast.error("Cannot modify Super Admin permissions");
      return;
    }
    setMatrix((prev) => ({
      ...prev,
      [roleName]: { ...prev[roleName], [permKey]: !prev[roleName][permKey] },
    }));
    // Update role permissions
    setRoles((prev) => prev.map((r) => {
      if (r.name !== roleName) return r;
      const granted = !matrix[roleName]?.[permKey];
      const perms = granted
        ? [...r.permissions, permKey]
        : r.permissions.filter((p) => p !== permKey);
      return { ...r, permissions: perms };
    }));
    // Call API
    axios.put("/api/super-admin/iam/matrix", { roleName, permissionKey: permKey, granted: !matrix[roleName]?.[permKey] }).catch(() => {});
  };

  const toggleModule = (mod: string) => {
    setExpandedModules((prev) => prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]);
  };

  // ── Role Handlers ────────────────────────────────────────

  const handleCreateRole = async () => {
    try {
      const res = await axios.post("/api/super-admin/iam/roles", { ...roleForm, name: roleForm.name.toUpperCase().replace(/\s/g, "_") });
      if (res.data.success) setRoles((prev) => [...prev, res.data.data]);
    } catch {
      const newRole: Role = {
        id: `role-${Date.now()}`, name: roleForm.name.toUpperCase().replace(/\s/g, "_"),
        displayName: roleForm.displayName, description: roleForm.description,
        color: roleForm.color, parentRole: roleForm.parentRole || null,
        isSystem: false, usersCount: 0, permissions: roleForm.permissions,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      setRoles((prev) => [...prev, newRole]);
    }
    toast.success(editMode ? "Role updated" : "Role created");
    setRoleModalOpen(false);
    resetRoleForm();
  };

  const handleDeleteRole = (role: Role) => {
    if (role.isSystem) { toast.error("Cannot delete system roles"); return; }
    setConfirmAction({
      title: "Delete Role",
      message: `Are you sure you want to delete "${role.displayName}"? ${role.usersCount} users are assigned this role.`,
      onConfirm: () => {
        setRoles((prev) => prev.filter((r) => r.id !== role.id));
        toast.success("Role deleted");
        setConfirmOpen(false);
      },
    });
    setConfirmOpen(true);
  };

  const openEditRole = (role: Role) => {
    setEditMode(true);
    setSelectedItem(role);
    setRoleForm({ name: role.name, displayName: role.displayName, description: role.description, color: role.color, parentRole: role.parentRole, permissions: role.permissions });
    setRoleModalOpen(true);
  };

  const resetRoleForm = () => {
    setRoleForm({ name: "", displayName: "", description: "", color: "#6366f1", parentRole: null, permissions: [] });
    setEditMode(false);
    setSelectedItem(null);
  };

  // ── Group Handlers ────────────────────────────────────────

  const handleCreateGroup = () => {
    const newGroup: PermissionGroup = {
      id: `grp-${Date.now()}`, name: groupForm.name, description: groupForm.description,
      icon: groupForm.icon, permissions: groupForm.permissions, color: groupForm.color,
      createdAt: new Date().toISOString(),
    };
    setPermissionGroups((prev) => [...prev, newGroup]);
    toast.success("Permission group created");
    setGroupModalOpen(false);
    setGroupForm({ name: "", description: "", icon: "Folder", permissions: [], color: "#6366f1" });
  };

  const handleDeleteGroup = (group: PermissionGroup) => {
    setConfirmAction({
      title: "Delete Permission Group",
      message: `Delete "${group.name}"? The permissions themselves won't be affected.`,
      onConfirm: () => {
        setPermissionGroups((prev) => prev.filter((g) => g.id !== group.id));
        toast.success("Group deleted");
        setConfirmOpen(false);
      },
    });
    setConfirmOpen(true);
  };

  // ── Policy Handlers ────────────────────────────────────────

  const handleCreatePolicy = () => {
    const newPolicy: ResourcePolicy = {
      id: `pol-${Date.now()}`, name: policyForm.name, description: policyForm.description,
      resource: policyForm.resource, effect: policyForm.effect, principals: policyForm.principals,
      actions: policyForm.actions, conditions: {}, enabled: policyForm.enabled,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setPolicies((prev) => [...prev, newPolicy]);
    toast.success("Resource policy created");
    setPolicyModalOpen(false);
    setPolicyForm({ name: "", description: "", resource: "", effect: "ALLOW", principals: [], actions: [], enabled: true });
  };

  const handleTogglePolicy = (policyId: string) => {
    setPolicies((prev) => prev.map((p) => p.id === policyId ? { ...p, enabled: !p.enabled } : p));
    toast.success("Policy updated");
  };

  const handleDeletePolicy = (policy: ResourcePolicy) => {
    setConfirmAction({
      title: "Delete Policy",
      message: `Delete "${policy.name}"? This will remove the access restriction immediately.`,
      onConfirm: () => {
        setPolicies((prev) => prev.filter((p) => p.id !== policy.id));
        toast.success("Policy deleted");
        setConfirmOpen(false);
      },
    });
    setConfirmOpen(true);
  };

  // ── API Key Handlers ────────────────────────────────────────

  const handleCreateApiKey = () => {
    const newKey: ApiKey = {
      id: `key-${Date.now()}`, name: apiKeyForm.name,
      maskedKey: `sk_${apiKeyForm.name.toLowerCase().replace(/\s/g, "_").slice(0, 4)}_****...****${Math.random().toString(36).slice(-4)}`,
      scopes: apiKeyForm.scopes, rateLimit: apiKeyForm.rateLimit,
      expiresAt: apiKeyForm.expiresAt || null, lastUsedAt: null,
      createdBy: "admin@system.com", status: "active",
      createdAt: new Date().toISOString(),
    };
    setApiKeys((prev) => [...prev, newKey]);
    toast.success("API key created. Copy it now — it won't be shown again.");
    setApiKeyModalOpen(false);
    setApiKeyForm({ name: "", scopes: [], rateLimit: 1000, expiresAt: "" });
  };

  const handleRevokeApiKey = (key: ApiKey) => {
    setConfirmAction({
      title: "Revoke API Key",
      message: `Revoke "${key.name}"? Applications using this key will immediately lose access.`,
      onConfirm: () => {
        setApiKeys((prev) => prev.map((k) => k.id === key.id ? { ...k, status: "revoked" as const } : k));
        toast.success("API key revoked");
        setConfirmOpen(false);
      },
    });
    setConfirmOpen(true);
  };

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Identity & Access Management"
        subtitle="Configure roles, permissions, policies, and API access controls"
        icon={<ShieldCheck className="w-6 h-6" />}
        breadcrumbs={[{ label: "Super Admin", path: "/super-admin" }, { label: "IAM" }]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Roles" value={stats.totalRoles} icon={<Shield className="w-5 h-5" />} color="indigo" subtitle={`${stats.customRoles} custom`} />
        <StatsCard title="Permissions" value={stats.totalPermissions} icon={<Key className="w-5 h-5" />} color="purple" subtitle={`${stats.permissionGroups} groups`} />
        <StatsCard title="Resource Policies" value={stats.totalPolicies} icon={<FileKey className="w-5 h-5" />} color="emerald" subtitle="Active policies" />
        <StatsCard title="API Keys" value={stats.activeApiKeys} icon={<Code2 className="w-5 h-5" />} color="amber" subtitle="Active keys" />
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-1.5">
        <div className="flex overflow-x-auto gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
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
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: ROLES */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { resetRoleForm(); setRoleModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Role
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div key={role.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: role.color + "20", color: role.color }}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{role.displayName}</h3>
                        {role.isSystem && <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded">SYSTEM</span>}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{role.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditRole(role)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    {!role.isSystem && (
                      <button onClick={() => handleDeleteRole(role)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">{role.description}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {role.usersCount} users</span>
                    <span className="flex items-center gap-1"><Key className="w-3.5 h-3.5" /> {role.permissions.includes("*") ? "All" : role.permissions.length} perms</span>
                  </div>
                  {role.parentRole && (
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
                      ← {ROLE_LABELS[role.parentRole] || role.parentRole}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: PERMISSION MATRIX */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "matrix" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Permission Matrix</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Click checkboxes to grant/revoke permissions per role</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text" value={matrixSearch} onChange={(e) => setMatrixSearch(e.target.value)}
                  placeholder="Filter permissions..."
                  className="pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white w-64 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 min-w-[200px] sticky left-0 bg-slate-50 dark:bg-slate-800/50">Permission</th>
                  {roles.map((role) => (
                    <th key={role.id} className="px-3 py-3 text-center min-w-[100px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{role.displayName.split(" ")[0]}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredModules.map((module) => (
                  <ModuleRows
                    key={module}
                    module={module}
                    permissions={permissionsByModule[module]}
                    roles={roles}
                    matrix={matrix}
                    expanded={expandedModules.includes(module)}
                    onToggle={() => toggleModule(module)}
                    onTogglePermission={toggleMatrixPermission}
                    searchTerm={matrixSearch}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: PERMISSION GROUPS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "groups" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setGroupModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Group
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {permissionGroups.map((group) => (
              <div key={group.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: group.color + "20", color: group.color }}>
                      {iconMap[group.icon] || <Package className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{group.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{group.permissions.length} permissions</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteGroup(group)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">{group.description}</p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap gap-1.5">
                    {group.permissions.slice(0, 4).map((p) => (
                      <span key={p} className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                        {p}
                      </span>
                    ))}
                    {group.permissions.length > 4 && (
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded">
                        +{group.permissions.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: RESOURCE POLICIES */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "policies" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setPolicyModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Policy
            </button>
          </div>
          <div className="space-y-3">
            {policies.map((policy) => (
              <div key={policy.id} className={`bg-white dark:bg-slate-900 rounded-xl border ${policy.enabled ? "border-slate-200 dark:border-slate-700" : "border-slate-200 dark:border-slate-700 opacity-60"} p-5 hover:shadow-md transition-all`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${policy.effect === "ALLOW" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
                      {policy.effect === "ALLOW" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{policy.name}</h3>
                        <StatusBadge label={policy.effect} variant={policy.effect === "ALLOW" ? "success" : "danger"} size="sm" />
                        {!policy.enabled && <StatusBadge label="Disabled" variant="neutral" size="sm" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{policy.description}</p>
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                        <span><strong>Resource:</strong> {policy.resource}</span>
                        <span><strong>Actions:</strong> {policy.actions.join(", ")}</span>
                        <span><strong>Principals:</strong> {policy.principals.join(", ")}</span>
                      </div>
                      {Object.keys(policy.conditions).length > 0 && (
                        <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <p className="text-[10px] font-medium text-slate-500 uppercase mb-1">Conditions</p>
                          <code className="text-xs text-slate-600 dark:text-slate-300">{JSON.stringify(policy.conditions)}</code>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTogglePolicy(policy.id)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${policy.enabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${policy.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                    <button onClick={() => handleDeletePolicy(policy)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: API PERMISSIONS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "api" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setApiKeyModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Generate API Key
            </button>
          </div>
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div key={key.id} className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 ${key.status !== "active" ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${key.status === "active" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : key.status === "expired" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30"}`}>
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{key.name}</h3>
                        <StatusBadge label={key.status} variant={key.status === "active" ? "success" : key.status === "expired" ? "warning" : "danger"} />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {key.maskedKey}
                        </code>
                        <button onClick={() => { navigator.clipboard.writeText(key.maskedKey); toast.success("Copied"); }} className="p-1 text-slate-400 hover:text-indigo-600">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                        <span><strong>Rate Limit:</strong> {key.rateLimit} req/min</span>
                        <span><strong>Created by:</strong> {key.createdBy}</span>
                        {key.expiresAt && <span><strong>Expires:</strong> {formatDate(key.expiresAt)}</span>}
                        {key.lastUsedAt && <span><strong>Last used:</strong> {timeAgo(key.lastUsedAt)}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {key.scopes.map((scope) => (
                          <span key={scope} className="px-2 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 rounded">
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {key.status === "active" && (
                    <button
                      onClick={() => handleRevokeApiKey(key)}
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
      )}

      {/* ═══ ROLE MODAL ═══ */}
      <Modal open={roleModalOpen} onClose={() => { setRoleModalOpen(false); resetRoleForm(); }} title={editMode ? "Edit Role" : "Create New Role"} size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Display Name *</label>
              <input
                type="text" value={roleForm.displayName} onChange={(e) => setRoleForm({ ...roleForm, displayName: e.target.value, name: e.target.value.toUpperCase().replace(/\s/g, "_") })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g. Content Manager"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">System Name</label>
              <input
                type="text" value={roleForm.name} readOnly
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <textarea
              value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Describe the role's purpose..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color" value={roleForm.color} onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer"
                />
                <input
                  type="text" value={roleForm.color} onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Parent Role</label>
              <select
                value={roleForm.parentRole || ""} onChange={(e) => setRoleForm({ ...roleForm, parentRole: e.target.value || null })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">None (Top-level)</option>
                {roles.map((r) => <option key={r.id} value={r.name}>{r.displayName}</option>)}
              </select>
            </div>
          </div>
          {/* Permission selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Permissions</label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2">
              {Object.entries(permissionsByModule).map(([module, perms]) => (
                <div key={module}>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{module}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {perms.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => {
                          setRoleForm((prev) => ({
                            ...prev,
                            permissions: prev.permissions.includes(p.key) ? prev.permissions.filter((x) => x !== p.key) : [...prev.permissions, p.key],
                          }));
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                          roleForm.permissions.includes(p.key) ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 ring-1 ring-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">{roleForm.permissions.length} permission{roleForm.permissions.length !== 1 ? "s" : ""} selected</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={() => { setRoleModalOpen(false); resetRoleForm(); }} className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              Cancel
            </button>
            <button onClick={handleCreateRole} disabled={!roleForm.displayName} className="px-6 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50">
              {editMode ? "Save Changes" : "Create Role"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ═══ GROUP MODAL ═══ */}
      <Modal open={groupModalOpen} onClose={() => setGroupModalOpen(false)} title="Create Permission Group" size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Group Name *</label>
              <input
                type="text" value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g. Content Operations"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={groupForm.color} onChange={(e) => setGroupForm({ ...groupForm, color: e.target.value })} className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer" />
                <input type="text" value={groupForm.color} onChange={(e) => setGroupForm({ ...groupForm, color: e.target.value })} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <input type="text" value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="What does this group cover?" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Permissions</label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-1">
              {permissions.map((p) => (
                <label key={p.key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={groupForm.permissions.includes(p.key)}
                    onChange={() => setGroupForm((prev) => ({ ...prev, permissions: prev.permissions.includes(p.key) ? prev.permissions.filter((x) => x !== p.key) : [...prev.permissions, p.key] }))}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{p.label}</span>
                  <span className="text-xs text-slate-400 ml-auto">{p.module}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={() => setGroupModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleCreateGroup} disabled={!groupForm.name} className="px-6 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50">Create Group</button>
          </div>
        </div>
      </Modal>

      {/* ═══ POLICY MODAL ═══ */}
      <Modal open={policyModalOpen} onClose={() => setPolicyModalOpen(false)} title="Create Resource Policy" size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Policy Name *</label>
              <input type="text" value={policyForm.name} onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g. Tenant Read Access" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Effect *</label>
              <select value={policyForm.effect} onChange={(e) => setPolicyForm({ ...policyForm, effect: e.target.value as "ALLOW" | "DENY" })} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option value="ALLOW">ALLOW</option>
                <option value="DENY">DENY</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <input type="text" value={policyForm.description} onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="What does this policy control?" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Resource Pattern *</label>
            <input type="text" value={policyForm.resource} onChange={(e) => setPolicyForm({ ...policyForm, resource: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g. tenant:*:data or billing:invoices:*" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Principals (comma-separated)</label>
              <input type="text" value={policyForm.principals.join(", ")} onChange={(e) => setPolicyForm({ ...policyForm, principals: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="role:DEVELOPER, role:FINANCE" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Actions (comma-separated)</label>
              <input type="text" value={policyForm.actions.join(", ")} onChange={(e) => setPolicyForm({ ...policyForm, actions: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="read, write, delete" />
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <button onClick={() => setPolicyForm({ ...policyForm, enabled: !policyForm.enabled })} className={`relative w-11 h-6 rounded-full transition-colors ${policyForm.enabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${policyForm.enabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-sm text-slate-700 dark:text-slate-300">Enable policy immediately</span>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={() => setPolicyModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleCreatePolicy} disabled={!policyForm.name || !policyForm.resource} className="px-6 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50">Create Policy</button>
          </div>
        </div>
      </Modal>

      {/* ═══ API KEY MODAL ═══ */}
      <Modal open={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} title="Generate API Key" size="lg">
        <div className="space-y-5">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">The API key will only be displayed once after creation. Make sure to copy it immediately.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Key Name *</label>
              <input type="text" value={apiKeyForm.name} onChange={(e) => setApiKeyForm({ ...apiKeyForm, name: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g. Production API" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Rate Limit (req/min)</label>
              <input type="number" value={apiKeyForm.rateLimit} onChange={(e) => setApiKeyForm({ ...apiKeyForm, rateLimit: parseInt(e.target.value) || 1000 })} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Expiration Date (optional)</label>
            <input type="date" value={apiKeyForm.expiresAt} onChange={(e) => setApiKeyForm({ ...apiKeyForm, expiresAt: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Scopes / Permissions</label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-1">
              {permissions.map((p) => (
                <label key={p.key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={apiKeyForm.scopes.includes(p.key)}
                    onChange={() => setApiKeyForm((prev) => ({ ...prev, scopes: prev.scopes.includes(p.key) ? prev.scopes.filter((x) => x !== p.key) : [...prev.scopes, p.key] }))}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{p.label}</span>
                  <span className="text-xs text-slate-400 ml-auto">{p.module}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">{apiKeyForm.scopes.length} scope{apiKeyForm.scopes.length !== 1 ? "s" : ""} selected</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={() => setApiKeyModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleCreateApiKey} disabled={!apiKeyForm.name || apiKeyForm.scopes.length === 0} className="px-6 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50">Generate Key</button>
          </div>
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

// ══════════════════════════════════════════════════════════
// MODULE ROWS COMPONENT (for Permission Matrix)
// ══════════════════════════════════════════════════════════

function ModuleRows({ module, permissions, roles, matrix, expanded, onToggle, onTogglePermission, searchTerm }: {
  module: string;
  permissions: Permission[];
  roles: Role[];
  matrix: Record<string, Record<string, boolean>>;
  expanded: boolean;
  onToggle: () => void;
  onTogglePermission: (role: string, perm: string) => void;
  searchTerm: string;
}) {
  const filteredPerms = searchTerm
    ? permissions.filter((p) => p.label.toLowerCase().includes(searchTerm.toLowerCase()) || p.key.toLowerCase().includes(searchTerm.toLowerCase()))
    : permissions;

  if (filteredPerms.length === 0) return null;

  return (
    <>
      {/* Module header row */}
      <tr className="bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50" onClick={onToggle}>
        <td className="px-4 py-2.5 sticky left-0 bg-slate-50/50 dark:bg-slate-800/30" colSpan={roles.length + 1}>
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{module}</span>
            <span className="text-[10px] text-slate-400">({filteredPerms.length})</span>
          </div>
        </td>
      </tr>
      {/* Permission rows */}
      {expanded && filteredPerms.map((perm) => (
        <tr key={perm.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 border-b border-slate-50 dark:border-slate-800/50">
          <td className="px-4 py-2 pl-10 sticky left-0 bg-white dark:bg-slate-900">
            <div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{perm.label}</p>
              <p className="text-[10px] text-slate-400">{perm.key}</p>
            </div>
          </td>
          {roles.map((role) => {
            const granted = matrix[role.name]?.[perm.key] ?? false;
            const isSuperAdmin = role.name === "SUPER_ADMIN";
            return (
              <td key={role.id} className="px-3 py-2 text-center">
                <button
                  onClick={() => onTogglePermission(role.name, perm.key)}
                  disabled={isSuperAdmin}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                    granted
                      ? isSuperAdmin
                        ? "bg-indigo-100 text-indigo-400 dark:bg-indigo-900/20 cursor-not-allowed"
                        : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
                      : isSuperAdmin
                        ? "bg-slate-50 text-slate-300 dark:bg-slate-800/50 cursor-not-allowed"
                        : "bg-slate-50 text-slate-300 dark:bg-slate-800/50 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {granted ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5" />}
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
