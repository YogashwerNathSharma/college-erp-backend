import prisma from "../../utils/prisma";

// ══════════════════════════════════════════════════════
// PLUGIN MANAGEMENT SERVICE
// ══════════════════════════════════════════════════════

export interface PluginData {
  name: string;
  slug: string;
  description?: string;
  version: string;
  category: string;
  author?: string;
  icon?: string;
  permissions?: string[];
  configSchema?: any;
  config?: any;
  price?: number;
  homepage?: string;
  repository?: string;
}

// ─── GET ALL PLUGINS ───────────────────────────────────
export const getAllPluginsService = async (filters?: {
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

  const plugins = await prisma.plugin.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  const stats = {
    total: await prisma.plugin.count({ where: { isDeleted: false } }),
    enabled: await prisma.plugin.count({ where: { isDeleted: false, isEnabled: true } }),
    disabled: await prisma.plugin.count({ where: { isDeleted: false, isEnabled: false } }),
    updatesAvailable: await prisma.plugin.count({ where: { isDeleted: false, hasUpdate: true } }),
  };

  return { plugins, stats };
};

// ─── GET PLUGIN BY ID ──────────────────────────────────
export const getPluginByIdService = async (id: string) => {
  const plugin = await prisma.plugin.findUnique({
    where: { id },
    include: {
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!plugin || plugin.isDeleted) {
    throw new Error("Plugin not found");
  }

  return plugin;
};

// ─── CREATE / INSTALL PLUGIN ───────────────────────────
export const createPluginService = async (data: PluginData) => {
  const existing = await prisma.plugin.findFirst({
    where: { slug: data.slug, isDeleted: false },
  });

  if (existing) {
    throw new Error("A plugin with this slug already exists");
  }

  const plugin = await prisma.plugin.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || "",
      version: data.version,
      category: data.category,
      author: data.author || "Unknown",
      icon: data.icon || "Puzzle",
      permissions: data.permissions || [],
      configSchema: data.configSchema || {},
      config: data.config || {},
      isEnabled: true,
      isInstalled: true,
      hasUpdate: false,
      price: data.price || 0,
      homepage: data.homepage || "",
      repository: data.repository || "",
      installedAt: new Date(),
    },
  });

  // Log activity
  await prisma.pluginActivityLog.create({
    data: {
      pluginId: plugin.id,
      action: "installed",
      message: `Plugin "${plugin.name}" v${plugin.version} installed`,
      metadata: { version: plugin.version },
    },
  });

  return plugin;
};

// ─── UPDATE PLUGIN ─────────────────────────────────────
export const updatePluginService = async (id: string, data: Partial<PluginData>) => {
  const plugin = await prisma.plugin.findUnique({ where: { id } });
  if (!plugin || plugin.isDeleted) {
    throw new Error("Plugin not found");
  }

  const updated = await prisma.plugin.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  await prisma.pluginActivityLog.create({
    data: {
      pluginId: id,
      action: "updated",
      message: `Plugin "${updated.name}" configuration updated`,
      metadata: { changes: Object.keys(data) },
    },
  });

  return updated;
};

// ─── DELETE / UNINSTALL PLUGIN ──────────────────────────
export const deletePluginService = async (id: string) => {
  const plugin = await prisma.plugin.findUnique({ where: { id } });
  if (!plugin || plugin.isDeleted) {
    throw new Error("Plugin not found");
  }

  await prisma.plugin.update({
    where: { id },
    data: { isDeleted: true, isEnabled: false, isInstalled: false },
  });

  await prisma.pluginActivityLog.create({
    data: {
      pluginId: id,
      action: "uninstalled",
      message: `Plugin "${plugin.name}" was uninstalled`,
    },
  });

  return { message: "Plugin uninstalled successfully" };
};

// ─── TOGGLE PLUGIN STATUS ──────────────────────────────
export const togglePluginStatusService = async (id: string) => {
  const plugin = await prisma.plugin.findUnique({ where: { id } });
  if (!plugin || plugin.isDeleted) {
    throw new Error("Plugin not found");
  }

  const updated = await prisma.plugin.update({
    where: { id },
    data: { isEnabled: !plugin.isEnabled, updatedAt: new Date() },
  });

  await prisma.pluginActivityLog.create({
    data: {
      pluginId: id,
      action: updated.isEnabled ? "enabled" : "disabled",
      message: `Plugin "${updated.name}" was ${updated.isEnabled ? "enabled" : "disabled"}`,
    },
  });

  return updated;
};

// ─── UPDATE PLUGIN CONFIG ──────────────────────────────
export const updatePluginConfigService = async (id: string, config: any) => {
  const plugin = await prisma.plugin.findUnique({ where: { id } });
  if (!plugin || plugin.isDeleted) {
    throw new Error("Plugin not found");
  }

  const updated = await prisma.plugin.update({
    where: { id },
    data: { config, updatedAt: new Date() },
  });

  await prisma.pluginActivityLog.create({
    data: {
      pluginId: id,
      action: "configured",
      message: `Plugin "${updated.name}" configuration changed`,
      metadata: { configKeys: Object.keys(config) },
    },
  });

  return updated;
};

// ─── UPDATE PLUGIN PERMISSIONS ─────────────────────────
export const updatePluginPermissionsService = async (id: string, permissions: string[]) => {
  const plugin = await prisma.plugin.findUnique({ where: { id } });
  if (!plugin || plugin.isDeleted) {
    throw new Error("Plugin not found");
  }

  const updated = await prisma.plugin.update({
    where: { id },
    data: { permissions, updatedAt: new Date() },
  });

  await prisma.pluginActivityLog.create({
    data: {
      pluginId: id,
      action: "permissions_changed",
      message: `Plugin "${updated.name}" permissions updated`,
      metadata: { permissions },
    },
  });

  return updated;
};

// ─── GET PLUGIN ACTIVITY LOGS ──────────────────────────
export const getPluginActivityLogsService = async (id: string, limit = 50) => {
  const logs = await prisma.pluginActivityLog.findMany({
    where: { pluginId: id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return logs;
};

// ─── CHECK FOR UPDATES ─────────────────────────────────
export const checkPluginUpdatesService = async () => {
  const plugins = await prisma.plugin.findMany({
    where: { isDeleted: false, isInstalled: true },
  });

  // Simulate update check
  const updates = plugins
    .filter(() => Math.random() > 0.7)
    .map((p) => ({
      pluginId: p.id,
      pluginName: p.name,
      currentVersion: p.version,
      availableVersion: incrementVersion(p.version),
      releaseNotes: "Bug fixes and performance improvements",
    }));

  // Mark plugins that have updates
  for (const update of updates) {
    await prisma.plugin.update({
      where: { id: update.pluginId },
      data: { hasUpdate: true, latestVersion: update.availableVersion },
    });
  }

  return updates;
};

// ─── APPLY UPDATE ──────────────────────────────────────
export const applyPluginUpdateService = async (id: string) => {
  const plugin = await prisma.plugin.findUnique({ where: { id } });
  if (!plugin || plugin.isDeleted) {
    throw new Error("Plugin not found");
  }

  const newVersion = plugin.latestVersion || incrementVersion(plugin.version);

  const updated = await prisma.plugin.update({
    where: { id },
    data: {
      version: newVersion,
      hasUpdate: false,
      latestVersion: null,
      updatedAt: new Date(),
    },
  });

  await prisma.pluginActivityLog.create({
    data: {
      pluginId: id,
      action: "updated_version",
      message: `Plugin "${updated.name}" updated from v${plugin.version} to v${newVersion}`,
      metadata: { fromVersion: plugin.version, toVersion: newVersion },
    },
  });

  return updated;
};

// ─── GET PLUGIN STORE ──────────────────────────────────
export const getPluginStoreService = async () => {
  const installed = await prisma.plugin.findMany({
    where: { isDeleted: false, isInstalled: true },
    select: { slug: true },
  });

  const installedSlugs = installed.map((p) => p.slug);

  const store = [
    {
      id: "store-1",
      name: "Email Notifications",
      slug: "email-notifications",
      description: "Advanced email notification system with templates and scheduling",
      version: "2.4.0",
      category: "Communication",
      author: "NotifyPro",
      price: 0,
      rating: 4.7,
      downloads: 23000,
      icon: "Mail",
      installed: installedSlugs.includes("email-notifications"),
    },
    {
      id: "store-2",
      name: "Two-Factor Auth",
      slug: "two-factor-auth",
      description: "Add 2FA security layer with TOTP and SMS verification",
      version: "1.2.0",
      category: "Security",
      author: "SecureAuth",
      price: 19.99,
      rating: 4.9,
      downloads: 45000,
      icon: "Shield",
      installed: installedSlugs.includes("two-factor-auth"),
    },
    {
      id: "store-3",
      name: "Backup Manager",
      slug: "backup-manager",
      description: "Automated backups with cloud storage integration",
      version: "3.1.0",
      category: "System",
      author: "CloudBack",
      price: 29.99,
      rating: 4.6,
      downloads: 18500,
      icon: "HardDrive",
      installed: installedSlugs.includes("backup-manager"),
    },
    {
      id: "store-4",
      name: "SMS Gateway",
      slug: "sms-gateway",
      description: "Send SMS notifications via multiple providers",
      version: "1.8.0",
      category: "Communication",
      author: "SMSHub",
      price: 14.99,
      rating: 4.4,
      downloads: 12000,
      icon: "MessageSquare",
      installed: installedSlugs.includes("sms-gateway"),
    },
    {
      id: "store-5",
      name: "PDF Generator",
      slug: "pdf-generator",
      description: "Generate professional PDF reports and certificates",
      version: "2.0.0",
      category: "Documents",
      author: "DocGen",
      price: 24.99,
      rating: 4.8,
      downloads: 31000,
      icon: "FileText",
      installed: installedSlugs.includes("pdf-generator"),
    },
    {
      id: "store-6",
      name: "Webhook Manager",
      slug: "webhook-manager",
      description: "Configure and manage webhooks for external integrations",
      version: "1.5.0",
      category: "Integration",
      author: "HookMaster",
      price: 0,
      rating: 4.3,
      downloads: 9800,
      icon: "Webhook",
      installed: installedSlugs.includes("webhook-manager"),
    },
  ];

  return store;
};

// ─── Helper ────────────────────────────────────────────
function incrementVersion(version: string): string {
  const parts = version.split(".").map(Number);
  parts[2] = (parts[2] || 0) + 1;
  if (parts[2] >= 10) {
    parts[2] = 0;
    parts[1] = (parts[1] || 0) + 1;
  }
  return parts.join(".");
}
