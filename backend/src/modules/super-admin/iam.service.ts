import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

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
  key: string;
  maskedKey: string;
  scopes: string[];
  rateLimit: number;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdBy: string;
  status: "active" | "revoked" | "expired";
  createdAt: string;
}

// ══════════════════════════════════════════════════════════
// MOCK DATA
// ══════════════════════════════════════════════════════════

const mockRoles: Role[] = [
  {
    id: "role-1",
    name: "SUPER_ADMIN",
    displayName: "Super Administrator",
    description: "Full system access with all privileges. Can manage tenants, billing, and system configuration.",
    color: "#6366f1",
    parentRole: null,
    isSystem: true,
    usersCount: 3,
    permissions: ["*"],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-06-15T10:00:00Z",
  },
  {
    id: "role-2",
    name: "REGIONAL_ADMIN",
    displayName: "Regional Administrator",
    description: "Manages multiple tenants within a region. Can configure tenant settings and view reports.",
    color: "#8b5cf6",
    parentRole: "SUPER_ADMIN",
    isSystem: true,
    usersCount: 8,
    permissions: ["tenants.read", "tenants.write", "reports.read", "users.read", "billing.read"],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-05-20T14:30:00Z",
  },
  {
    id: "role-3",
    name: "SUPPORT_STAFF",
    displayName: "Support Staff",
    description: "Customer support access. Can view tenants, handle tickets, and reset passwords.",
    color: "#06b6d4",
    parentRole: "REGIONAL_ADMIN",
    isSystem: true,
    usersCount: 12,
    permissions: ["tenants.read", "tickets.read", "tickets.write", "users.read", "users.reset-password"],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-04-10T09:15:00Z",
  },
  {
    id: "role-4",
    name: "DEVELOPER",
    displayName: "Developer",
    description: "Technical access for development and debugging. Can access logs, APIs, and system diagnostics.",
    color: "#10b981",
    parentRole: "SUPER_ADMIN",
    isSystem: true,
    usersCount: 6,
    permissions: ["system.logs", "system.diagnostics", "api.manage", "modules.read", "modules.write"],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-06-01T16:45:00Z",
  },
  {
    id: "role-5",
    name: "FINANCE",
    displayName: "Finance Manager",
    description: "Access to billing, subscriptions, invoices, and financial reports.",
    color: "#f59e0b",
    parentRole: "SUPER_ADMIN",
    isSystem: true,
    usersCount: 4,
    permissions: ["billing.read", "billing.write", "subscriptions.read", "subscriptions.write", "reports.financial"],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-03-22T11:00:00Z",
  },
  {
    id: "role-6",
    name: "SALES",
    displayName: "Sales Representative",
    description: "Access to leads, demos, and trial tenant management.",
    color: "#ef4444",
    parentRole: "REGIONAL_ADMIN",
    isSystem: false,
    usersCount: 5,
    permissions: ["tenants.read", "tenants.create-trial", "leads.read", "leads.write", "demos.manage"],
    createdAt: "2024-02-15T00:00:00Z",
    updatedAt: "2024-06-10T13:20:00Z",
  },
];

const mockPermissions: Permission[] = [
  // Tenants
  { id: "p-1", key: "tenants.read", label: "View Tenants", description: "View tenant list and details", module: "Tenants", category: "Read" },
  { id: "p-2", key: "tenants.write", label: "Edit Tenants", description: "Create, update tenant settings", module: "Tenants", category: "Write" },
  { id: "p-3", key: "tenants.delete", label: "Delete Tenants", description: "Remove tenants from the system", module: "Tenants", category: "Delete" },
  { id: "p-4", key: "tenants.create-trial", label: "Create Trial", description: "Create trial tenant accounts", module: "Tenants", category: "Write" },
  { id: "p-5", key: "tenants.suspend", label: "Suspend Tenants", description: "Suspend tenant access", module: "Tenants", category: "Admin" },
  // Billing
  { id: "p-6", key: "billing.read", label: "View Billing", description: "View invoices and payment history", module: "Billing", category: "Read" },
  { id: "p-7", key: "billing.write", label: "Manage Billing", description: "Create invoices, manage payments", module: "Billing", category: "Write" },
  { id: "p-8", key: "billing.refund", label: "Issue Refunds", description: "Process refund requests", module: "Billing", category: "Admin" },
  // Users
  { id: "p-9", key: "users.read", label: "View Users", description: "View user list and profiles", module: "Users", category: "Read" },
  { id: "p-10", key: "users.write", label: "Manage Users", description: "Create, update user accounts", module: "Users", category: "Write" },
  { id: "p-11", key: "users.delete", label: "Delete Users", description: "Remove user accounts", module: "Users", category: "Delete" },
  { id: "p-12", key: "users.reset-password", label: "Reset Passwords", description: "Reset user passwords", module: "Users", category: "Admin" },
  { id: "p-13", key: "users.manage-2fa", label: "Manage 2FA", description: "Enable/disable 2FA for users", module: "Users", category: "Admin" },
  // System
  { id: "p-14", key: "system.settings", label: "System Settings", description: "Modify system configuration", module: "System", category: "Admin" },
  { id: "p-15", key: "system.logs", label: "View Logs", description: "Access system and audit logs", module: "System", category: "Read" },
  { id: "p-16", key: "system.diagnostics", label: "Diagnostics", description: "Run system diagnostic tools", module: "System", category: "Admin" },
  { id: "p-17", key: "system.backup", label: "Manage Backups", description: "Create and restore backups", module: "System", category: "Admin" },
  // Reports
  { id: "p-18", key: "reports.read", label: "View Reports", description: "Access reporting dashboards", module: "Reports", category: "Read" },
  { id: "p-19", key: "reports.financial", label: "Financial Reports", description: "Access financial reports", module: "Reports", category: "Read" },
  { id: "p-20", key: "reports.export", label: "Export Reports", description: "Export reports to CSV/PDF", module: "Reports", category: "Write" },
  // Modules
  { id: "p-21", key: "modules.read", label: "View Modules", description: "View installed modules", module: "Modules", category: "Read" },
  { id: "p-22", key: "modules.write", label: "Manage Modules", description: "Install, update, remove modules", module: "Modules", category: "Write" },
  { id: "p-23", key: "modules.configure", label: "Configure Modules", description: "Modify module settings", module: "Modules", category: "Admin" },
  // Subscriptions
  { id: "p-24", key: "subscriptions.read", label: "View Subscriptions", description: "View subscription plans", module: "Subscriptions", category: "Read" },
  { id: "p-25", key: "subscriptions.write", label: "Manage Subscriptions", description: "Create/modify plans", module: "Subscriptions", category: "Write" },
  // Security
  { id: "p-26", key: "security.read", label: "View Security", description: "View security settings", module: "Security", category: "Read" },
  { id: "p-27", key: "security.write", label: "Manage Security", description: "Configure security policies", module: "Security", category: "Admin" },
  { id: "p-28", key: "security.firewall", label: "Firewall Rules", description: "Manage firewall configuration", module: "Security", category: "Admin" },
  // API
  { id: "p-29", key: "api.manage", label: "Manage APIs", description: "Manage API keys and endpoints", module: "API", category: "Admin" },
  { id: "p-30", key: "api.read", label: "View API Docs", description: "Access API documentation", module: "API", category: "Read" },
  // Support
  { id: "p-31", key: "tickets.read", label: "View Tickets", description: "View support tickets", module: "Support", category: "Read" },
  { id: "p-32", key: "tickets.write", label: "Manage Tickets", description: "Create, respond, close tickets", module: "Support", category: "Write" },
  // Leads/Sales
  { id: "p-33", key: "leads.read", label: "View Leads", description: "View sales leads", module: "Sales", category: "Read" },
  { id: "p-34", key: "leads.write", label: "Manage Leads", description: "Create and update leads", module: "Sales", category: "Write" },
  { id: "p-35", key: "demos.manage", label: "Manage Demos", description: "Schedule and conduct demos", module: "Sales", category: "Write" },
];

let mockPermissionGroups: PermissionGroup[] = [
  {
    id: "grp-1",
    name: "Tenant Management",
    description: "All permissions related to tenant operations",
    icon: "Building2",
    permissions: ["tenants.read", "tenants.write", "tenants.delete", "tenants.create-trial", "tenants.suspend"],
    color: "#6366f1",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "grp-2",
    name: "Billing & Finance",
    description: "Financial operations and billing management",
    icon: "CreditCard",
    permissions: ["billing.read", "billing.write", "billing.refund", "subscriptions.read", "subscriptions.write", "reports.financial"],
    color: "#f59e0b",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "grp-3",
    name: "User Administration",
    description: "User account management and access control",
    icon: "Users",
    permissions: ["users.read", "users.write", "users.delete", "users.reset-password", "users.manage-2fa"],
    color: "#8b5cf6",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "grp-4",
    name: "System Operations",
    description: "System configuration and maintenance",
    icon: "Settings",
    permissions: ["system.settings", "system.logs", "system.diagnostics", "system.backup"],
    color: "#10b981",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "grp-5",
    name: "Reporting",
    description: "Access to reports and analytics",
    icon: "BarChart3",
    permissions: ["reports.read", "reports.financial", "reports.export"],
    color: "#06b6d4",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "grp-6",
    name: "Security Management",
    description: "Security policies and firewall management",
    icon: "Shield",
    permissions: ["security.read", "security.write", "security.firewall"],
    color: "#ef4444",
    createdAt: "2024-01-01T00:00:00Z",
  },
];

let mockResourcePolicies: ResourcePolicy[] = [
  {
    id: "pol-1",
    name: "Tenant Data Isolation",
    description: "Ensures tenants can only access their own data",
    resource: "tenant:*:data",
    effect: "ALLOW",
    principals: ["role:REGIONAL_ADMIN", "role:SUPPORT_STAFF"],
    actions: ["read", "write"],
    conditions: { "tenant.region": "${user.region}" },
    enabled: true,
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
  {
    id: "pol-2",
    name: "Financial Data Access",
    description: "Restricts financial data to finance team",
    resource: "billing:*",
    effect: "ALLOW",
    principals: ["role:FINANCE", "role:SUPER_ADMIN"],
    actions: ["read", "write", "export"],
    conditions: {},
    enabled: true,
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-05-20T00:00:00Z",
  },
  {
    id: "pol-3",
    name: "Developer Debug Access",
    description: "Allows developers access to logs and diagnostics",
    resource: "system:diagnostics:*",
    effect: "ALLOW",
    principals: ["role:DEVELOPER"],
    actions: ["read", "execute"],
    conditions: { "environment": "staging,production" },
    enabled: true,
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-06-10T00:00:00Z",
  },
  {
    id: "pol-4",
    name: "Deny Delete Production Data",
    description: "Prevents deletion of production tenant data",
    resource: "tenant:production:*",
    effect: "DENY",
    principals: ["role:*"],
    actions: ["delete"],
    conditions: { "environment": "production" },
    enabled: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

let mockApiKeys: ApiKey[] = [
  {
    id: "key-1",
    name: "Production API",
    key: "sk_prod_" + crypto.randomBytes(16).toString("hex"),
    maskedKey: "sk_prod_****...****a3f2",
    scopes: ["tenants.read", "billing.read", "reports.read"],
    rateLimit: 1000,
    expiresAt: "2025-12-31T23:59:59Z",
    lastUsedAt: "2024-07-19T14:30:00Z",
    createdBy: "admin@system.com",
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "key-2",
    name: "Staging Integration",
    key: "sk_stg_" + crypto.randomBytes(16).toString("hex"),
    maskedKey: "sk_stg_****...****b7e1",
    scopes: ["tenants.read", "tenants.write", "users.read", "system.diagnostics"],
    rateLimit: 5000,
    expiresAt: null,
    lastUsedAt: "2024-07-18T09:15:00Z",
    createdBy: "dev@system.com",
    status: "active",
    createdAt: "2024-03-15T00:00:00Z",
  },
  {
    id: "key-3",
    name: "Webhook Service",
    key: "sk_whk_" + crypto.randomBytes(16).toString("hex"),
    maskedKey: "sk_whk_****...****c4d8",
    scopes: ["tenants.read", "billing.read"],
    rateLimit: 500,
    expiresAt: "2024-06-30T23:59:59Z",
    lastUsedAt: "2024-06-30T23:50:00Z",
    createdBy: "integrations@system.com",
    status: "expired",
    createdAt: "2024-01-10T00:00:00Z",
  },
  {
    id: "key-4",
    name: "Mobile App",
    key: "sk_mob_" + crypto.randomBytes(16).toString("hex"),
    maskedKey: "sk_mob_****...****e9a5",
    scopes: ["users.read", "tenants.read"],
    rateLimit: 2000,
    expiresAt: "2025-06-30T23:59:59Z",
    lastUsedAt: "2024-07-19T16:45:00Z",
    createdBy: "mobile-team@system.com",
    status: "active",
    createdAt: "2024-04-01T00:00:00Z",
  },
];

// ══════════════════════════════════════════════════════════
// IAM STATS
// ══════════════════════════════════════════════════════════

export const getIAMStatsService = async () => {
  // Get real role count from DB
  const roleGroups = await prisma.user.groupBy({
    by: ['role'],
    _count: { role: true },
  });

  return {
    totalRoles: roleGroups.length,
    totalPermissions: 15, // from RolePermission model fields
    totalPolicies: 0,
    activeApiKeys: 0,
    permissionGroups: 1,
    customRoles: 0,
  };
};

// ══════════════════════════════════════════════════════════
// ROLES SERVICE
// ══════════════════════════════════════════════════════════

export const getRolesService = async (filters: { search?: string; parentRole?: string }): Promise<Role[]> => {
  // Get actual roles by counting distinct user roles
  const users = await prisma.user.groupBy({
    by: ['role'],
    _count: { role: true },
  });

  const roleDescriptions: Record<string, string> = {
    SUPER_ADMIN: "Full system access with all privileges. Can manage tenants, billing, and system configuration.",
    ADMIN: "Tenant administrator. Manages school settings, users, and modules.",
    TEACHER: "Teaching staff. Can view students, mark attendance, enter marks.",
    STUDENT: "Student role. Limited read-only access to own data.",
    PRINCIPAL: "Principal access. Can view reports, approve leaves, manage staff.",
    STAFF: "Non-teaching staff. Basic access to assigned modules.",
  };

  let roles: Role[] = users.map((u, i) => ({
    id: `role-${i + 1}`,
    name: u.role,
    displayName: u.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    description: roleDescriptions[u.role] || `${u.role} role`,
    color: ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"][i % 6],
    parentRole: u.role === "SUPER_ADMIN" ? null : "SUPER_ADMIN",
    isSystem: true,
    usersCount: u._count.role,
    permissions: u.role === "SUPER_ADMIN" ? ["*"] : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  if (filters.search) {
    const s = filters.search.toLowerCase();
    roles = roles.filter((r) => r.name.toLowerCase().includes(s) || r.displayName.toLowerCase().includes(s));
  }
  return roles;
};

export const getRoleByIdService = async (id: string) => {
  return mockRoles.find((r) => r.id === id) || null;
};

export const createRoleService = async (data: Partial<Role>) => {
  const newRole: Role = {
    id: `role-${Date.now()}`,
    name: data.name || "NEW_ROLE",
    displayName: data.displayName || "New Role",
    description: data.description || "",
    color: data.color || "#6366f1",
    parentRole: data.parentRole || null,
    isSystem: false,
    usersCount: 0,
    permissions: data.permissions || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockRoles.push(newRole);
  return newRole;
};

export const updateRoleService = async (id: string, data: Partial<Role>) => {
  const idx = mockRoles.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error("Role not found");
  mockRoles[idx] = { ...mockRoles[idx], ...data, updatedAt: new Date().toISOString() };
  return mockRoles[idx];
};

export const deleteRoleService = async (id: string) => {
  const idx = mockRoles.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error("Role not found");
  if (mockRoles[idx].isSystem) throw new Error("Cannot delete system roles");
  mockRoles.splice(idx, 1);
};

// ══════════════════════════════════════════════════════════
// PERMISSIONS SERVICE
// ══════════════════════════════════════════════════════════

export const getAllPermissionsService = async () => {
  return mockPermissions;
};

// ══════════════════════════════════════════════════════════
// PERMISSION MATRIX SERVICE
// ══════════════════════════════════════════════════════════

export const getPermissionMatrixService = async () => {
  const matrix: Record<string, Record<string, boolean>> = {};
  for (const role of mockRoles) {
    matrix[role.name] = {};
    for (const perm of mockPermissions) {
      matrix[role.name][perm.key] = role.permissions.includes("*") || role.permissions.includes(perm.key);
    }
  }
  return { roles: mockRoles, permissions: mockPermissions, matrix };
};

export const updatePermissionMatrixService = async (data: { roleName: string; permissionKey: string; granted: boolean }) => {
  const role = mockRoles.find((r) => r.name === data.roleName);
  if (!role) throw new Error("Role not found");
  if (data.granted) {
    if (!role.permissions.includes(data.permissionKey)) {
      role.permissions.push(data.permissionKey);
    }
  } else {
    role.permissions = role.permissions.filter((p) => p !== data.permissionKey);
  }
  role.updatedAt = new Date().toISOString();
  return { success: true, role };
};

// ══════════════════════════════════════════════════════════
// PERMISSION GROUPS SERVICE
// ══════════════════════════════════════════════════════════

export const getPermissionGroupsService = async () => {
  return mockPermissionGroups;
};

export const createPermissionGroupService = async (data: Partial<PermissionGroup>) => {
  const group: PermissionGroup = {
    id: `grp-${Date.now()}`,
    name: data.name || "New Group",
    description: data.description || "",
    icon: data.icon || "Folder",
    permissions: data.permissions || [],
    color: data.color || "#6366f1",
    createdAt: new Date().toISOString(),
  };
  mockPermissionGroups.push(group);
  return group;
};

export const updatePermissionGroupService = async (id: string, data: Partial<PermissionGroup>) => {
  const idx = mockPermissionGroups.findIndex((g) => g.id === id);
  if (idx === -1) throw new Error("Permission group not found");
  mockPermissionGroups[idx] = { ...mockPermissionGroups[idx], ...data };
  return mockPermissionGroups[idx];
};

export const deletePermissionGroupService = async (id: string) => {
  const idx = mockPermissionGroups.findIndex((g) => g.id === id);
  if (idx === -1) throw new Error("Permission group not found");
  mockPermissionGroups.splice(idx, 1);
};

// ══════════════════════════════════════════════════════════
// RESOURCE POLICIES SERVICE
// ══════════════════════════════════════════════════════════

export const getResourcePoliciesService = async () => {
  return mockResourcePolicies;
};

export const createResourcePolicyService = async (data: Partial<ResourcePolicy>) => {
  const policy: ResourcePolicy = {
    id: `pol-${Date.now()}`,
    name: data.name || "New Policy",
    description: data.description || "",
    resource: data.resource || "*",
    effect: data.effect || "ALLOW",
    principals: data.principals || [],
    actions: data.actions || [],
    conditions: data.conditions || {},
    enabled: data.enabled ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockResourcePolicies.push(policy);
  return policy;
};

export const updateResourcePolicyService = async (id: string, data: Partial<ResourcePolicy>) => {
  const idx = mockResourcePolicies.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Policy not found");
  mockResourcePolicies[idx] = { ...mockResourcePolicies[idx], ...data, updatedAt: new Date().toISOString() };
  return mockResourcePolicies[idx];
};

export const deleteResourcePolicyService = async (id: string) => {
  const idx = mockResourcePolicies.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Policy not found");
  mockResourcePolicies.splice(idx, 1);
};

// ══════════════════════════════════════════════════════════
// API KEYS SERVICE
// ══════════════════════════════════════════════════════════

export const getApiPermissionsService = async () => {
  return mockApiKeys.map((k) => ({ ...k, key: undefined, maskedKey: k.maskedKey }));
};

export const createApiKeyService = async (data: { name: string; scopes: string[]; rateLimit?: number; expiresAt?: string }) => {
  const rawKey = `sk_${data.name.toLowerCase().replace(/\s/g, "_").slice(0, 4)}_${crypto.randomBytes(24).toString("hex")}`;
  const key: ApiKey = {
    id: `key-${Date.now()}`,
    name: data.name,
    key: rawKey,
    maskedKey: rawKey.slice(0, 8) + "****...****" + rawKey.slice(-4),
    scopes: data.scopes || [],
    rateLimit: data.rateLimit || 1000,
    expiresAt: data.expiresAt || null,
    lastUsedAt: null,
    createdBy: "admin@system.com",
    status: "active",
    createdAt: new Date().toISOString(),
  };
  mockApiKeys.push(key);
  // Return full key only on creation
  return { ...key };
};

export const revokeApiKeyService = async (id: string) => {
  const idx = mockApiKeys.findIndex((k) => k.id === id);
  if (idx === -1) throw new Error("API key not found");
  mockApiKeys[idx].status = "revoked";
};

export const updateApiKeyScopesService = async (id: string, scopes: string[]) => {
  const idx = mockApiKeys.findIndex((k) => k.id === id);
  if (idx === -1) throw new Error("API key not found");
  mockApiKeys[idx].scopes = scopes;
  return mockApiKeys[idx];
};
