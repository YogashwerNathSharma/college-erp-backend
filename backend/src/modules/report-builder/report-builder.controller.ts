import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════
// REPORT TEMPLATE CRUD
// ══════════════════════════════════════════════════════

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req as any).user?.id;

    const {
      name, module, description, query, columns, filters,
      chartType, chartConfig, groupBy, sortBy, sortOrder,
      format, pageSize, orientation, headerHtml, footerHtml, isPublic
    } = req.body;

    if (!name || !module || !query || !columns) {
      return res.status(400).json({
        success: false,
        message: "Name, module, query, and columns are required"
      });
    }

    const template = await prisma.reportTemplate.create({
      data: {
        tenantId,
        name,
        module,
        description,
        query,
        columns,
        filters: filters || [],
        chartType,
        chartConfig,
        groupBy,
        sortBy,
        sortOrder: sortOrder || "asc",
        format: format || "PDF",
        pageSize: pageSize || "A4",
        orientation: orientation || "PORTRAIT",
        headerHtml,
        footerHtml,
        isPublic: isPublic || false,
        createdBy: userId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Report template created successfully",
      data: template,
    });
  } catch (error: any) {
    console.error("Create template error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const { module, search, page = "1", limit = "20" } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {
      tenantId,
      isDeleted: false,
      isActive: true,
    };

    if (module) where.module = module as string;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.reportTemplate.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { generatedReports: true, scheduledReports: true } },
        },
      }),
      prisma.reportTemplate.count({ where }),
    ]);

    return res.json({
      success: true,
      data: templates,
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    console.error("Get templates error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const { id } = req.params;

    const template = await prisma.reportTemplate.findFirst({
      where: { id: id as string, tenantId, isDeleted: false },
      include: {
        generatedReports: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        scheduledReports: true,
      },
    });

    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    return res.json({ success: true, data: template });
  } catch (error: any) {
    console.error("Get template error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const { id } = req.params;

    const existing = await prisma.reportTemplate.findFirst({
      where: { id: id as string, tenantId, isDeleted: false },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    const template = await prisma.reportTemplate.update({
      where: { id: id as string },
      data: { ...req.body, updatedAt: new Date() },
    });

    return res.json({
      success: true,
      message: "Template updated successfully",
      data: template,
    });
  } catch (error: any) {
    console.error("Update template error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const { id } = req.params;

    await prisma.reportTemplate.update({
      where: { id: id as string },
      data: { isDeleted: true, isActive: false },
    });

    return res.json({ success: true, message: "Template deleted successfully" });
  } catch (error: any) {
    console.error("Delete template error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// REPORT GENERATION
// ══════════════════════════════════════════════════════

export const generateReport = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req as any).user?.id;
    const { templateId, parameters, format } = req.body;

    if (!templateId) {
      return res.status(400).json({ success: false, message: "Template ID is required" });
    }

    const template = await prisma.reportTemplate.findFirst({
      where: { id: templateId, tenantId, isDeleted: false },
    });

    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    // Create generated report record
    const generatedReport = await prisma.generatedReport.create({
      data: {
        tenantId,
        templateId,
        name: `${template.name} - ${new Date().toLocaleDateString("en-IN")}`,
        parameters: parameters || {},
        format: format || template.format,
        generatedBy: userId,
        status: "GENERATING",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Execute report query
    const reportData = await executeReportQuery(tenantId, template, parameters);

    // Update with results
    await prisma.generatedReport.update({
      where: { id: generatedReport.id },
      data: {
        status: "COMPLETED",
        rowCount: reportData.length,
        fileUrl: `/api/report-builder/download/${generatedReport.id}`,
      },
    });

    return res.json({
      success: true,
      message: "Report generated successfully",
      data: {
        report: generatedReport,
        preview: reportData.slice(0, 50), // First 50 rows as preview
        totalRows: reportData.length,
      },
    });
  } catch (error: any) {
    console.error("Generate report error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const previewReport = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const { templateId, parameters } = req.query;

    if (!templateId) {
      return res.status(400).json({ success: false, message: "Template ID is required" });
    }

    const template = await prisma.reportTemplate.findFirst({
      where: { id: templateId as string, tenantId, isDeleted: false },
    });

    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    const parsedParams = parameters ? JSON.parse(parameters as string) : {};
    const reportData = await executeReportQuery(tenantId, template, parsedParams, 25);

    return res.json({
      success: true,
      data: {
        columns: template.columns,
        rows: reportData,
        totalRows: reportData.length,
        chartType: template.chartType,
        chartConfig: template.chartConfig,
      },
    });
  } catch (error: any) {
    console.error("Preview report error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getGeneratedReports = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const { page = "1", limit = "20", templateId } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { tenantId };
    if (templateId) where.templateId = templateId as string;

    const [reports, total] = await Promise.all([
      prisma.generatedReport.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { template: { select: { name: true, module: true } } },
      }),
      prisma.generatedReport.count({ where }),
    ]);

    return res.json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    console.error("Get generated reports error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// SCHEDULED REPORTS
// ══════════════════════════════════════════════════════

export const createSchedule = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const {
      templateId, name, frequency, dayOfWeek, dayOfMonth,
      time, recipients, format, parameters
    } = req.body;

    if (!templateId || !name || !frequency || !time || !recipients?.length) {
      return res.status(400).json({
        success: false,
        message: "templateId, name, frequency, time, and recipients are required"
      });
    }

    const nextRunAt = calculateNextRun(frequency, time, dayOfWeek, dayOfMonth);

    const schedule = await prisma.scheduledReport.create({
      data: {
        tenantId,
        templateId,
        name,
        frequency,
        dayOfWeek,
        dayOfMonth,
        time,
        recipients,
        format: format || "PDF",
        parameters: parameters || {},
        nextRunAt,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Report schedule created successfully",
      data: schedule,
    });
  } catch (error: any) {
    console.error("Create schedule error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSchedules = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;

    const schedules = await prisma.scheduledReport.findMany({
      where: { tenantId },
      orderBy: { nextRunAt: "asc" },
      include: { template: { select: { name: true, module: true } } },
    });

    return res.json({ success: true, data: schedules });
  } catch (error: any) {
    console.error("Get schedules error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const { id } = req.params;

    const existing = await prisma.scheduledReport.findFirst({
      where: { id: id as string, tenantId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Schedule not found" });
    }

    const data = { ...req.body };
    if (data.frequency || data.time || data.dayOfWeek || data.dayOfMonth) {
      data.nextRunAt = calculateNextRun(
        data.frequency || existing.frequency,
        data.time || existing.time,
        data.dayOfWeek ?? existing.dayOfWeek,
        data.dayOfMonth ?? existing.dayOfMonth
      );
    }

    const schedule = await prisma.scheduledReport.update({
      where: { id: id as string },
      data,
    });

    return res.json({
      success: true,
      message: "Schedule updated successfully",
      data: schedule,
    });
  } catch (error: any) {
    console.error("Update schedule error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const { id } = req.params;

    await prisma.scheduledReport.delete({
      where: { id: id as string },
    });

    return res.json({ success: true, message: "Schedule deleted successfully" });
  } catch (error: any) {
    console.error("Delete schedule error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// DASHBOARD STATS
// ══════════════════════════════════════════════════════

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;

    const [
      totalTemplates,
      totalGenerated,
      activeSchedules,
      recentReports,
      moduleDistribution
    ] = await Promise.all([
      prisma.reportTemplate.count({ where: { tenantId, isDeleted: false } }),
      prisma.generatedReport.count({ where: { tenantId } }),
      prisma.scheduledReport.count({ where: { tenantId, isActive: true } }),
      prisma.generatedReport.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { template: { select: { name: true, module: true } } },
      }),
      prisma.reportTemplate.groupBy({
        by: ["module"],
        where: { tenantId, isDeleted: false },
        _count: { id: true },
      }),
    ]);

    // Generated today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const generatedToday = await prisma.generatedReport.count({
      where: { tenantId, createdAt: { gte: todayStart } },
    });

    return res.json({
      success: true,
      data: {
        totalTemplates,
        totalGenerated,
        generatedToday,
        activeSchedules,
        recentReports,
        moduleDistribution: moduleDistribution.map(m => ({
          module: m.module,
          count: m._count.id,
        })),
      },
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════

async function executeReportQuery(
  tenantId: string,
  template: any,
  parameters: any = {},
  limit?: number
): Promise<any[]> {
  const query = template.query as any;
  const collection = query.collection;

  // Build where clause from template conditions + user parameters
  const where: any = { tenantId };

  // Apply template conditions
  if (query.conditions && Array.isArray(query.conditions)) {
    for (const condition of query.conditions) {
      if (condition.field && condition.operator && condition.value !== undefined) {
        switch (condition.operator) {
          case "equals": where[condition.field] = condition.value; break;
          case "contains": where[condition.field] = { contains: condition.value, mode: "insensitive" }; break;
          case "gte": where[condition.field] = { gte: condition.value }; break;
          case "lte": where[condition.field] = { lte: condition.value }; break;
          case "in": where[condition.field] = { in: condition.value }; break;
          case "not": where[condition.field] = { not: condition.value }; break;
        }
      }
    }
  }

  // Apply user-provided date range filter
  if (parameters.dateFrom || parameters.dateTo) {
    const dateField = query.dateField || "createdAt";
    where[dateField] = {};
    if (parameters.dateFrom) where[dateField].gte = new Date(parameters.dateFrom);
    if (parameters.dateTo) where[dateField].lte = new Date(parameters.dateTo);
  }

  // Apply user-provided filters
  if (parameters.classId) where.classId = parameters.classId;
  if (parameters.sectionId) where.sectionId = parameters.sectionId;
  if (parameters.status) where.status = parameters.status;

  // Select fields
  const select: any = {};
  const columns = template.columns as any[];
  if (columns && columns.length > 0) {
    for (const col of columns) {
      if (col.field && !col.field.includes(".")) {
        select[col.field] = true;
      }
    }
  }

  // Execute query based on collection
  let data: any[] = [];
  const queryOptions: any = {
    where,
    take: limit || 1000,
    orderBy: template.sortBy
      ? { [template.sortBy]: template.sortOrder || "asc" }
      : { createdAt: "desc" },
  };

  if (Object.keys(select).length > 0) {
    queryOptions.select = select;
  }

  switch (collection) {
    case "student":
    case "students":
      data = await prisma.student.findMany(queryOptions);
      break;
    case "teacher":
    case "teachers":
      data = await prisma.teacher.findMany(queryOptions);
      break;
    case "payment":
    case "payments":
      data = await prisma.payment.findMany(queryOptions);
      break;
    case "attendance":
      data = await prisma.attendance.findMany(queryOptions);
      break;
    case "exam":
    case "exams":
      data = await prisma.exam.findMany(queryOptions);
      break;
    case "fees":
    case "studentFee":
      data = await prisma.studentFee.findMany(queryOptions);
      break;
    case "book":
    case "books":
      data = await prisma.book.findMany(queryOptions);
      break;
    case "asset":
    case "assets":
      data = await prisma.asset.findMany(queryOptions);
      break;
    case "leave":
    case "leaves":
      data = await prisma.leave.findMany(queryOptions);
      break;
    case "vehicle":
    case "vehicles":
      data = await prisma.vehicle.findMany(queryOptions);
      break;
    default:
      // Try generic prisma query
      if ((prisma as any)[collection]) {
        data = await (prisma as any)[collection].findMany(queryOptions);
      }
      break;
  }

  return data;
}

function calculateNextRun(
  frequency: string,
  time: string,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null
): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  switch (frequency) {
    case "DAILY":
      if (next <= now) next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      const targetDay = dayOfWeek || 1; // Monday default
      const currentDay = next.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0 || (daysUntil === 0 && next <= now)) {
        daysUntil += 7;
      }
      next.setDate(next.getDate() + daysUntil);
      break;
    case "MONTHLY":
      next.setDate(dayOfMonth || 1);
      if (next <= now) next.setMonth(next.getMonth() + 1);
      break;
    case "QUARTERLY":
      const currentMonth = next.getMonth();
      const nextQuarterMonth = Math.ceil((currentMonth + 1) / 3) * 3;
      next.setMonth(nextQuarterMonth);
      next.setDate(dayOfMonth || 1);
      if (next <= now) next.setMonth(next.getMonth() + 3);
      break;
    case "YEARLY":
      next.setMonth(0);
      next.setDate(1);
      if (next <= now) next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}
