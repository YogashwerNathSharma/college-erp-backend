import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════
// WORKFLOW ENGINE - Controller
// ══════════════════════════════════════════════════════════

/**
 * CREATE WORKFLOW TEMPLATE
 * POST /api/workflows
 */
export const createWorkflow = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req as any).user?.id;
    const { name, module, triggerEvent, description, steps } = req.body;

    if (!name || !module || !triggerEvent || !steps || !Array.isArray(steps)) {
      return res.status(400).json({
        success: false,
        message: "name, module, triggerEvent, and steps (array) are required",
      });
    }

    // Validate steps structure
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step.level || !step.approverRole) {
        return res.status(400).json({
          success: false,
          message: `Step ${i + 1} must have level and approverRole`,
        });
      }
    }

    const workflow = await prisma.workflow.create({
      data: {
        tenantId,
        name,
        module,
        triggerEvent,
        description: description || null,
        steps,
        createdBy: userId || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Workflow created successfully",
      data: workflow,
    });
  } catch (error: any) {
    console.error("createWorkflow error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * LIST ALL WORKFLOWS FOR TENANT
 * GET /api/workflows
 */
export const listWorkflows = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const { module, isActive } = req.query;

    const where: any = { tenantId, isDeleted: false };
    if (module) where.module = module as string;
    if (isActive !== undefined) where.isActive = isActive === "true";

    const workflows = await prisma.workflow.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { instances: true },
        },
      },
    });

    return res.json({
      success: true,
      data: workflows,
      total: workflows.length,
    });
  } catch (error: any) {
    console.error("listWorkflows error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET SINGLE WORKFLOW
 * GET /api/workflows/:id
 */
export const getWorkflow = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const { id } = req.params;

    const workflow = await prisma.workflow.findFirst({
      where: { id: id as string, tenantId, isDeleted: false },
      include: {
        instances: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!workflow) {
      return res.status(404).json({ success: false, message: "Workflow not found" });
    }

    return res.json({ success: true, data: workflow });
  } catch (error: any) {
    console.error("getWorkflow error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE WORKFLOW
 * PUT /api/workflows/:id
 */
export const updateWorkflow = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const { id } = req.params;
    const { name, description, steps, isActive } = req.body;

    const existing = await prisma.workflow.findFirst({
      where: { id: id as string, tenantId, isDeleted: false },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Workflow not found" });
    }

    const updated = await prisma.workflow.update({
      where: { id: id as string },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(steps && { steps }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return res.json({ success: true, message: "Workflow updated", data: updated });
  } catch (error: any) {
    console.error("updateWorkflow error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE WORKFLOW (soft)
 * DELETE /api/workflows/:id
 */
export const deleteWorkflow = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const { id } = req.params;

    await prisma.workflow.update({
      where: { id: id as string },
      data: { isDeleted: true, isActive: false },
    });

    return res.json({ success: true, message: "Workflow deleted" });
  } catch (error: any) {
    console.error("deleteWorkflow error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * INITIATE WORKFLOW INSTANCE
 * POST /api/workflows/initiate
 * Body: { workflowId, entityId, entityType, data }
 */
export const initiateWorkflow = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.name || "System";
    const { workflowId, entityId, entityType, data } = req.body;

    if (!workflowId || !entityId || !entityType) {
      return res.status(400).json({
        success: false,
        message: "workflowId, entityId, and entityType are required",
      });
    }

    // Get workflow template
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, tenantId, isActive: true, isDeleted: false },
    });

    if (!workflow) {
      return res.status(404).json({ success: false, message: "Active workflow not found" });
    }

    const steps = workflow.steps as any[];
    const totalSteps = steps.length;

    // Determine first step assignees
    const firstStep = steps[0];
    let currentAssignees: string[] = [];

    if (firstStep.approverUserId) {
      currentAssignees = [firstStep.approverUserId];
    } else {
      // Find users with the approver role
      const approvers = await prisma.user.findMany({
        where: { tenantId, role: firstStep.approverRole, status: "ACTIVE" },
        select: { id: true },
      });
      currentAssignees = approvers.map((u) => u.id);
    }

    const instance = await prisma.workflowInstance.create({
      data: {
        tenantId,
        workflowId,
        entityId,
        entityType,
        currentStep: 1,
        totalSteps,
        status: "PENDING",
        initiatedBy: userId,
        initiatorName: userName,
        data: data || null,
        history: [],
        currentAssignees: currentAssignees,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Workflow initiated",
      data: instance,
    });
  } catch (error: any) {
    console.error("initiateWorkflow error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * APPROVE WORKFLOW STEP
 * POST /api/workflows/:id/approve
 * Body: { remarks? }
 */
export const approveWorkflow = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.name || "Unknown";
    const { id } = req.params;
    const { remarks } = req.body;

    const instance = await prisma.workflowInstance.findFirst({
      where: { id: id as string, tenantId, status: { in: ["PENDING", "IN_PROGRESS"] } },
      include: { workflow: true },
    });

    if (!instance) {
      return res.status(404).json({ success: false, message: "Pending workflow instance not found" });
    }

    // Check if user is authorized to approve this step
    const assignees = (instance.currentAssignees as string[]) || [];
    if (assignees.length > 0 && !assignees.includes(userId)) {
      return res.status(403).json({ success: false, message: "You are not authorized to approve this step" });
    }

    const steps = instance.workflow.steps as any[];
    const currentStepIndex = instance.currentStep;
    const history = (instance.history as any[]) || [];

    // Add to history
    history.push({
      step: currentStepIndex,
      action: "APPROVED",
      by: userId,
      byName: userName,
      at: new Date().toISOString(),
      remarks: remarks || null,
    });

    // Check if this was the last step
    if (currentStepIndex >= instance.totalSteps) {
      // Workflow fully approved
      await prisma.workflowInstance.update({
        where: { id: id as string },
        data: {
          status: "APPROVED",
          history,
          currentStep: currentStepIndex,
          currentAssignees: [],
          completedAt: new Date(),
        },
      });

      return res.json({
        success: true,
        message: "Workflow fully approved",
        data: { status: "APPROVED", completedAt: new Date() },
      });
    } else {
      // Move to next step
      const nextStepIndex = currentStepIndex + 1;
      const nextStep = steps[nextStepIndex - 1]; // 0-indexed array

      let nextAssignees: string[] = [];
      if (nextStep.approverUserId) {
        nextAssignees = [nextStep.approverUserId];
      } else {
        const approvers = await prisma.user.findMany({
          where: { tenantId, role: nextStep.approverRole, status: "ACTIVE" },
          select: { id: true },
        });
        nextAssignees = approvers.map((u) => u.id);
      }

      await prisma.workflowInstance.update({
        where: { id: id as string },
        data: {
          status: "IN_PROGRESS",
          currentStep: nextStepIndex,
          history,
          currentAssignees: nextAssignees,
        },
      });

      return res.json({
        success: true,
        message: `Step ${currentStepIndex} approved. Moved to step ${nextStepIndex}`,
        data: { currentStep: nextStepIndex, status: "IN_PROGRESS" },
      });
    }
  } catch (error: any) {
    console.error("approveWorkflow error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * REJECT WORKFLOW STEP
 * POST /api/workflows/:id/reject
 * Body: { remarks }
 */
export const rejectWorkflow = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.name || "Unknown";
    const { id } = req.params;
    const { remarks } = req.body;

    if (!remarks) {
      return res.status(400).json({ success: false, message: "Remarks required for rejection" });
    }

    const instance = await prisma.workflowInstance.findFirst({
      where: { id: id as string, tenantId, status: { in: ["PENDING", "IN_PROGRESS"] } },
    });

    if (!instance) {
      return res.status(404).json({ success: false, message: "Pending workflow instance not found" });
    }

    const assignees = (instance.currentAssignees as string[]) || [];
    if (assignees.length > 0 && !assignees.includes(userId)) {
      return res.status(403).json({ success: false, message: "You are not authorized to reject this step" });
    }

    const history = (instance.history as any[]) || [];
    history.push({
      step: instance.currentStep,
      action: "REJECTED",
      by: userId,
      byName: userName,
      at: new Date().toISOString(),
      remarks,
    });

    await prisma.workflowInstance.update({
      where: { id: id as string },
      data: {
        status: "REJECTED",
        history,
        currentAssignees: [],
        completedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: "Workflow rejected",
      data: { status: "REJECTED" },
    });
  } catch (error: any) {
    console.error("rejectWorkflow error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET PENDING APPROVALS FOR CURRENT USER
 * GET /api/workflows/pending
 */
export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    // Find instances where user is a current assignee OR has the right role
    const instances = await prisma.workflowInstance.findMany({
      where: {
        tenantId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      include: {
        workflow: { select: { name: true, module: true, steps: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter where currentAssignees includes userId or where current step role matches
    const pending = instances.filter((inst) => {
      const assignees = (inst.currentAssignees as string[]) || [];
      if (assignees.includes(userId)) return true;

      // Check if user's role matches the current step's approverRole
      const steps = inst.workflow.steps as any[];
      const currentStep = steps[inst.currentStep - 1];
      if (currentStep && currentStep.approverRole === userRole) return true;

      return false;
    });

    return res.json({
      success: true,
      data: pending,
      total: pending.length,
    });
  } catch (error: any) {
    console.error("getPendingApprovals error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET WORKFLOW INSTANCE HISTORY
 * GET /api/workflows/instances/:id/history
 */
export const getWorkflowHistory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const { id } = req.params;

    const instance = await prisma.workflowInstance.findFirst({
      where: { id: id as string, tenantId },
      include: {
        workflow: { select: { name: true, module: true, steps: true } },
      },
    });

    if (!instance) {
      return res.status(404).json({ success: false, message: "Workflow instance not found" });
    }

    return res.json({ success: true, data: instance });
  } catch (error: any) {
    console.error("getWorkflowHistory error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * LIST ALL WORKFLOW INSTANCES
 * GET /api/workflows/instances
 */
export const listWorkflowInstances = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const { status, entityType, page = "1", limit = "20" } = req.query;

    const where: any = { tenantId };
    if (status) where.status = status as string;
    if (entityType) where.entityType = entityType as string;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [instances, total] = await Promise.all([
      prisma.workflowInstance.findMany({
        where,
        include: {
          workflow: { select: { name: true, module: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.workflowInstance.count({ where }),
    ]);

    return res.json({
      success: true,
      data: instances,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error: any) {
    console.error("listWorkflowInstances error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * CANCEL WORKFLOW INSTANCE
 * POST /api/workflows/instances/:id/cancel
 */
export const cancelWorkflow = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.name || "Unknown";
    const { id } = req.params;
    const { remarks } = req.body;

    const instance = await prisma.workflowInstance.findFirst({
      where: { id: id as string, tenantId, status: { in: ["PENDING", "IN_PROGRESS"] } },
    });

    if (!instance) {
      return res.status(404).json({ success: false, message: "Active workflow instance not found" });
    }

    // Only initiator or admin can cancel
    if (instance.initiatedBy !== userId && (req as any).user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Only initiator or admin can cancel" });
    }

    const history = (instance.history as any[]) || [];
    history.push({
      step: instance.currentStep,
      action: "CANCELLED",
      by: userId,
      byName: userName,
      at: new Date().toISOString(),
      remarks: remarks || "Cancelled by user",
    });

    await prisma.workflowInstance.update({
      where: { id: id as string },
      data: {
        status: "CANCELLED",
        history,
        currentAssignees: [],
        completedAt: new Date(),
      },
    });

    return res.json({ success: true, message: "Workflow cancelled" });
  } catch (error: any) {
    console.error("cancelWorkflow error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * WORKFLOW STATS (for dashboard)
 * GET /api/workflows/stats
 */
export const getWorkflowStats = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;

    const [totalWorkflows, activeWorkflows, pendingInstances, approvedToday, rejectedToday] =
      await Promise.all([
        prisma.workflow.count({ where: { tenantId, isDeleted: false } }),
        prisma.workflow.count({ where: { tenantId, isActive: true, isDeleted: false } }),
        prisma.workflowInstance.count({
          where: { tenantId, status: { in: ["PENDING", "IN_PROGRESS"] } },
        }),
        prisma.workflowInstance.count({
          where: {
            tenantId,
            status: "APPROVED",
            completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
        prisma.workflowInstance.count({
          where: {
            tenantId,
            status: "REJECTED",
            completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
      ]);

    return res.json({
      success: true,
      data: {
        totalWorkflows,
        activeWorkflows,
        pendingInstances,
        approvedToday,
        rejectedToday,
      },
    });
  } catch (error: any) {
    console.error("getWorkflowStats error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
