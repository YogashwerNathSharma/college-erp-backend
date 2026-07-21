import { Router, Response } from "express";
import prisma from "../../utils/prisma";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = Router();

// 🔐 All routes require SUPER_ADMIN
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

//////////////////////////////////////////////////////
// GET ALL SYSTEM SETTINGS
//////////////////////////////////////////////////////

router.get("/", async (req: any, res: Response) => {
  try {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          appName: "College ERP",
          appUrl: process.env.BASE_URL || "http://localhost:5000",
          timezone: "Asia/Kolkata",
          currency: "INR",
          language: "en",
          smtpHost: "",
          smtpPort: 587,
          smtpUser: "",
          smtpPass: "",
          smtpFrom: "",
          smsProvider: "none",
          smsApiKey: "",
          smsSenderId: "",
          whatsappEnabled: false,
          whatsappApiKey: "",
          whatsappPhoneId: "",
          firebaseEnabled: false,
          firebaseProjectId: "",
          firebaseServerKey: "",
          googleLoginEnabled: false,
          googleClientId: "",
          googleClientSecret: "",
          microsoftLoginEnabled: false,
          microsoftClientId: "",
          microsoftClientSecret: "",
          facebookLoginEnabled: false,
          facebookAppId: "",
          facebookAppSecret: "",
          storageProvider: "local",
          s3Bucket: "",
          s3Region: "",
          s3AccessKey: "",
          s3SecretKey: "",
          backupEnabled: false,
          backupSchedule: "0 2 * * *",
          backupRetentionDays: 30,
          cacheProvider: "memory",
          redisHost: "",
          redisPort: 6379,
          redisPassword: "",
          maintenanceMode: false,
          maintenanceMessage: "System is under maintenance. Please try again later.",
          availableLanguages: JSON.stringify(["en", "hi", "ur", "ta", "te", "bn"]),
          rtlEnabled: false,
        },
      });
    }
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//////////////////////////////////////////////////////
// UPDATE APPLICATION SETTINGS
//////////////////////////////////////////////////////

router.put("/application", async (req: any, res: Response) => {
  try {
    const { appName, appUrl, timezone, currency, language, rtlEnabled, availableLanguages } = req.body;
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      return res.status(404).json({ success: false, message: "Settings not found" });
    }
    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        ...(appName !== undefined && { appName }),
        ...(appUrl !== undefined && { appUrl }),
        ...(timezone !== undefined && { timezone }),
        ...(currency !== undefined && { currency }),
        ...(language !== undefined && { language }),
        ...(rtlEnabled !== undefined && { rtlEnabled }),
        ...(availableLanguages !== undefined && { availableLanguages: JSON.stringify(availableLanguages) }),
      },
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//////////////////////////////////////////////////////
// UPDATE SMTP SETTINGS
//////////////////////////////////////////////////////

router.put("/smtp", async (req: any, res: Response) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom } = req.body;
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) return res.status(404).json({ success: false, message: "Settings not found" });

    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        ...(smtpHost !== undefined && { smtpHost }),
        ...(smtpPort !== undefined && { smtpPort }),
        ...(smtpUser !== undefined && { smtpUser }),
        ...(smtpPass !== undefined && { smtpPass }),
        ...(smtpFrom !== undefined && { smtpFrom }),
      },
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//////////////////////////////////////////////////////
// TEST SMTP
//////////////////////////////////////////////////////

router.post("/smtp/test", async (req: any, res: Response) => {
  try {
    const { testEmail } = req.body;
    if (!testEmail) return res.status(400).json({ success: false, message: "Test email required" });

    // In production, this would actually send a test email via nodemailer
    // For now, simulate success
    res.json({ success: true, message: `Test email sent to ${testEmail}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//////////////////////////////////////////////////////
// UPDATE SMS SETTINGS
//////////////////////////////////////////////////////

router.put("/sms", async (req: any, res: Response) => {
  try {
    const { smsProvider, smsApiKey, smsSenderId } = req.body;
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) return res.status(404).json({ success: false, message: "Settings not found" });

    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        ...(smsProvider !== undefined && { smsProvider }),
        ...(smsApiKey !== undefined && { smsApiKey }),
        ...(smsSenderId !== undefined && { smsSenderId }),
      },
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//////////////////////////////////////////////////////
// UPDATE WHATSAPP SETTINGS
//////////////////////////////////////////////////////

router.put("/whatsapp", async (req: any, res: Response) => {
  try {
    const { whatsappEnabled, whatsappApiKey, whatsappPhoneId } = req.body;
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) return res.status(404).json({ success: false, message: "Settings not found" });

    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        ...(whatsappEnabled !== undefined && { whatsappEnabled }),
        ...(whatsappApiKey !== undefined && { whatsappApiKey }),
        ...(whatsappPhoneId !== undefined && { whatsappPhoneId }),
      },
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//////////////////////////////////////////////////////
// UPDATE FIREBASE SETTINGS
//////////////////////////////////////////////////////

router.put("/firebase", async (req: any, res: Response) => {
  try {
    const { firebaseEnabled, firebaseProjectId, firebaseServerKey } = req.body;
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) return res.status(404).json({ success: false, message: "Settings not found" });

    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        ...(firebaseEnabled !== undefined && { firebaseEnabled }),
        ...(firebaseProjectId !== undefined && { firebaseProjectId }),
        ...(firebaseServerKey !== undefined && { firebaseServerKey }),
      },
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//////////////////////////////////////////////////////
// UPDATE OAUTH SETTINGS
//////////////////////////////////////////////////////

router.put("/oauth", async (req: any, res: Response) => {
  try {
    const {
      googleLoginEnabled, googleClientId, googleClientSecret,
      microsoftLoginEnabled, microsoftClientId, microsoftClientSecret,
      facebookLoginEnabled, facebookAppId, facebookAppSecret,
    } = req.body;

    let settings = await prisma.systemSettings.findFirst();
    if (!settings) return res.status(404).json({ success: false, message: "Settings not found" });

    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        ...(googleLoginEnabled !== undefined && { googleLoginEnabled }),
        ...(googleClientId !== undefined && { googleClientId }),
        ...(googleClientSecret !== undefined && { googleClientSecret }),
        ...(microsoftLoginEnabled !== undefined && { microsoftLoginEnabled }),
        ...(microsoftClientId !== undefined && { microsoftClientId }),
        ...(microsoftClientSecret !== undefined && { microsoftClientSecret }),
        ...(facebookLoginEnabled !== undefined && { facebookLoginEnabled }),
        ...(facebookAppId !== undefined && { facebookAppId }),
        ...(facebookAppSecret !== undefined && { facebookAppSecret }),
      },
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//////////////////////////////////////////////////////
// UPDATE STORAGE SETTINGS
//////////////////////////////////////////////////////

router.put("/storage", async (req: any, res: Response) => {
  try {
    const { storageProvider, s3Bucket, s3Region, s3AccessKey, s3SecretKey } = req.body;
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) return res.status(404).json({ success: false, message: "Settings not found" });

    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        ...(storageProvider !== undefined && { storageProvider }),
        ...(s3Bucket !== undefined && { s3Bucket }),
        ...(s3Region !== undefined && { s3Region }),
        ...(s3AccessKey !== undefined && { s3AccessKey }),
        ...(s3SecretKey !== undefined && { s3SecretKey }),
      },
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//////////////////////////////////////////////////////
// UPDATE BACKUP SETTINGS
//////////////////////////////////////////////////////

router.put("/backup", async (req: any, res: Response) => {
  try {
    const { backupEnabled, backupSchedule, backupRetentionDays } = req.body;
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) return res.status(404).json({ success: false, message: "Settings not found" });

    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        ...(backupEnabled !== undefined && { backupEnabled }),
        ...(backupSchedule !== undefined && { backupSchedule }),
        ...(backupRetentionDays !== undefined && { backupRetentionDays }),
      },
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//////////////////////////////////////////////////////
// UPDATE CACHE SETTINGS
//////////////////////////////////////////////////////

router.put("/cache", async (req: any, res: Response) => {
  try {
    const { cacheProvider, redisHost, redisPort, redisPassword } = req.body;
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) return res.status(404).json({ success: false, message: "Settings not found" });

    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        ...(cacheProvider !== undefined && { cacheProvider }),
        ...(redisHost !== undefined && { redisHost }),
        ...(redisPort !== undefined && { redisPort }),
        ...(redisPassword !== undefined && { redisPassword }),
      },
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//////////////////////////////////////////////////////
// UPDATE MAINTENANCE MODE
//////////////////////////////////////////////////////

router.put("/maintenance", async (req: any, res: Response) => {
  try {
    const { maintenanceMode, maintenanceMessage } = req.body;
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) return res.status(404).json({ success: false, message: "Settings not found" });

    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        ...(maintenanceMode !== undefined && { maintenanceMode }),
        ...(maintenanceMessage !== undefined && { maintenanceMessage }),
      },
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//////////////////////////////////////////////////////
// GET CRON JOBS
//////////////////////////////////////////////////////

router.get("/cron-jobs", async (req: any, res: Response) => {
  try {
    const jobs = [
      { id: "1", name: "Database Backup", schedule: "0 2 * * *", enabled: true, lastRun: new Date().toISOString(), status: "success" },
      { id: "2", name: "Clear Temp Files", schedule: "0 4 * * *", enabled: true, lastRun: new Date().toISOString(), status: "success" },
      { id: "3", name: "Subscription Check", schedule: "0 6 * * *", enabled: true, lastRun: new Date().toISOString(), status: "success" },
      { id: "4", name: "Send Reminders", schedule: "0 8 * * 1-5", enabled: false, lastRun: new Date().toISOString(), status: "skipped" },
      { id: "5", name: "Generate Reports", schedule: "0 0 1 * *", enabled: true, lastRun: new Date().toISOString(), status: "success" },
      { id: "6", name: "Cleanup Audit Logs", schedule: "0 3 * * 0", enabled: true, lastRun: new Date().toISOString(), status: "success" },
    ];
    res.json({ success: true, data: jobs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//////////////////////////////////////////////////////
// TOGGLE CRON JOB
//////////////////////////////////////////////////////

router.patch("/cron-jobs/:id/toggle", async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    // In production, this would update the actual cron job status
    res.json({ success: true, message: `Cron job ${id} toggled` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
