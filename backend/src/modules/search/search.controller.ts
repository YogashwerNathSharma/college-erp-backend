import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════
// GLOBAL SEARCH ENGINE CONTROLLER
// ══════════════════════════════════════════════════════════

/**
 * GET /api/search?q=query&type=&limit=
 * Global search across all entities
 */
export const globalSearch = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const { q, type, limit = "20" } = req.query;

    if (!q || (q as string).trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    const query = (q as string).trim();
    const limitNum = Math.min(parseInt(limit as string) || 20, 50);

    // Build where clause for SearchIndex
    const where: any = {
      tenantId,
      isActive: true,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { subtitle: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { keywords: { has: query.toLowerCase() } },
      ],
    };

    if (type) {
      where.entityType = type as string;
    }

    // Search in index
    const results = await prisma.searchIndex.findMany({
      where,
      take: limitNum,
      orderBy: [
        { title: "asc" }, // Exact matches first (approximation)
      ],
    });

    // If SearchIndex is empty or has few results, do direct search
    let directResults: any[] = [];
    if (results.length < limitNum) {
      directResults = await directSearch(tenantId, query, type as string, limitNum - results.length);
    }

    // Combine and deduplicate
    const allResults = [...results.map(formatIndexResult), ...directResults];
    const uniqueResults = deduplicateResults(allResults);

    // Group by entity type
    const grouped: Record<string, any[]> = {};
    for (const result of uniqueResults) {
      if (!grouped[result.entityType]) grouped[result.entityType] = [];
      grouped[result.entityType].push(result);
    }

    // Log search
    const userId = (req as any).user?.id;
    if (userId) {
      prisma.searchHistory.create({
        data: {
          query,
          userId,
          resultCount: uniqueResults.length,
          tenantId,
        },
      }).catch(() => {}); // fire and forget
    }

    res.json({
      success: true,
      data: {
        query,
        total: uniqueResults.length,
        results: uniqueResults.slice(0, limitNum),
        grouped,
      },
    });
  } catch (error: any) {
    console.error("Error in global search:", error);
    res.status(500).json({ success: false, message: "Search failed", error: error.message });
  }
};

/**
 * GET /api/search/suggestions?q=
 * Autocomplete suggestions (fast, limited results)
 */
export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const { q } = req.query;

    if (!q || (q as string).trim().length < 1) {
      return res.json({ success: true, data: [] });
    }

    const query = (q as string).trim();

    // Quick search in index - title only for speed
    const suggestions = await prisma.searchIndex.findMany({
      where: {
        tenantId,
        isActive: true,
        title: { contains: query, mode: "insensitive" },
      },
      select: {
        title: true,
        subtitle: true,
        entityType: true,
        route: true,
        icon: true,
      },
      take: 8,
    });

    res.json({ success: true, data: suggestions });
  } catch (error: any) {
    console.error("Error getting suggestions:", error);
    res.status(500).json({ success: false, message: "Failed to get suggestions", error: error.message });
  }
};

/**
 * POST /api/search/reindex
 * Rebuild search index for entire tenant
 */
export const reindexAll = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;

    // Delete existing index for this tenant
    await prisma.searchIndex.deleteMany({ where: { tenantId } });

    let totalIndexed = 0;

    // Index Students
    const students = await prisma.student.findMany({
      where: { tenantId, isDeleted: false },
      select: { id: true, firstName: true, lastName: true, admissionNo: true, fatherName: true, phone: true },
    });
    if (students.length > 0) {
      await prisma.searchIndex.createMany({
        data: students.map((s) => ({
          tenantId,
          entityType: "STUDENT",
          entityId: s.id,
          title: `${s.firstName} ${s.lastName}`,
          subtitle: `Adm: ${s.admissionNo || "N/A"}`,
          description: `Father: ${s.fatherName || ""}`,
          keywords: [`${s.firstName} ${s.lastName}`.toLowerCase(), s.admissionNo?.toLowerCase() || "", s.phone || ""].filter(Boolean),
          route: `/students/edit/${s.id}`,
          icon: "GraduationCap",
          category: "Student",
        })),
      });
      totalIndexed += students.length;
    }

    // Index Teachers
    const teachers = await prisma.teacher.findMany({
      where: { tenantId, isDeleted: false },
      select: { id: true, name: true, email: true, phone: true, department: true, employeeId: true },
    });
    if (teachers.length > 0) {
      await prisma.searchIndex.createMany({
        data: teachers.map((t) => ({
          tenantId,
          entityType: "STAFF",
          entityId: t.id,
          title: t.name,
          subtitle: t.department || t.email || "",
          description: `EmpID: ${t.employeeId || "N/A"}`,
          keywords: [t.name.toLowerCase(), t.email?.toLowerCase() || "", t.phone || "", t.employeeId || ""].filter(Boolean),
          route: `/teachers/profile/${t.id}`,
          icon: "UserCog",
          category: "Staff",
        })),
      });
      totalIndexed += teachers.length;
    }

    // Index Books
    try {
      const books = await prisma.book.findMany({
        where: { tenantId },
        select: { id: true, title: true, author: true, isbn: true, accessionNo: true },
      });
      if (books.length > 0) {
        await prisma.searchIndex.createMany({
          data: books.map((b) => ({
            tenantId,
            entityType: "BOOK",
            entityId: b.id,
            title: b.title,
            subtitle: `Author: ${b.author || "Unknown"}`,
            description: `ISBN: ${b.isbn || "N/A"} | Acc: ${b.accessionNo || "N/A"}`,
            keywords: [b.title.toLowerCase(), b.author?.toLowerCase() || "", b.isbn || ""].filter(Boolean),
            route: `/library`,
            icon: "BookOpen",
            category: "Library",
          })),
        });
        totalIndexed += books.length;
      }
    } catch (e) {}

    // Index Vehicles
    try {
      const vehicles = await prisma.vehicle.findMany({
        where: { tenantId },
        select: { id: true, vehicleNo: true, driverName: true, type: true },
      });
      if (vehicles.length > 0) {
        await prisma.searchIndex.createMany({
          data: vehicles.map((v) => ({
            tenantId,
            entityType: "VEHICLE",
            entityId: v.id,
            title: v.vehicleNo,
            subtitle: `Driver: ${v.driverName || "N/A"}`,
            description: v.type || "",
            keywords: [v.vehicleNo.toLowerCase(), v.driverName?.toLowerCase() || ""].filter(Boolean),
            route: `/transport`,
            icon: "Bus",
            category: "Transport",
          })),
        });
        totalIndexed += vehicles.length;
      }
    } catch (e) {}

    // Index Certificates
    try {
      const certificates = await prisma.certificate.findMany({
        where: { tenantId },
        select: { id: true, type: true, studentName: true, certificateNumber: true },
      });
      if (certificates.length > 0) {
        await prisma.searchIndex.createMany({
          data: certificates.map((c) => ({
            tenantId,
            entityType: "CERTIFICATE",
            entityId: c.id,
            title: `${c.type} - ${c.studentName || ""}`,
            subtitle: `No: ${c.certificateNumber || "N/A"}`,
            keywords: [c.studentName?.toLowerCase() || "", c.certificateNumber || "", c.type.toLowerCase()].filter(Boolean),
            route: `/certificates/tc`,
            icon: "Award",
            category: "Certificate",
          })),
        });
        totalIndexed += certificates.length;
      }
    } catch (e) {}

    // Index Assets
    try {
      const assets = await prisma.asset.findMany({
        where: { tenantId },
        select: { id: true, name: true, category: true, assetCode: true },
      });
      if (assets.length > 0) {
        await prisma.searchIndex.createMany({
          data: assets.map((a) => ({
            tenantId,
            entityType: "ASSET",
            entityId: a.id,
            title: a.name,
            subtitle: `Code: ${a.assetCode || "N/A"}`,
            description: a.category || "",
            keywords: [a.name.toLowerCase(), a.assetCode?.toLowerCase() || "", a.category?.toLowerCase() || ""].filter(Boolean),
            route: `/inventory/assets`,
            icon: "Package",
            category: "Inventory",
          })),
        });
        totalIndexed += assets.length;
      }
    } catch (e) {}

    res.json({
      success: true,
      message: `Reindex complete. ${totalIndexed} items indexed.`,
      data: { totalIndexed },
    });
  } catch (error: any) {
    console.error("Error reindexing:", error);
    res.status(500).json({ success: false, message: "Reindex failed", error: error.message });
  }
};

/**
 * GET /api/search/recent
 * Get recent searches for current user
 */
export const getRecentSearches = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const userId = (req as any).user?.id;

    const recent = await prisma.searchHistory.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      distinct: ["query"],
      select: { query: true, resultCount: true, createdAt: true },
    });

    res.json({ success: true, data: recent });
  } catch (error: any) {
    console.error("Error fetching recent searches:", error);
    res.status(500).json({ success: false, message: "Failed to fetch recent searches", error: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════

/**
 * Direct search in actual collections when index is sparse
 */
async function directSearch(tenantId: string, query: string, type: string | undefined, limit: number): Promise<any[]> {
  const results: any[] = [];

  // Search Students directly
  if (!type || type === "STUDENT") {
    try {
      const students = await prisma.student.findMany({
        where: {
          tenantId,
          isDeleted: false,
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { admissionNo: { contains: query, mode: "insensitive" } },
            { phone: { contains: query } },
            { fatherName: { contains: query, mode: "insensitive" } },
          ],
        },
        take: Math.min(limit, 10),
        select: { id: true, firstName: true, lastName: true, admissionNo: true, fatherName: true },
      });
      results.push(
        ...students.map((s) => ({
          entityType: "STUDENT",
          entityId: s.id,
          title: `${s.firstName} ${s.lastName}`,
          subtitle: `Adm: ${s.admissionNo || "N/A"}`,
          route: `/students/edit/${s.id}`,
          icon: "GraduationCap",
          category: "Student",
        }))
      );
    } catch (e) {}
  }

  // Search Teachers directly
  if (!type || type === "STAFF") {
    try {
      const teachers = await prisma.teacher.findMany({
        where: {
          tenantId,
          isDeleted: false,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query } },
            { employeeId: { contains: query, mode: "insensitive" } },
          ],
        },
        take: Math.min(limit, 10),
        select: { id: true, name: true, email: true, department: true },
      });
      results.push(
        ...teachers.map((t) => ({
          entityType: "STAFF",
          entityId: t.id,
          title: t.name,
          subtitle: t.department || t.email || "",
          route: `/teachers/profile/${t.id}`,
          icon: "UserCog",
          category: "Staff",
        }))
      );
    } catch (e) {}
  }

  return results;
}

/**
 * Format SearchIndex result for API response
 */
function formatIndexResult(item: any) {
  return {
    entityType: item.entityType,
    entityId: item.entityId,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    route: item.route,
    icon: item.icon,
    category: item.category,
  };
}

/**
 * Deduplicate results by entityType + entityId
 */
function deduplicateResults(results: any[]): any[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = `${r.entityType}:${r.entityId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Helper: Index a single entity (call from other controllers after create/update)
 */
export const indexEntity = async (data: {
  tenantId: string;
  entityType: string;
  entityId: string;
  title: string;
  subtitle?: string;
  description?: string;
  keywords?: string[];
  route: string;
  icon?: string;
  category?: string;
  metadata?: any;
}) => {
  try {
    await prisma.searchIndex.upsert({
      where: {
        tenantId_entityType_entityId: {
          tenantId: data.tenantId,
          entityType: data.entityType,
          entityId: data.entityId,
        },
      },
      create: {
        ...data,
        keywords: data.keywords || [],
        isActive: true,
      },
      update: {
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        keywords: data.keywords || [],
        route: data.route,
        icon: data.icon,
        category: data.category,
        metadata: data.metadata,
      },
    });
  } catch (error) {
    console.error("Failed to index entity:", error);
  }
};

/**
 * Helper: Remove entity from index (call after delete)
 */
export const removeFromIndex = async (tenantId: string, entityType: string, entityId: string) => {
  try {
    await prisma.searchIndex.updateMany({
      where: { tenantId, entityType, entityId },
      data: { isActive: false },
    });
  } catch (error) {
    console.error("Failed to remove from index:", error);
  }
};
