
// Backup Service
// Core business logic for data backup operations
// Uses Prisma client to export all tenant collections as JSON, zipped together

import prisma from "../../utils/prisma";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import cron from "node-cron";

// Base directory for storing backups
const BACKUP_BASE_DIR = path.join(__dirname, "../../../uploads/backups");

// ============================================================
// HELPER: Ensure backup directory exists
// ============================================================
function ensureBackupDir(tenantId: string): string {
  const dir = path.join(BACKUP_BASE_DIR, tenantId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// ============================================================
// HELPER: Get all tenant data from all collections
// ============================================================
async function getTenantData(tenantId: string): Promise<Record<string, any[]>> {
  const data: Record<string, any[]> = {};

  // Export all collections that have tenantId field
  try { data.users = await prisma.user.findMany({ where: { tenantId } }); } catch (e) {}
  try { data.students = await prisma.student.findMany({ where: { tenantId } }); } catch (e) {}
  try { data.teachers = await prisma.teacher.findMany({ where: { tenantId } }); } catch (e) {}
  try { data.classes = await prisma.class.findMany({ where: { tenantId } }); } catch (e) {}
  try { data.sections = await prisma.section.findMany({ where: { tenantId } }); } catch (e) {}
  try { data.subjects = await prisma.subject.findMany({ where: { tenantId } }); } catch (e) {}
  try { data.academicYears = await prisma.academicYear.findMany({ where: { tenantId } }); } catch (e) {}
  try { data.enrollments = await prisma.enrollment.findMany({ where: { tenantId } }); } catch (e) {}
  try { data.timetables = await prisma.timetable.findMany({ where: { tenantId } }); } catch (e) {}
  try { data.feeHeads = await prisma.feeHead.findMany({ where: { tenantId } }); } catch (e) {}
  try { data.feeStructures = await prisma.feeStructure.findMany({ where: { tenantId } }); } catch (e) {}
  try { data.feeDiscounts = await prisma.feeDiscount.findMany({ where: { tenantId } }); } catch (e) {}
  try { data.fineRules = await prisma.fineRule.findMany({ where: { tenantId } }); } catch (e) {}
  try { data.studentDocuments = await prisma.studentDocument.findMany({ where: { tenantId } }); } catch (e) {}
  try { data.studentHistories = await prisma.studentHistory.findMany({ where: { tenantId } }); } catch (e) {}
  try { data.promotions = await prisma.promotion.findMany({ where: { tenantId } }); } catch (e) {}
  try { data.attendances = await prisma.attendance.findMany({ where: { tenantId } }); } catch (e) {}
  try { data.exams = await prisma.exam.findMany({ where: { tenantId } }); } catch (e) {}
  try { data.signatures = await prisma.signature.findMany({ where: { tenantId } }); } catch (e) {}

  // Get tenant record itself
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (tenant) data.tenant = [tenant];
  } catch (e) {}

  // Filter out empty collections
  const filtered: Record<string, any[]> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && value.length > 0) {
      filtered[key] = value;
    }
  }

  return filtered;
}

// ============================================================
// HELPER: Create zip file from tenant data
// ============================================================
async function createZipBackup(tenantId: string, data: Record<string, any[]>): Promise<{ filePath: string; filename: string; size: number }> {
  const dir = ensureBackupDir(tenantId);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${timestamp}.zip`;
  const filePath = path.join(dir, filename);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(filePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      const size = archive.pointer();
      resolve({ filePath, filename, size });
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add each collection as a separate JSON file
    for (const [collection, records] of Object.entries(data)) {
      const jsonContent = JSON.stringify(records, null, 2);
      archive.append(jsonContent, { name: `${collection}.json` });
    }

    // Add metadata file
    const metadata = {
      tenantId,
      createdAt: new Date().toISOString(),
      collections: Object.keys(data),
      totalRecords: Object.values(data).reduce((acc, arr) => acc + arr.length, 0),
    };
    archive.append(JSON.stringify(metadata, null, 2), { name: "metadata.json" });

    archive.finalize();
  });
}

// ============================================================
// 📋 LIST BACKUPS SERVICE
// ============================================================
export async function listBackupsService(
  tenantId: string,
  options: { type?: string; page: number; limit: number }
) {
  const { type, page, limit } = options;

  const where: any = { tenantId };
  if (type) where.type = type;

  const [backups, total] = await Promise.all([
    prisma.backup.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.backup.count({ where }),
  ]);

  // Calculate total storage used
  const storageResult = await prisma.backup.aggregate({
    where: { tenantId },
    _sum: { size: true },
  });

  return {
    backups,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    storageUsed: storageResult._sum.size || 0,
  };
}

// ============================================================
// 🔄 CREATE BACKUP SERVICE
// ============================================================
export async function createBackupService(
  tenantId: string,
  type: string = "MANUAL",
  notes?: string
) {
  // Create backup record with IN_PROGRESS status
  const backupRecord = await prisma.backup.create({
    data: {
      tenantId,
      filename: "pending...",
      size: 0,
      type,
      status: "IN_PROGRESS",
      notes: notes || null,
    },
  });

  try {
    // Fetch all tenant data
    const tenantData = await getTenantData(tenantId);

    // Create zip file
    const { filePath, filename, size } = await createZipBackup(tenantId, tenantData);

    // Update backup record with completed info
    const updatedBackup = await prisma.backup.update({
      where: { id: backupRecord.id },
      data: {
        filename,
        size,
        status: "COMPLETED",
      },
    });

    return updatedBackup;
  } catch (error: any) {
    // Mark backup as failed
    await prisma.backup.update({
      where: { id: backupRecord.id },
      data: {
        status: "FAILED",
        notes: `${notes || ""} | Error: ${error.message}`.trim(),
      },
    });

    throw new Error(`Backup failed: ${error.message}`);
  }
}

// ============================================================
// 📥 DOWNLOAD BACKUP SERVICE
// ============================================================
export async function downloadBackupService(tenantId: string, backupId: string) {
  const backup = await prisma.backup.findFirst({
    where: { id: backupId, tenantId },
  });

  if (!backup) {
    throw new Error("Backup not found");
  }

  if (backup.status !== "COMPLETED") {
    throw new Error("Backup is not available for download");
  }

  const filePath = path.join(BACKUP_BASE_DIR, tenantId, backup.filename);

  if (!fs.existsSync(filePath)) {
    throw new Error("Backup file not found on disk");
  }

  return { filePath, filename: backup.filename };
}

// ============================================================
// 🗑️ DELETE BACKUP SERVICE
// ============================================================
export async function deleteBackupService(tenantId: string, backupId: string) {
  const backup = await prisma.backup.findFirst({
    where: { id: backupId, tenantId },
  });

  if (!backup) {
    throw new Error("Backup not found");
  }

  // Delete file from disk
  const filePath = path.join(BACKUP_BASE_DIR, tenantId, backup.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete record from DB
  await prisma.backup.delete({ where: { id: backupId } });

  return { deleted: true };
}

// ============================================================
// ⚙️ GET BACKUP SETTINGS SERVICE
// ============================================================
export async function getBackupSettingsService(tenantId: string) {
  let settings = await prisma.backupSettings.findUnique({
    where: { tenantId },
  });

  // If no settings exist, create default
  if (!settings) {
    settings = await prisma.backupSettings.create({
      data: {
        tenantId,
        dailyEnabled: false,
        weeklyEnabled: false,
        monthlyEnabled: false,
        yearlyEnabled: false,
        dailyTime: "02:00",
        weeklyDay: 0,
        monthlyDate: 1,
        retentionDays: 30,
      },
    });
  }

  return settings;
}

// ============================================================
// ⚙️ UPDATE BACKUP SETTINGS SERVICE
// ============================================================
export async function updateBackupSettingsService(
  tenantId: string,
  settingsData: {
    dailyEnabled?: boolean;
    weeklyEnabled?: boolean;
    monthlyEnabled?: boolean;
    yearlyEnabled?: boolean;
    dailyTime?: string;
    weeklyDay?: number;
    monthlyDate?: number;
    retentionDays?: number;
  }
) {
  const settings = await prisma.backupSettings.upsert({
    where: { tenantId },
    update: settingsData,
    create: {
      tenantId,
      ...settingsData,
    },
  });

  // Reschedule cron jobs after settings update
  await rescheduleBackupJobs(tenantId);

  return settings;
}

// ============================================================
// 🕐 CRON JOB SCHEDULING
// ============================================================

// Store active cron jobs per tenant
const cronJobs: Map<string, cron.ScheduledTask[]> = new Map();

// Cancel existing jobs for a tenant
function cancelTenantJobs(tenantId: string) {
  const jobs = cronJobs.get(tenantId);
  if (jobs) {
    jobs.forEach((job) => job.stop());
    cronJobs.delete(tenantId);
  }
}

// Reschedule backup jobs for a tenant based on their settings
async function rescheduleBackupJobs(tenantId: string) {
  cancelTenantJobs(tenantId);

  const settings = await prisma.backupSettings.findUnique({
    where: { tenantId },
  });

  if (!settings) return;

  const jobs: cron.ScheduledTask[] = [];

  // Daily backup
  if (settings.dailyEnabled) {
    const [hour, minute] = settings.dailyTime.split(":").map(Number);
    const cronExpr = `${minute} ${hour} * * *`;
    const job = cron.schedule(cronExpr, async () => {
      try {
        await createBackupService(tenantId, "DAILY");
        await cleanupOldBackups(tenantId, settings.retentionDays);
      } catch (error) {
        console.error(`[Backup] Daily backup failed for tenant ${tenantId}:`, error);
      }
    });
    jobs.push(job);
  }

  // Weekly backup (on specified day)
  if (settings.weeklyEnabled) {
    const [hour, minute] = settings.dailyTime.split(":").map(Number);
    const cronExpr = `${minute} ${hour} * * ${settings.weeklyDay}`;
    const job = cron.schedule(cronExpr, async () => {
      try {
        await createBackupService(tenantId, "WEEKLY");
        await cleanupOldBackups(tenantId, settings.retentionDays);
      } catch (error) {
        console.error(`[Backup] Weekly backup failed for tenant ${tenantId}:`, error);
      }
    });
    jobs.push(job);
  }

  // Monthly backup (on specified date)
  if (settings.monthlyEnabled) {
    const [hour, minute] = settings.dailyTime.split(":").map(Number);
    const cronExpr = `${minute} ${hour} ${settings.monthlyDate} * *`;
    const job = cron.schedule(cronExpr, async () => {
      try {
        await createBackupService(tenantId, "MONTHLY");
        await cleanupOldBackups(tenantId, settings.retentionDays);
      } catch (error) {
        console.error(`[Backup] Monthly backup failed for tenant ${tenantId}:`, error);
      }
    });
    jobs.push(job);
  }

  // Yearly backup (January 1st)
  if (settings.yearlyEnabled) {
    const [hour, minute] = settings.dailyTime.split(":").map(Number);
    const cronExpr = `${minute} ${hour} 1 1 *`;
    const job = cron.schedule(cronExpr, async () => {
      try {
        await createBackupService(tenantId, "YEARLY");
        await cleanupOldBackups(tenantId, settings.retentionDays);
      } catch (error) {
        console.error(`[Backup] Yearly backup failed for tenant ${tenantId}:`, error);
      }
    });
    jobs.push(job);
  }

  if (jobs.length > 0) {
    cronJobs.set(tenantId, jobs);
  }
}

// ============================================================
// 🧹 CLEANUP OLD BACKUPS (based on retention days)
// ============================================================
async function cleanupOldBackups(tenantId: string, retentionDays: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const oldBackups = await prisma.backup.findMany({
    where: {
      tenantId,
      createdAt: { lt: cutoffDate },
    },
  });

  for (const backup of oldBackups) {
    try {
      const filePath = path.join(BACKUP_BASE_DIR, tenantId, backup.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await prisma.backup.delete({ where: { id: backup.id } });
    } catch (error) {
      console.error(`[Backup] Failed to cleanup backup ${backup.id}:`, error);
    }
  }
}

// ============================================================
// 🚀 INITIALIZE ALL BACKUP SCHEDULES ON SERVER START
// ============================================================
export async function initializeBackupSchedules() {
  try {
    const allSettings = await prisma.backupSettings.findMany({
      where: {
        OR: [
          { dailyEnabled: true },
          { weeklyEnabled: true },
          { monthlyEnabled: true },
          { yearlyEnabled: true },
        ],
      },
    });

    for (const settings of allSettings) {
      await rescheduleBackupJobs(settings.tenantId);
    }

    console.log(`[Backup] Initialized backup schedules for ${allSettings.length} tenant(s)`);
  } catch (error) {
    console.error("[Backup] Failed to initialize backup schedules:", error);
  }
}
