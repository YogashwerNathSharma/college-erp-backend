import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════
// DYNAMIC FORM BUILDER - Controller
// ══════════════════════════════════════════════════════════

/**
 * CREATE FORM TEMPLATE
 * POST /api/forms
 */
export const createForm = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const userId = (req as any).user?.id;
    const { name, description, module, fields, settings } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Form name is required" });
    }

    // Validate fields if provided
    if (fields && Array.isArray(fields)) {
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        if (!field.id || !field.label || !field.type) {
          return res.status(400).json({
            success: false,
            message: `Field at index ${i} must have id, label, and type`,
          });
        }
      }
    }

    const form = await prisma.formTemplate.create({
      data: {
        tenantId,
        name,
        description: description || null,
        module: module || null,
        fields: fields || [],
        settings: settings || {},
        createdBy: userId || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Form created successfully",
      data: form,
    });
  } catch (error: any) {
    console.error("createForm error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * LIST FORMS
 * GET /api/forms
 */
export const listForms = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const { module, isPublished, page = "1", limit = "20" } = req.query;

    const where: any = { tenantId, isDeleted: false };
    if (module) where.module = module as string;
    if (isPublished !== undefined) where.isPublished = isPublished === "true";

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [forms, total] = await Promise.all([
      prisma.formTemplate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit as string),
        include: {
          _count: { select: { submissions: true } },
        },
      }),
      prisma.formTemplate.count({ where }),
    ]);

    return res.json({
      success: true,
      data: forms,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error: any) {
    console.error("listForms error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET SINGLE FORM
 * GET /api/forms/:id
 */
export const getForm = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const { id } = req.params;

    const form = await prisma.formTemplate.findFirst({
      where: { id: id as string, tenantId, isDeleted: false },
      include: {
        _count: { select: { submissions: true } },
      },
    });

    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    return res.json({ success: true, data: form });
  } catch (error: any) {
    console.error("getForm error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE FORM
 * PUT /api/forms/:id
 */
export const updateForm = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const { id } = req.params;
    const { name, description, module, fields, settings, isPublished } = req.body;

    const existing = await prisma.formTemplate.findFirst({
      where: { id: id as string, tenantId, isDeleted: false },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    const updated = await prisma.formTemplate.update({
      where: { id: id as string },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(module !== undefined && { module }),
        ...(fields && { fields }),
        ...(settings && { settings }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    return res.json({ success: true, message: "Form updated", data: updated });
  } catch (error: any) {
    console.error("updateForm error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE FORM (soft)
 * DELETE /api/forms/:id
 */
export const deleteForm = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const { id } = req.params;

    const existing = await prisma.formTemplate.findFirst({
      where: { id: id as string, tenantId, isDeleted: false },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    await prisma.formTemplate.update({
      where: { id: id as string },
      data: { isDeleted: true, isActive: false, isPublished: false },
    });

    return res.json({ success: true, message: "Form deleted" });
  } catch (error: any) {
    console.error("deleteForm error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DUPLICATE FORM
 * POST /api/forms/:id/duplicate
 */
export const duplicateForm = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const original = await prisma.formTemplate.findFirst({
      where: { id: id as string, tenantId, isDeleted: false },
    });

    if (!original) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    const duplicate = await prisma.formTemplate.create({
      data: {
        tenantId,
        name: `${original.name} (Copy)`,
        description: original.description,
        module: original.module,
        fields: original.fields as any,
        settings: original.settings as any,
        isPublished: false,
        createdBy: userId || null,
      },
    });

    return res.status(201).json({ success: true, message: "Form duplicated", data: duplicate });
  } catch (error: any) {
    console.error("duplicateForm error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * SUBMIT FORM (Public or Authenticated)
 * POST /api/forms/:id/submit
 */
export const submitForm = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const userId = (req as any).user?.id || null;
    const userName = (req as any).user?.name || null;
    const userEmail = (req as any).user?.email || null;
    const { id } = req.params;
    const { data, status } = req.body;

    // Get form template
    const form = await prisma.formTemplate.findFirst({
      where: { id: id as string, tenantId, isDeleted: false, isActive: true },
    });

    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found or inactive" });
    }

    if (!form.isPublished) {
      return res.status(400).json({ success: false, message: "Form is not published yet" });
    }

    // Check settings
    const settings = form.settings as any;
    if (settings?.requireLogin && !userId) {
      return res.status(401).json({ success: false, message: "Login required to submit this form" });
    }

    // Check max submissions
    if (settings?.maxSubmissions > 0) {
      const count = await prisma.formSubmission.count({
        where: { formId: id as string, tenantId },
      });
      if (count >= settings.maxSubmissions) {
        return res.status(400).json({ success: false, message: "Maximum submissions reached" });
      }
    }

    // Check date range
    if (settings?.startDate && new Date() < new Date(settings.startDate)) {
      return res.status(400).json({ success: false, message: "Form is not open yet" });
    }
    if (settings?.endDate && new Date() > new Date(settings.endDate)) {
      return res.status(400).json({ success: false, message: "Form submission deadline has passed" });
    }

    // Validate required fields
    const fields = form.fields as any[];
    const errors: string[] = [];

    for (const field of fields) {
      if (field.required && (!data || !data[field.id] || data[field.id] === "")) {
        errors.push(`${field.label} is required`);
      }

      // Validate patterns if value exists
      if (data?.[field.id] && field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(data[field.id])) {
          errors.push(`${field.label} has invalid format`);
        }
      }

      // Validate min/max length
      if (data?.[field.id] && field.validation?.minLength) {
        if (String(data[field.id]).length < field.validation.minLength) {
          errors.push(`${field.label} must be at least ${field.validation.minLength} characters`);
        }
      }
      if (data?.[field.id] && field.validation?.maxLength) {
        if (String(data[field.id]).length > field.validation.maxLength) {
          errors.push(`${field.label} must be at most ${field.validation.maxLength} characters`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const submission = await prisma.formSubmission.create({
      data: {
        tenantId,
        formId: id as string,
        data: data || {},
        submittedBy: userId,
        userName: userName || data?.name || null,
        userEmail: userEmail || data?.email || null,
        status: status || "SUBMITTED",
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip || null,
        userAgent: req.headers["user-agent"] || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: settings?.successMessage || "Form submitted successfully",
      data: { id: submission.id },
    });
  } catch (error: any) {
    console.error("submitForm error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET FORM SUBMISSIONS
 * GET /api/forms/:id/submissions
 */
export const getFormSubmissions = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const { id } = req.params;
    const { status, page = "1", limit = "20", sortBy = "createdAt", sortOrder = "desc" } = req.query;

    const where: any = { tenantId, formId: id as string };
    if (status) where.status = status as string;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [submissions, total] = await Promise.all([
      prisma.formSubmission.findMany({
        where,
        orderBy: { [sortBy as string]: sortOrder as string },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.formSubmission.count({ where }),
    ]);

    return res.json({
      success: true,
      data: submissions,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error: any) {
    console.error("getFormSubmissions error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET SINGLE SUBMISSION
 * GET /api/forms/:id/submissions/:subId
 */
export const getSubmission = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const { id, subId } = req.params;

    const submission = await prisma.formSubmission.findFirst({
      where: { id: subId as string, formId: id as string, tenantId },
      include: { form: { select: { name: true, fields: true } } },
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    return res.json({ success: true, data: submission });
  } catch (error: any) {
    console.error("getSubmission error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE SUBMISSION STATUS (Review)
 * PUT /api/forms/:id/submissions/:subId/status
 */
export const updateSubmissionStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const userId = (req as any).user?.id;
    const { id, subId } = req.params;
    const { status, remarks } = req.body;

    if (!status || !["REVIEWED", "APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Valid status required (REVIEWED/APPROVED/REJECTED)" });
    }

    const submission = await prisma.formSubmission.findFirst({
      where: { id: subId as string, formId: id as string, tenantId },
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    const updated = await prisma.formSubmission.update({
      where: { id: subId as string },
      data: {
        status,
        reviewedBy: userId,
        reviewRemarks: remarks || null,
        reviewedAt: new Date(),
      },
    });

    return res.json({ success: true, message: `Submission ${status.toLowerCase()}`, data: updated });
  } catch (error: any) {
    console.error("updateSubmissionStatus error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * EXPORT SUBMISSIONS
 * GET /api/forms/:id/submissions/export
 */
export const exportSubmissions = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const { id } = req.params;
    const { format = "json" } = req.query;

    const form = await prisma.formTemplate.findFirst({
      where: { id: id as string, tenantId, isDeleted: false },
    });

    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    const submissions = await prisma.formSubmission.findMany({
      where: { formId: id as string, tenantId },
      orderBy: { createdAt: "desc" },
    });

    const fields = form.fields as any[];

    if (format === "csv") {
      // Build CSV
      const headers = ["#", ...fields.map((f) => f.label), "Status", "Submitted At", "Submitted By"];
      const rows = submissions.map((sub, index) => {
        const data = sub.data as any;
        return [
          index + 1,
          ...fields.map((f) => {
            const val = data[f.id];
            if (Array.isArray(val)) return val.join("; ");
            return val || "";
          }),
          sub.status,
          new Date(sub.createdAt).toLocaleString("en-IN"),
          sub.userName || sub.userEmail || "Anonymous",
        ];
      });

      const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${form.name}_submissions.csv"`);
      return res.send(csv);
    }

    // Default: JSON
    return res.json({
      success: true,
      form: { name: form.name, fields },
      data: submissions,
      total: submissions.length,
    });
  } catch (error: any) {
    console.error("exportSubmissions error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * FORM STATS
 * GET /api/forms/stats
 */
export const getFormStats = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;

    const [totalForms, publishedForms, totalSubmissions, todaySubmissions] = await Promise.all([
      prisma.formTemplate.count({ where: { tenantId, isDeleted: false } }),
      prisma.formTemplate.count({ where: { tenantId, isPublished: true, isDeleted: false } }),
      prisma.formSubmission.count({ where: { tenantId } }),
      prisma.formSubmission.count({
        where: {
          tenantId,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        totalForms,
        publishedForms,
        totalSubmissions,
        todaySubmissions,
      },
    });
  } catch (error: any) {
    console.error("getFormStats error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
