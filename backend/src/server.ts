import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import prisma from "./utils/prisma";
import { initializeBackupSchedules } from "./modules/backup/backup.service";

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Warm up Prisma/MongoDB connection pool (eliminates cold-start delay on first request)
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    console.log("✅ MongoDB connection warmed up");
  } catch (err) {
    console.warn("⚠️ MongoDB warmup failed:", (err as any)?.message);
  }

 // Initialize backup cron jobs for all tenants (non-blocking)
  try {
    await initializeBackupSchedules();
  } catch (error) {
    console.warn("[Backup] Scheduler init skipped (run 'npx prisma generate' if needed):", (error as any)?.message);
  }
});
