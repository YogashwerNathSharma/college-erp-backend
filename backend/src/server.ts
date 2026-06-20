import app from "./app";
import { initializeBackupSchedules } from "./modules/backup/backup.service";

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Initialize backup cron jobs for all tenants (non-blocking)
  try {
    await initializeBackupSchedules();
  } catch (error) {
    console.warn("[Backup] Scheduler init skipped (run 'npx prisma generate' if needed):", (error as any)?.message);
  }
});
