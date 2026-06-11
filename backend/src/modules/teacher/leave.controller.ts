

import { Request, Response } from "express";
import {
  applyLeave,
  getLeaves,
  getLeaveStats,
  updateLeaveStatus,
  cancelLeave,
} from "./leave.service";

// ✅ APPLY LEAVE
export const apply = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const leave = await applyLeave(req.body, tenantId);
    return res.status(201).json({ success: true, data: leave });
  } catch (e: any) {
    console.error("APPLY LEAVE ERROR:", e);
    return res.status(400).json({ success: false, message: e.message });
  }
};

// ✅ GET ALL LEAVES
export const getAll = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getLeaves(req.query, tenantId);
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("GET LEAVES ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ GET STATS
export const stats = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const teacherId = req.query.teacherId as string | undefined;
    const data = await getLeaveStats(tenantId, teacherId);
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("LEAVE STATS ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ APPROVE / REJECT
export const approve = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const data = await updateLeaveStatus(id, status, userId, tenantId);
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("APPROVE LEAVE ERROR:", e);
    return res.status(400).json({ success: false, message: e.message });
  }
};

// ✅ CANCEL / DELETE
export const remove = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await cancelLeave(id, tenantId);
    return res.json({ success: true, message: "Leave cancelled successfully" });
  } catch (e: any) {
    console.error("CANCEL LEAVE ERROR:", e);
    return res.status(400).json({ success: false, message: e.message });
  }
};

