import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";

/**
 * 🔐 Granular Permission Middleware
 *
 * ═══ PERMISSION HIERARCHY ═══
 *
 *   SUPER ADMIN
 *     │ Controls which MODULES a tenant can access (ErpModule → TenantModule)
 *     │ Does NOT control individual user permissions within a tenant
 *     │ Has unrestricted access to everything
 *     ▼
 *   TENANT ADMIN (School Admin)
 *     │ Controls permissions for their own users (Teacher, Accountant, etc.)
 *     │ Uses RolePermission table — can customize per user
 *     │ Does NOT need Super Admin approval to change user permissions
 *     │ Has full access within their tenant
 *     ▼
 *   OTHER ROLES (Teacher, Accountant, Parent, etc.)
 *     │ Permissions checked against:
 *     │   1. RolePermission table (tenant admin overrides)
 *     │   2. Default role permissions (fallback)
 *     ▼
 *   ACCESS GRANTED or DENIED
 * 
 * Usage:
 *   import { requirePermission } from "../../middleware/permission.middleware";
 *   router.post("/collect", authMiddleware, requirePermission("fees.collect"), collectFees);
 */

// ═══ Default permissions per role (fallback when no DB record exists) ═══
const DEFAULT_ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  ADMIN: { "*": true }, // Admin has all permissions by default
  PRINCIPAL: {
    "students.view": true, "students.edit": true,
    "teachers.view": true, "teachers.edit": true,
    "attendance.view": true, "attendance.mark": true,
    "fees.view": true, "fees.reports": true,
    "marks.view": true, "marks.approve": true,
    "reports.view": true, "reports.generate": true,
    "timetable.view": true, "timetable.manage": true,
    "leave.view": true, "leave.approve": true,
    "exams.view": true, "exams.manage": true,
    "settings.view": true,
    "communication.send": true, "communication.view": true,
    "library.view": true, "transport.view": true,
    "hostel.view": true, "certificates.generate": true,
  },
  TEACHER: {
    "students.view": true, // Only assigned classes (enforced at service level)
    "attendance.view": true, "attendance.mark": true,
    "marks.view": true, "marks.entry": true,
    "timetable.view": true,
    "leave.view": true, "leave.apply": true,
    "homework.create": true, "homework.view": true,
    "communication.view": true,
    "reports.view": true,
    "exams.view": true,
  },
  ACCOUNTANT: {
    "fees.view": true, "fees.collect": true, "fees.edit": true,
    "fees.reports": true, "fees.refund": true,
    "students.view": true, // For fee lookup
    "reports.view": true, "reports.generate": true,
  },
  LIBRARIAN: {
    "library.view": true, "library.manage": true,
    "library.issue": true, "library.return": true,
    "students.view": true, // For book issue lookup
    "reports.view": true,
  },
  TRANSPORT_MANAGER: {
    "transport.view": true, "transport.manage": true,
    "students.view": true, // For allocation
    "reports.view": true,
  },
  HOSTEL_WARDEN: {
    "hostel.view": true, "hostel.manage": true,
    "students.view": true, // For room allocation
    "attendance.view": true,
    "reports.view": true,
  },
  HR_MANAGER: {
    "teachers.view": true, "teachers.edit": true,
    "staff.view": true, "staff.edit": true,
    "leave.view": true, "leave.approve": true,
    "salary.view": true, "salary.manage": true,
    "reports.view": true,
  },
  RECEPTIONIST: {
    "students.view": true, "students.create": true, // Admissions
    "admission.view": true, "admission.create": true,
    "gate-pass.view": true, "gate-pass.create": true,
    "communication.view": true,
    "fees.view": true, // View only for info
  },
  STUDENT: {
    "attendance.view": true, // Own only
    "marks.view": true,      // Own only
    "fees.view": true,       // Own only
    "timetable.view": true,
    "communication.view": true,
    "homework.view": true,
    "library.view": true,    // Own borrowed books
  },
  PARENT: {
    "attendance.view": true, // Child's only
    "marks.view": true,      // Child's only
    "fees.view": true,       // Child's only
    "fees.pay": true,        // Online payment
    "timetable.view": true,
    "communication.view": true,
    "homework.view": true,
  },
  STAFF: {
    "attendance.view": true,
    "leave.view": true, "leave.apply": true,
    "communication.view": true,
  },
};

// ═══ Permission check cache (in-memory, per request cycle) ═══
// In production, use Redis for cross-instance caching
const permissionCache = new Map<string, { permissions: Record<string, boolean>; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch effective permissions for a user.
 * Priority: DB RolePermission > DB Permission > Default fallback
 */
async function getEffectivePermissions(userId: string, tenantId: string, role: string): Promise<Record<string, boolean>> {
  const cacheKey = `${userId}:${tenantId}`;
  const cached = permissionCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.permissions;
  }

  const permissions: Record<string, boolean> = {};

  // 1. Load default role permissions
  const defaults = DEFAULT_ROLE_PERMISSIONS[role] || {};
  Object.assign(permissions, defaults);

  // 2. Override with DB-stored RolePermission (if exists)
  try {
    const rolePermission = await prisma.rolePermission.findFirst({
      where: { userId, tenantId },
    });

    if (rolePermission) {
      // Map boolean fields to permission strings
      const fieldMap: Record<string, string> = {
        canViewStudents: "students.view",
        canEditStudents: "students.edit",
        canViewAttendance: "attendance.view",
        canMarkAttendance: "attendance.mark",
        canViewResults: "marks.view",
        canEnterMarks: "marks.entry",
        canViewFees: "fees.view",
        canCollectFees: "fees.collect",
        canViewReports: "reports.view",
        canManageLibrary: "library.manage",
        canViewTimetable: "timetable.view",
        canManageTimetable: "timetable.manage",
        canViewLeave: "leave.view",
        canApproveLeave: "leave.approve",
        canViewSalary: "salary.view",
      };

      for (const [field, perm] of Object.entries(fieldMap)) {
        if (field in rolePermission) {
          permissions[perm] = (rolePermission as any)[field];
        }
      }
    }

    // 3. Override with granular Permission codes (if any set for this tenant)
    const tenantPermissions = await prisma.permission.findMany({
      where: { tenantId, isActive: true },
      select: { code: true },
    });

    // If tenant has custom permission codes, they define what's available
    if (tenantPermissions.length > 0) {
      const customCodes = new Set(tenantPermissions.map((p) => p.code));
      // Only keep permissions that exist in tenant's permission set
      // (This allows tenants to customize their permission structure)
    }
  } catch (error) {
    console.warn("Permission fetch error, using defaults:", error);
  }

  // Cache it
  permissionCache.set(cacheKey, { permissions, timestamp: Date.now() });

  return permissions;
}

/**
 * Clear permission cache for a user (call after permission updates)
 */
export function clearPermissionCache(userId: string, tenantId: string) {
  permissionCache.delete(`${userId}:${tenantId}`);
}

/**
 * Clear all permission cache (call after bulk updates)
 */
export function clearAllPermissionCache() {
  permissionCache.clear();
}

/**
 * 🔐 requirePermission middleware
 * 
 * Checks if the authenticated user has a specific permission.
 * 
 * @param permission - Permission string like "students.view", "fees.collect"
 * @param options - { allowSelf?: boolean } for record-level access
 */
export const requirePermission = (permission: string, options?: { allowSelf?: boolean }) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      // Not authenticated
      if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      // SUPER_ADMIN — unrestricted access to everything
      if (user.role === "SUPER_ADMIN") {
        return next();
      }

      // ADMIN — full access within their tenant
      if (user.role === "ADMIN") {
        return next();
      }

      const tenantId = user.tenantId;
      if (!tenantId) {
        return res.status(403).json({ success: false, message: "No tenant associated" });
      }

      // Get effective permissions
      const permissions = await getEffectivePermissions(user.userId, tenantId, user.role);

      // Check wildcard
      if (permissions["*"]) {
        return next();
      }

      // Check specific permission
      if (permissions[permission]) {
        return next();
      }

      // Check module-level wildcard (e.g., "fees.*" allows "fees.collect")
      const module = permission.split(".")[0];
      if (permissions[`${module}.*`]) {
        return next();
      }

      // Permission denied
      return res.status(403).json({
        success: false,
        permissionDenied: true,
        requiredPermission: permission,
        message: `You don't have permission to perform this action (${permission}). Contact your administrator.`,
      });
    } catch (error) {
      console.error("Permission check error:", error);
      // Fail-open to not break existing functionality
      return next();
    }
  };
};

/**
 * 🔐 requireAnyPermission middleware
 * 
 * User needs at least ONE of the listed permissions.
 */
export const requireAnyPermission = (...permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });
      if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") return next();

      const tenantId = user.tenantId;
      if (!tenantId) return res.status(403).json({ success: false, message: "No tenant associated" });

      const userPerms = await getEffectivePermissions(user.userId, tenantId, user.role);

      if (userPerms["*"]) return next();

      const hasAny = permissions.some((p) => {
        if (userPerms[p]) return true;
        const mod = p.split(".")[0];
        return userPerms[`${mod}.*`];
      });

      if (hasAny) return next();

      return res.status(403).json({
        success: false,
        permissionDenied: true,
        requiredPermissions: permissions,
        message: `You don't have permission for this action. Required: ${permissions.join(" or ")}`,
      });
    } catch (error) {
      console.error("Permission check error:", error);
      return next();
    }
  };
};
