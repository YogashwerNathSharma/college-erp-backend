import { Request, Response } from "express";
import prisma from "../../utils/prisma";

// ══════════════════════════════════════════════════════════════
// GATE PASS CONTROLLER
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/gate-pass/dashboard
 * Dashboard stats + today's visitors + charts data
 */
export const getGatePassDashboard = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's visitors
    const todayVisitors = await prisma.gatePass.count({
      where: { tenantId, createdAt: { gte: today, lt: tomorrow } },
    });

    // Currently inside (status = IN)
    const currentlyInside = await prisma.gatePass.count({
      where: { tenantId, status: "IN" },
    });

    // Pending approval
    const pendingApproval = await prisma.gatePass.count({
      where: { tenantId, status: "PENDING" },
    });

    // Total this month
    const totalThisMonth = await prisma.gatePass.count({
      where: { tenantId, createdAt: { gte: startOfMonth } },
    });

    // Today's visitor list
    const todayVisitorList = await prisma.gatePass.findMany({
      where: { tenantId, createdAt: { gte: today, lt: tomorrow } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Daily visitor trend (last 7 days)
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await prisma.gatePass.count({
        where: { tenantId, createdAt: { gte: dayStart, lt: dayEnd } },
      });

      dailyTrend.push({
        date: dayStart.toISOString().split("T")[0],
        day: dayStart.toLocaleDateString("en-IN", { weekday: "short" }),
        visitors: count,
      });
    }

    // Purpose distribution
    const allPasses = await prisma.gatePass.findMany({
      where: { tenantId, createdAt: { gte: startOfMonth } },
      select: { purpose: true },
    });

    const purposeMap: Record<string, number> = {};
    allPasses.forEach((p) => {
      const purpose = p.purpose || "Other";
      purposeMap[purpose] = (purposeMap[purpose] || 0) + 1;
    });

    const purposeDistribution = Object.entries(purposeMap).map(([name, value]) => ({
      name,
      value,
    }));

    res.json({
      success: true,
      data: {
        stats: {
          todayVisitors,
          currentlyInside,
          pendingApproval,
          totalThisMonth,
        },
        todayVisitorList,
        dailyTrend,
        purposeDistribution,
      },
    });
  } catch (error: any) {
    console.error("Gate Pass Dashboard Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/gate-pass
 * List all gate passes with filters and pagination
 */
export const getAllGatePasses = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;
    const { status, search, page = "1", limit = "20", from, to } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { tenantId };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { visitorName: { contains: search as string, mode: "insensitive" } },
        { visitorPhone: { contains: search as string } },
        { purpose: { contains: search as string, mode: "insensitive" } },
        { visitingPerson: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) {
        const toDate = new Date(to as string);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const [passes, total] = await Promise.all([
      prisma.gatePass.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.gatePass.count({ where }),
    ]);

    res.json({
      success: true,
      data: passes,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    console.error("Get Gate Passes Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/gate-pass
 * Create a new gate pass (visitor entry)
 */
export const createGatePass = async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any;
    const {
      visitorName,
      visitorPhone,
      purpose,
      visitingPerson,
      department,
      vehicleNumber,
      idProofType,
      idProofNumber,
      photo,
      notes,
    } = req.body;

    if (!visitorName || !visitorPhone || !purpose || !visitingPerson) {
      return res.status(400).json({
        success: false,
        message: "visitorName, visitorPhone, purpose, and visitingPerson are required",
      });
    }

    // Check if approval is required
    const settings = await prisma.gatePassSetting.findUnique({
      where: { tenantId },
    });

    const initialStatus = settings?.requireApproval ? "PENDING" : "APPROVED";

    const gatePass = await prisma.gatePass.create({
      data: {
        tenantId,
        visitorName,
        visitorPhone,
        purpose,
        visitingPerson,
        department: department || null,
        vehicleNumber: vehicleNumber || null,
        idProofType: idProofType || null,
        idProofNumber: idProofNumber || null,
        photo: photo || null,
        notes: notes || null,
        status: initialStatus,
        entryTime: initialStatus === "APPROVED" ? new Date() : null,
      },
    });

    res.status(201).json({ success: true, data: gatePass });
  } catch (error: any) {
    console.error("Create Gate Pass Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/gate-pass/:id/status
 * Update gate pass status (approve, mark entry, mark exit, etc.)
 */
export const updateGatePassStatus = async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any;
    const id = req.params.id as string;
    const { status, notes } = req.body;

    const validStatuses = ["PENDING", "APPROVED", "REJECTED", "IN", "OUT", "COMPLETED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const updateData: any = { status };

    if (status === "APPROVED") {
      updateData.approvedBy = userId;
    }
    if (status === "IN") {
      updateData.entryTime = new Date();
    }
    if (status === "OUT" || status === "COMPLETED") {
      updateData.exitTime = new Date();
      if (status === "COMPLETED") updateData.status = "COMPLETED";
    }
    if (notes) {
      updateData.notes = notes;
    }

    const gatePass = await prisma.gatePass.update({
      where: { id, tenantId },
      data: updateData,
    });

    res.json({ success: true, data: gatePass });
  } catch (error: any) {
    console.error("Update Gate Pass Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/gate-pass/:id
 * Delete a gate pass record
 */
export const deleteGatePass = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;
    const id = req.params.id as string;

    await prisma.gatePass.delete({
      where: { id, tenantId },
    });

    res.json({ success: true, message: "Gate pass deleted" });
  } catch (error: any) {
    console.error("Delete Gate Pass Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/gate-pass/settings
 * Get gate pass settings for tenant
 */
export const getGatePassSettings = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;

    let settings = await prisma.gatePassSetting.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      settings = await prisma.gatePassSetting.create({
        data: { tenantId },
      });
    }

    res.json({ success: true, data: settings });
  } catch (error: any) {
    console.error("Get Gate Pass Settings Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/gate-pass/settings
 * Update gate pass settings
 */
export const updateGatePassSettings = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;
    const {
      requireApproval,
      autoApproveAfterMinutes,
      notifyOnEntry,
      notifyOnExit,
      allowedPurposes,
      workingHoursStart,
      workingHoursEnd,
    } = req.body;

    const settings = await prisma.gatePassSetting.upsert({
      where: { tenantId },
      update: {
        requireApproval: requireApproval ?? undefined,
        autoApproveAfterMinutes: autoApproveAfterMinutes ?? undefined,
        notifyOnEntry: notifyOnEntry ?? undefined,
        notifyOnExit: notifyOnExit ?? undefined,
        allowedPurposes: allowedPurposes ?? undefined,
        workingHoursStart: workingHoursStart ?? undefined,
        workingHoursEnd: workingHoursEnd ?? undefined,
      },
      create: {
        tenantId,
        requireApproval: requireApproval ?? true,
        autoApproveAfterMinutes,
        notifyOnEntry: notifyOnEntry ?? true,
        notifyOnExit: notifyOnExit ?? false,
        allowedPurposes,
        workingHoursStart,
        workingHoursEnd,
      },
    });

    res.json({ success: true, data: settings });
  } catch (error: any) {
    console.error("Update Gate Pass Settings Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
