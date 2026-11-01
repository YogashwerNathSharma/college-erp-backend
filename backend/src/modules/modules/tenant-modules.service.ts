import prisma from "../../utils/prisma";

/**
 * 🔒 Tenant Module Access Service
 * 
 * Super Admin assigns modules to tenants via TenantModule table.
 * This service provides tenant-facing read access to their permitted modules.
 * 
 * CORE modules (Dashboard, Settings, Master Data) are ALWAYS available.
 */

// These module slugs are always available to every tenant — cannot be disabled
const CORE_MODULE_SLUGS = [
  "dashboard",
  "settings",
  "master-data",
  "notifications",
];

// ⚡ Perf: in-memory cache for permitted modules (called on every page load).
// Data changes rarely (only when Super Admin reassigns modules), so a short
// TTL + explicit invalidation on write keeps it always correct but fast.
const _permittedCache = new Map<string, { data: any; expires: number }>();
const PERMITTED_TTL_MS = 2 * 60 * 1000; // 2 minutes

/** Clear the permitted-modules cache for one tenant (or all). */
export const invalidatePermittedModulesCache = (tenantId?: string) => {
  if (tenantId) {
    _permittedCache.delete(tenantId);
  } else {
    _permittedCache.clear();
  }
};

/**
 * Get all permitted module slugs for a tenant.
 * Returns: array of module slugs the tenant can access.
 * 
 * Logic:
 *  1. Core modules → always included
 *  2. TenantModule records where isEnabled=true → included
 */
export const getTenantPermittedModules = async (tenantId: string) => {
  // Serve from cache when fresh
  const cached = _permittedCache.get(tenantId);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  // Fetch tenant's module assignments
  const tenantModules = await prisma.tenantModule.findMany({
    where: { tenantId, isEnabled: true },
    include: {
      module: {
        select: { id: true, slug: true, name: true, icon: true, category: true, isEnabled: true },
      },
    },
  });

  // If no modules assigned → only CORE modules available
  // Super Admin must assign modules to each tenant
  if (tenantModules.length === 0) {
    const restricted = {
      mode: "restricted" as const,
      modules: [...CORE_MODULE_SLUGS],
      details: CORE_MODULE_SLUGS.map((slug) => ({ slug, name: slug, icon: "Package", category: "Core" })),
      message: "Only core modules available. Contact Super Admin to enable more modules.",
    };
    _permittedCache.set(tenantId, { data: restricted, expires: Date.now() + PERMITTED_TTL_MS });
    return restricted;
  }

  // Merge core + assigned modules
  const assignedSlugs = tenantModules
    .filter((tm) => tm.module.isEnabled) // only globally enabled modules
    .map((tm) => tm.module.slug);

  const allSlugs = [...new Set([...CORE_MODULE_SLUGS, ...assignedSlugs])];

  const details = tenantModules
    .filter((tm) => tm.module.isEnabled)
    .map((tm) => ({
      slug: tm.module.slug,
      name: tm.module.name,
      icon: tm.module.icon,
      category: tm.module.category,
    }));

  // Add core module details
  for (const coreSlug of CORE_MODULE_SLUGS) {
    if (!details.find((d) => d.slug === coreSlug)) {
      details.push({ slug: coreSlug, name: coreSlug, icon: "Package", category: "Core" });
    }
  }

  const resultData = {
    mode: "restricted" as const,
    modules: allSlugs,
    details,
    message: `${allSlugs.length} modules enabled for this tenant`,
  };
  _permittedCache.set(tenantId, { data: resultData, expires: Date.now() + PERMITTED_TTL_MS });
  return resultData;
};

/**
 * Check if a specific module is accessible to a tenant.
 * Used by the module-gate middleware.
 */
export const isTenantModuleAllowed = async (tenantId: string, moduleSlug: string): Promise<boolean> => {
  // Core modules always allowed
  if (CORE_MODULE_SLUGS.includes(moduleSlug)) return true;

  // Check if tenant has ANY module assignments
  const assignmentCount = await prisma.tenantModule.count({ where: { tenantId } });

  // No assignments = only core modules allowed
  if (assignmentCount === 0) return false;

  // Check specific module
  const module = await prisma.erpModule.findFirst({
    where: { slug: moduleSlug, isDeleted: false, isEnabled: true },
  });
  if (!module) return false;

  const tenantModule = await prisma.tenantModule.findFirst({
    where: { tenantId, moduleId: module.id, isEnabled: true },
  });

  return !!tenantModule;
};

/**
 * Bulk assign modules to a tenant (used by Super Admin).
 * Takes an array of module slugs to enable.
 */
export const assignModulesToTenant = async (tenantId: string, moduleSlugs: string[]) => {
  // Validate tenant exists
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Tenant not found");

  // Get desired modules by slugs
  const desiredModules = await prisma.erpModule.findMany({
    where: { slug: { in: moduleSlugs }, isDeleted: false },
  });

  // If no slugs sent (user deselected all non-core), just remove all assignments
  if (moduleSlugs.length === 0 || desiredModules.length === 0) {
    await prisma.tenantModule.deleteMany({ where: { tenantId } });
    invalidatePermittedModulesCache(tenantId);
    return { tenantId, assigned: [], count: 0 };
  }

  const desiredModuleIds = new Set(desiredModules.map((m) => m.id));

  // Get current assignments
  const currentAssignments = await prisma.tenantModule.findMany({
    where: { tenantId },
  });
  const currentModuleIds = new Set(currentAssignments.map((a) => a.moduleId));

  // Delete only modules that should be REMOVED
  const toDelete = currentAssignments.filter((a) => !desiredModuleIds.has(a.moduleId));
  if (toDelete.length > 0) {
    await prisma.tenantModule.deleteMany({
      where: { id: { in: toDelete.map((d) => d.id) } },
    });
  }

  // Create only modules that are NEW
  const toCreate = desiredModules.filter((m) => !currentModuleIds.has(m.id));
  if (toCreate.length > 0) {
    await Promise.all(
      toCreate.map((mod) =>
        prisma.tenantModule.create({
          data: { tenantId, moduleId: mod.id, isEnabled: true },
        })
      )
    );
  }

  console.log(`[ModuleAssign] tenant=${tenantId} | removed=${toDelete.length} | added=${toCreate.length} | total desired=${desiredModules.length}`);

  // Invalidate cache so the tenant immediately sees the new module set
  invalidatePermittedModulesCache(tenantId);

  return {
    tenantId,
    assigned: desiredModules.map((m) => ({ slug: m.slug, name: m.name })),
    count: desiredModules.length,
  };
};

/**
 * Get all available modules with tenant assignment status.
 * Used by Super Admin to see which modules are assigned to a specific tenant.
 */
export const getModulesWithTenantStatus = async (tenantId: string) => {
  const allModules = await prisma.erpModule.findMany({
    where: { isDeleted: false, isEnabled: true },
    orderBy: { category: "asc" },
    select: { id: true, slug: true, name: true, icon: true, category: true, isCore: true },
  });

  const tenantModules = await prisma.tenantModule.findMany({
    where: { tenantId, isEnabled: true },
    select: { moduleId: true },
  });

  const enabledModuleIds = new Set(tenantModules.map((tm) => tm.moduleId));
  const hasAnyAssignment = tenantModules.length > 0;

  return allModules.map((mod) => ({
    ...mod,
    isCore: CORE_MODULE_SLUGS.includes(mod.slug),
    isAssigned: enabledModuleIds.has(mod.id) || CORE_MODULE_SLUGS.includes(mod.slug),
  }));
};
