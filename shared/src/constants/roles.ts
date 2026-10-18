//////////////////////////////////////////////////////
// 🔐 ROLES & ACCESS LEVELS
//////////////////////////////////////////////////////

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  TENANT_ADMIN: "TENANT_ADMIN",
  PRINCIPAL: "PRINCIPAL",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
} as const;

export type RoleKey = keyof typeof ROLES;
export type RoleValue = (typeof ROLES)[RoleKey];

export const ROLE_HIERARCHY: Record<RoleValue, number> = {
  SUPER_ADMIN: 100,
  TENANT_ADMIN: 80,
  PRINCIPAL: 60,
  TEACHER: 40,
  STUDENT: 20,
};

export const ROLE_LABELS: Record<RoleValue, string> = {
  SUPER_ADMIN: "Super Admin",
  TENANT_ADMIN: "School Admin",
  PRINCIPAL: "Principal",
  TEACHER: "Teacher",
  STUDENT: "Student",
};

export const ADMIN_ROLES: RoleValue[] = ["SUPER_ADMIN", "TENANT_ADMIN"];
export const STAFF_ROLES: RoleValue[] = ["SUPER_ADMIN", "TENANT_ADMIN", "PRINCIPAL", "TEACHER"];
export const ALL_ROLES: RoleValue[] = Object.values(ROLES);

/**
 * Check if a role has higher or equal authority than another
 */
export function hasAuthority(userRole: RoleValue, requiredRole: RoleValue): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
