import prisma from "../config/prisma";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

/**
 * Backup Scheduler Job
 * Creates automated database backups
 * Scheduled to run daily at 2 AM
 */
export const runBackupSchedulerJob = async () => {
  console.log("[BackupScheduler] Starting backup job...");

  try {
    const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), "backups");

    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL not configured");
    }

    // Parse database URL for pg_dump
    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = url.port || "5432";
    const database = url.pathname.slice(1);
    const username = url.username;

    // Run pg_dump
    const command = `PGPASSWORD="${url.password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F c -f ${filepath}`;

    await execAsync(command);

    // Get file size
    const stats = fs.statSync(filepath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    // Log backup record
    await prisma.backupLog.create({
      data: {
        filename,
        filepath,
        size: stats.size,
        status: "COMPLETED",
        type: "AUTOMATED",
        createdAt: new Date(),
      },
    });

    // Cleanup old backups (keep last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldBackups = await prisma.backupLog.findMany({
      where: { createdAt: { lt: thirtyDaysAgo }, type: "AUTOMATED" },
    });

    for (const backup of oldBackups) {
      try {
        if (fs.existsSync(backup.filepath)) {
          fs.unlinkSync(backup.filepath);
        }
        await prisma.backupLog.delete({ where: { id: backup.id } });
      } catch (err) {
        console.error(`[BackupScheduler] Failed to delete old backup: ${backup.filename}`);
      }
    }

    console.log(`[BackupScheduler] Backup completed: ${filename} (${fileSizeMB} MB)`);
    return { success: true, filename, size: `${fileSizeMB} MB` };
  } catch (error: any) {
    console.error("[BackupScheduler] Error:", error.message);

    // Log failed backup
    await prisma.backupLog.create({
      data: {
        filename: "failed",
        filepath: "",
        size: 0,
        status: "FAILED",
        type: "AUTOMATED",
        error: error.message,
        createdAt: new Date(),
      },
    });

    return { success: false, error: error.message };
  }
};

export const BACKUP_SCHEDULE = "0 2 * * *"; // Every day at 2 AM
