import {
  getApprovalQueue,
  submitForApproval,
  approveItem,
  rejectItem,
  getApprovalStats,
} from "./approval.service";

// ═══════════════════════════════════════════════════════════════════
// APPROVAL CONTROLLER — REST endpoints for ApprovalQueue
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/approvals
 * Query: type, status, page, limit
 */
export const listApprovals = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "No tenant context" });
    }

    const { type, status, page, limit } = req.query;

    // Role-based filtering: Teacher only sees their own requests
    let requesterId: string | undefined;
    if (req.user?.role === "TEACHER" || req.user?.role === "ACCOUNTANT") {
      requesterId = req.user.userId;
    }

    const result = await getApprovalQueue({
      tenantId,
      type: type as string,
      status: status as string,
      requesterId,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("listApprovals error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/approvals
 * Body: { type, entityId, entityType, data?, remarks? }
 */
export const createApproval = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    if (!tenantId || !userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { type, entityId, entityType, data, remarks } = req.body;

    if (!type || !entityId || !entityType) {
      return res.status(400).json({
        success: false,
        message: "type, entityId, and entityType are required",
      });
    }

    const validTypes = ["MARKS", "LEAVE", "FEE_EDIT", "ADMISSION"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
      });
    }

    const approval = await submitForApproval({
      tenantId,
      requesterId: userId,
      type,
      entityId,
      entityType,
      data,
      remarks,
    });

    return res.status(201).json({
      success: true,
      message: "Submitted for approval",
      data: approval,
    });
  } catch (error: any) {
    console.error("createApproval error:", error);
    if (error.message.includes("pending approval already exists")) {
      return res.status(409).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/approvals/:id/approve
 * Body: { remarks? }
 */
export const approveApproval = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    if (!tenantId || !userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    const { remarks } = req.body;

    const result = await approveItem({
      id,
      tenantId,
      approverId: userId,
      remarks,
    });

    return res.json({
      success: true,
      message: "Approved successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("approveApproval error:", error);
    if (error.message.includes("not found")) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/approvals/:id/reject
 * Body: { remarks? }
 */
export const rejectApproval = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    if (!tenantId || !userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    const { remarks } = req.body;

    const result = await rejectItem({
      id,
      tenantId,
      approverId: userId,
      remarks,
    });

    return res.json({
      success: true,
      message: "Rejected",
      data: result,
    });
  } catch (error: any) {
    console.error("rejectApproval error:", error);
    if (error.message.includes("not found")) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/approvals/stats
 */
export const getStats = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "No tenant context" });
    }

    const stats = await getApprovalStats(tenantId);
    return res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error("getApprovalStats error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
