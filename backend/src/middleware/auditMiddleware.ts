import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════
// AUDIT MIDDLEWARE
// Auto-captures all write operations (POST, PUT, PATCH, DELETE)
// ══════════════════════════════════════════════════════════

/**
 * Parse user-agent for browser, device, OS info
 */
function parseUserAgent(userAgent?: string) {
  if (!userAgent) return { browser: "Unknown", device: "Unknown", os: "Unknown" };
  
  // Simple regex parsing (no external dependency)
  const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)[\/\s](\d+)/i);
  const osMatch = userAgent.match(/(Windows NT|Mac OS X|Linux|Android|iOS)[\/\s]?([0-9._]*)/i);
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);

  return {
    browser: browserMatch ? `${browserMatch[1]} ${browserMatch[2]}` : "Unknown",
    device: isMobile ? "Mobile" : "Desktop",
    os: osMatch ? `${osMatch[1]} ${osMatch[2]}`.trim() : "Unknown",
  };
}

/**
 * Get client IP address (handles proxy headers)
 */
function getClientIP(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return (typeof forwarded === "string" ? forwarded : forwarded[0]).split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "Unknown";
}

/**
 * Determine action type from HTTP method
 */
function getActionFromMethod(method: string, path: string): string {
  if (path.includes("/login")) return "LOGIN";
  if (path.includes("/logout")) return "LOGOUT";
  if (path.includes("/export")) return "EXPORT";
  if (path.includes("/print")) return "PRINT";
  if (path.includes("/approve")) return "APPROVE";
  if (path.includes("/reject")) return "REJECT";

  switch (method) {
    case "POST": return "CREATE";
    case "PUT":
    case "PATCH": return "UPDATE";
    case "DELETE": return "DELETE";
    default: return "VIEW";
  }
}

/**
 * Extract module name from URL path
 */
function getModuleFromPath(path: string): string {
  // Pattern: /api/{module}/... or /api/tenants/:id/{module}/...
  const parts = path.split("/").filter(Boolean);
  const apiIndex = parts.indexOf("api");
  if (apiIndex === -1) return "unknown";

  // Skip "api" and "tenants/:id" if present
  let moduleIndex = apiIndex + 1;
  if (parts[moduleIndex] === "tenants") {
    moduleIndex += 2; // skip "tenants" and ":tenantId"
  }

  return parts[moduleIndex] || "unknown";
}

/**
 * Calculate changes between two objects
 */
function calculateChanges(previousData: any, newData: any): any[] {
  if (!previousData || !newData) return [];

  const changes: any[] = [];
  const allKeys = new Set([...Object.keys(previousData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    // Skip internal fields
    if (["_id", "id", "createdAt", "updatedAt", "__v"].includes(key)) continue;

    const oldVal = previousData[key];
    const newVal = newData[key];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        field: key,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }

  return changes;
}

/**
 * Audit middleware - attaches to all routes
 * Only logs write operations (POST, PUT, PATCH, DELETE)
 */
export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const method = req.method.toUpperCase();

  // Only audit write operations
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return next();
  }

  // Skip health checks and internal routes
  const path = req.originalUrl || req.url;
  if (path.includes("/health") || path.includes("/ping") || path.includes("/api/search/reindex")) {
    return next();
  }

  // Skip the audit routes themselves to prevent infinite loops
  if (path.includes("/api/audit")) {
    return next();
  }

  // Capture original response.json to intercept response data
  const originalJson = res.json.bind(res);
  const startTime = Date.now();

  res.json = function (body: any) {
    // Only log successful operations
    if (res.statusCode >= 200 && res.statusCode < 300 && body?.success !== false) {
      const user = (req as any).user;
      const tenantId = req.params.tenantId as string;

      if (user && tenantId) {
        const { browser, device, os } = parseUserAgent(req.headers["user-agent"]);
        const action = getActionFromMethod(method, path);
        const module = getModuleFromPath(path);
        const duration = Date.now() - startTime;

        // Determine entity info from response
        const entityId = body?.data?.id || req.params.id || req.params.studentId || req.params.teacherId;
        const entityType = getEntityTypeFromModule(module);

        // Build audit entry
        const auditData: any = {
          tenantId,
          userId: user.id,
          userName: user.name || user.email || "Unknown",
          userRole: user.role || "UNKNOWN",
          action,
          module,
          entityId: entityId || undefined,
          entityType: entityType || undefined,
          ipAddress: getClientIP(req),
          userAgent: req.headers["user-agent"],
          browser,
          device,
          os,
          duration,
          isRollbackable: ["CREATE", "UPDATE", "DELETE"].includes(action),
        };

        // For updates, try to capture previous/new data
        if (action === "UPDATE" && body?.data) {
          auditData.newData = sanitizeData(body.data);
          // previousData would need to be set by the controller before update
          if ((req as any)._auditPreviousData) {
            auditData.previousData = (req as any)._auditPreviousData;
            auditData.changes = calculateChanges(auditData.previousData, auditData.newData);
          }
        } else if (action === "CREATE" && body?.data) {
          auditData.newData = sanitizeData(body.data);
        } else if (action === "DELETE") {
          if ((req as any)._auditPreviousData) {
            auditData.previousData = (req as any)._auditPreviousData;
          }
        }

        // Fire and forget - don't block response
        prisma.auditLog.create({ data: auditData }).catch((err) => {
          console.error("Audit log creation failed:", err.message);
        });
      }
    }

    return originalJson(body);
  } as any;

  next();
};

/**
 * Helper middleware: Capture previous data before update/delete
 * Use this in controllers: router.put("/:id", captureForAudit("Student"), updateHandler)
 */
export const captureForAudit = (modelName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entityId = req.params.id as string;
      if (entityId) {
        const model = (prisma as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
        if (model) {
          const existing = await model.findUnique({ where: { id: entityId } });
          if (existing) {
            (req as any)._auditPreviousData = sanitizeData(existing);
          }
        }
      }
    } catch (error) {
      // Don't block the request if capture fails
      console.error("Audit capture failed:", error);
    }
    next();
  };
};

/**
 * Map module names to entity types
 */
function getEntityTypeFromModule(module: string): string {
  const mapping: Record<string, string> = {
    students: "Student",
    teachers: "Teacher",
    teacher: "Teacher",
    fees: "Payment",
    attendance: "Attendance",
    exam: "Exam",
    exams: "Exam",
    timetable: "Timetable",
    transport: "Vehicle",
    library: "Book",
    hostel: "HostelRoom",
    hr: "Staff",
    communication: "Notice",
    certificates: "Certificate",
    inventory: "Asset",
    "gate-pass": "GatePass",
    events: "Event",
    helpdesk: "Ticket",
    workflow: "Workflow",
    forms: "FormTemplate",
    reports: "GeneratedReport",
    settings: "Settings",
    backup: "Backup",
    users: "User",
    classes: "Class",
    sections: "Section",
    subjects: "Subject",
  };
  return mapping[module] || module.charAt(0).toUpperCase() + module.slice(1);
}

/**
 * Remove sensitive fields from data before storing in audit log
 */
function sanitizeData(data: any): any {
  if (!data) return null;
  const sanitized = { ...data };
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.resetOtp;
  delete sanitized.resetOtpExpiry;
  delete sanitized.apiKey;
  delete sanitized.apiSecret;
  return sanitized;
}

/**
 * Login audit helper - call from auth controller
 */
export const auditLogin = async (
  tenantId: string,
  userId: string,
  userName: string,
  userRole: string,
  req: Request,
  isSuccessful: boolean = true,
  failReason?: string
) => {
  try {
    const { browser, device, os } = parseUserAgent(req.headers["user-agent"]);
    await prisma.loginHistory.create({
      data: {
        tenantId,
        userId,
        userName,
        userRole,
        action: isSuccessful ? "LOGIN" : "FAILED_LOGIN",
        ipAddress: getClientIP(req),
        userAgent: req.headers["user-agent"],
        browser,
        device,
        os,
        isSuccessful,
        failReason,
        loginAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Login audit failed:", error);
  }
};

/**
 * Logout audit helper - call from auth controller
 */
export const auditLogout = async (
  tenantId: string,
  userId: string,
  userName: string,
  userRole: string,
  req: Request
) => {
  try {
    const { browser, device, os } = parseUserAgent(req.headers["user-agent"]);

    // Find the last login for this user and update logoutAt
    const lastLogin = await prisma.loginHistory.findFirst({
      where: { tenantId, userId, action: "LOGIN", logoutAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (lastLogin) {
      const duration = Math.floor((Date.now() - lastLogin.loginAt.getTime()) / 1000);
      await prisma.loginHistory.update({
        where: { id: lastLogin.id },
        data: { logoutAt: new Date(), duration },
      });
    }

    // Also create a logout entry
    await prisma.loginHistory.create({
      data: {
        tenantId,
        userId,
        userName,
        userRole,
        action: "LOGOUT",
        ipAddress: getClientIP(req),
        userAgent: req.headers["user-agent"],
        browser,
        device,
        os,
        isSuccessful: true,
      },
    });
  } catch (error) {
    console.error("Logout audit failed:", error);
  }
};
