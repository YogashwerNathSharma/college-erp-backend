import prisma from "../../utils/prisma";

// ══════════════════════════════════════════════════════
// MODULE MANAGEMENT SERVICE
// ══════════════════════════════════════════════════════

export interface ModuleData {
  name: string;
  slug: string;
  description?: string;
  version: string;
  category: string;
  icon?: string;
  author?: string;
  license?: string;
  dependencies?: string[];
  isCore?: boolean;
  price?: number;
  features?: string[];
}

// ─── GET ALL MODULES ───────────────────────────────────
export const getAllModulesService = async (filters?: {
  category?: string;
  status?: string;
  search?: string;
}) => {
  const where: any = { isDeleted: false };

  if (filters?.category && filters.category !== "all") {
    where.category = filters.category;
  }
  if (filters?.status === "enabled") {
    where.isEnabled = true;
  } else if (filters?.status === "disabled") {
    where.isEnabled = false;
  }
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { slug: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const modules = await prisma.erpModule.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      tenantModules: {
        include: { tenant: { select: { id: true, name: true } } },
      },
    },
  });

  const stats = {
    total: await prisma.erpModule.count({ where: { isDeleted: false } }),
    enabled: await prisma.erpModule.count({ where: { isDeleted: false, isEnabled: true } }),
    disabled: await prisma.erpModule.count({ where: { isDeleted: false, isEnabled: false } }),
    installed: await prisma.erpModule.count({ where: { isDeleted: false, isInstalled: true } }),
    core: await prisma.erpModule.count({ where: { isDeleted: false, isCore: true } }),
  };

  return { modules, stats };
};

// ─── GET MODULE BY ID ──────────────────────────────────
export const getModuleByIdService = async (id: string) => {
  const module = await prisma.erpModule.findUnique({
    where: { id },
    include: {
      tenantModules: {
        include: { tenant: { select: { id: true, name: true, isActive: true } } },
      },
    },
  });

  if (!module || module.isDeleted) {
    throw new Error("Module not found");
  }

  return module;
};

// ─── CREATE MODULE ─────────────────────────────────────
export const createModuleService = async (data: ModuleData) => {
  const existing = await prisma.erpModule.findFirst({
    where: { slug: data.slug, isDeleted: false },
  });

  if (existing) {
    throw new Error("A module with this slug already exists");
  }

  const module = await prisma.erpModule.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || "",
      version: data.version,
      category: data.category,
      icon: data.icon || "Package",
      author: data.author || "System",
      license: data.license || "MIT",
      dependencies: data.dependencies || [],
      isCore: data.isCore || false,
      isEnabled: true,
      isInstalled: true,
      price: data.price || 0,
      features: data.features || [],
      healthStatus: "healthy",
      lastHealthCheck: new Date(),
    },
  });

  return module;
};

// ─── UPDATE MODULE ─────────────────────────────────────
export const updateModuleService = async (id: string, data: Partial<ModuleData>) => {
  const module = await prisma.erpModule.findUnique({ where: { id } });
  if (!module || module.isDeleted) {
    throw new Error("Module not found");
  }

  const updated = await prisma.erpModule.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  return updated;
};

// ─── DELETE MODULE ─────────────────────────────────────
export const deleteModuleService = async (id: string) => {
  const module = await prisma.erpModule.findUnique({ where: { id } });
  if (!module || module.isDeleted) {
    throw new Error("Module not found");
  }
  if (module.isCore) {
    throw new Error("Cannot delete a core module");
  }

  await prisma.erpModule.update({
    where: { id },
    data: { isDeleted: true, isEnabled: false, isInstalled: false },
  });

  return { message: "Module deleted successfully" };
};

// ─── TOGGLE MODULE STATUS ──────────────────────────────
export const toggleModuleStatusService = async (id: string) => {
  const module = await prisma.erpModule.findUnique({ where: { id } });
  if (!module || module.isDeleted) {
    throw new Error("Module not found");
  }

  const updated = await prisma.erpModule.update({
    where: { id },
    data: { isEnabled: !module.isEnabled, updatedAt: new Date() },
  });

  return updated;
};

// ─── INSTALL MODULE ────────────────────────────────────
export const installModuleService = async (id: string) => {
  const module = await prisma.erpModule.findUnique({ where: { id } });
  if (!module || module.isDeleted) {
    throw new Error("Module not found");
  }
  if (module.isInstalled) {
    throw new Error("Module is already installed");
  }

  const updated = await prisma.erpModule.update({
    where: { id },
    data: { isInstalled: true, isEnabled: true, updatedAt: new Date() },
  });

  return updated;
};

// ─── UNINSTALL MODULE ──────────────────────────────────
export const uninstallModuleService = async (id: string) => {
  const module = await prisma.erpModule.findUnique({ where: { id } });
  if (!module || module.isDeleted) {
    throw new Error("Module not found");
  }
  if (module.isCore) {
    throw new Error("Cannot uninstall a core module");
  }

  const updated = await prisma.erpModule.update({
    where: { id },
    data: { isInstalled: false, isEnabled: false, updatedAt: new Date() },
  });

  // Remove from all tenants
  await prisma.tenantModule.deleteMany({ where: { moduleId: id } });

  return updated;
};

// ─── TOGGLE MODULE FOR TENANT ──────────────────────────
export const toggleModuleForTenantService = async (moduleId: string, tenantId: string) => {
  const existing = await prisma.tenantModule.findFirst({
    where: { moduleId, tenantId },
  });

  if (existing) {
    await prisma.tenantModule.delete({ where: { id: existing.id } });
    return { action: "disabled", moduleId, tenantId };
  } else {
    await prisma.tenantModule.create({
      data: { moduleId, tenantId, isEnabled: true },
    });
    return { action: "enabled", moduleId, tenantId };
  }
};

// ─── HEALTH CHECK ──────────────────────────────────────
export const moduleHealthCheckService = async (id: string) => {
  const module = await prisma.erpModule.findUnique({ where: { id } });
  if (!module || module.isDeleted) {
    throw new Error("Module not found");
  }

  // Simulate health check
  const statuses = ["healthy", "degraded", "unhealthy"] as const;
  const randomStatus = statuses[Math.floor(Math.random() * 10) < 8 ? 0 : Math.floor(Math.random() * 10) < 9 ? 1 : 2];

  const updated = await prisma.erpModule.update({
    where: { id },
    data: {
      healthStatus: randomStatus,
      lastHealthCheck: new Date(),
    },
  });

  return {
    moduleId: id,
    status: randomStatus,
    checkedAt: new Date(),
    responseTime: Math.floor(Math.random() * 200) + 10,
    memoryUsage: `${(Math.random() * 100 + 20).toFixed(1)} MB`,
    cpuUsage: `${(Math.random() * 30).toFixed(1)}%`,
  };
};

// ─── GET MODULE MARKETPLACE ────────────────────────────
export const getModuleMarketplaceService = async () => {
  const installed = await prisma.erpModule.findMany({
    where: { isDeleted: false, isInstalled: true },
    select: { slug: true },
  });

  const installedSlugs = installed.map((m) => m.slug);

  // Return available modules from marketplace (simulated)
  const marketplace = [
    {
      id: "mp-1",
      name: "Advanced Analytics",
      slug: "advanced-analytics",
      description: "Comprehensive analytics dashboard with AI-powered insights",
      version: "2.1.0",
      category: "Analytics",
      author: "ERP Pro",
      price: 49.99,
      rating: 4.8,
      downloads: 12500,
      icon: "BarChart3",
      installed: installedSlugs.includes("advanced-analytics"),
    },
    {
      id: "mp-2",
      name: "Parent Portal",
      slug: "parent-portal",
      description: "Dedicated portal for parents with real-time notifications",
      version: "1.5.0",
      category: "Communication",
      author: "EduTech Solutions",
      price: 29.99,
      rating: 4.6,
      downloads: 8900,
      icon: "Users",
      installed: installedSlugs.includes("parent-portal"),
    },
    {
      id: "mp-3",
      name: "AI Grading System",
      slug: "ai-grading",
      description: "Automated grading with ML-based assessment",
      version: "3.0.0",
      category: "Examination",
      author: "AI Academy",
      price: 79.99,
      rating: 4.9,
      downloads: 5600,
      icon: "Brain",
      installed: installedSlugs.includes("ai-grading"),
    },
    {
      id: "mp-4",
      name: "Virtual Classroom",
      slug: "virtual-classroom",
      description: "Integrated video conferencing and virtual whiteboard",
      version: "2.3.1",
      category: "Learning",
      author: "VClass Inc",
      price: 59.99,
      rating: 4.7,
      downloads: 15200,
      icon: "Video",
      installed: installedSlugs.includes("virtual-classroom"),
    },
    {
      id: "mp-5",
      name: "Document Management",
      slug: "document-management",
      description: "Centralized document storage with OCR and search",
      version: "1.8.0",
      category: "Administration",
      author: "DocHub",
      price: 34.99,
      rating: 4.5,
      downloads: 7300,
      icon: "FileText",
      installed: installedSlugs.includes("document-management"),
    },
  ];

  return marketplace;
};
