import { Request, Response } from "express";
import {
  getAdminUsersService,
  getAdminUserByIdService,
  createAdminUserService,
  updateAdminUserService,
  deleteAdminUserService,
  bulkDeleteAdminUsersService,
  bulkUpdateStatusService,
  resetPasswordService,
  toggle2FAService,
  getLoginHistoryService,
  getActiveSessionsService,
  revokeSessionService,
  revokeAllUserSessionsService,
  getUserActivityService,
  getUserManagementStatsService,
} from "./user-management.service";

// ══════════════════════════════════════════════════════
// 📊 STATS
// ══════════════════════════════════════════════════════

export const getUserManagementStats = async (req: Request, res: Response) => {
  try {
    const stats = await getUserManagementStatsService();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// 👥 GET ALL ADMIN USERS
// ══════════════════════════════════════════════════════

export const getAdminUsers = async (req: Request, res: Response) => {
  try {
    const { search, role, status, department, page, limit, sortBy, sortOrder } = req.query;
    const data = await getAdminUsersService({
      search: search as string,
      role: role as string,
      status: status as string,
      department: department as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// 👤 GET SINGLE ADMIN USER
// ══════════════════════════════════════════════════════

export const getAdminUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await getAdminUserByIdService(id);
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// ➕ CREATE ADMIN USER
// ══════════════════════════════════════════════════════

export const createAdminUser = async (req: Request, res: Response) => {
  try {
    const user = await createAdminUserService(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// ✏️ UPDATE ADMIN USER
// ══════════════════════════════════════════════════════

export const updateAdminUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await updateAdminUserService(id, req.body);
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// 🗑️ DELETE ADMIN USER
// ══════════════════════════════════════════════════════

export const deleteAdminUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await deleteAdminUserService(id);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// 🗑️ BULK DELETE
// ══════════════════════════════════════════════════════

export const bulkDeleteAdminUsers = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: "ids array required" });
    }
    const result = await bulkDeleteAdminUsersService(ids);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// 🔄 BULK STATUS UPDATE
// ══════════════════════════════════════════════════════

export const bulkUpdateStatus = async (req: Request, res: Response) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || !status) {
      return res.status(400).json({ success: false, message: "ids array and status required" });
    }
    const result = await bulkUpdateStatusService(ids, status);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// 🔑 RESET PASSWORD
// ══════════════════════════════════════════════════════

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }
    const result = await resetPasswordService(id, newPassword);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// 🔐 TOGGLE 2FA
// ══════════════════════════════════════════════════════

export const toggle2FA = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    const result = await toggle2FAService(id, enabled);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// 📜 LOGIN HISTORY
// ══════════════════════════════════════════════════════

export const getLoginHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const history = await getLoginHistoryService(userId as string, limit);
    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// 🖥️ ACTIVE SESSIONS
// ══════════════════════════════════════════════════════

export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const sessions = await getActiveSessionsService(userId as string);
    res.json({ success: true, data: sessions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// ❌ REVOKE SESSION
// ══════════════════════════════════════════════════════

export const revokeSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await revokeSessionService(sessionId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// ❌ REVOKE ALL USER SESSIONS
// ══════════════════════════════════════════════════════

export const revokeAllUserSessions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await revokeAllUserSessionsService(userId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// 📋 USER ACTIVITY LOG
// ══════════════════════════════════════════════════════

export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const activities = await getUserActivityService(userId, limit);
    res.json({ success: true, data: activities });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
