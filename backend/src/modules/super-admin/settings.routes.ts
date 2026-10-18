
import { Router } from "express";
import { Response } from "express";
import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";

const router = Router();

// 🔒 Only authenticated users (ADMIN or SUPER_ADMIN)
router.use(authMiddleware);

//////////////////////////////////////////////////////
// GET SETTINGS
//////////////////////////////////////////////////////

router.get("/", async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    // Platform settings
    let platform = await prisma.platformSettings.findFirst();
    if (!platform) {
      platform = await prisma.platformSettings.create({
        data: {
          appName: "College ERP",
          tagline: "Complete School Management System",
          primaryColor: "#4f46e5",
        },
      });
    }

    // User profile
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    // System config (only for SUPER_ADMIN)
    const systemConfig =
      role === "SUPER_ADMIN"
        ? {
            razorpayKeyId: process.env.RAZORPAY_KEY_ID
              ? "***" + process.env.RAZORPAY_KEY_ID.slice(-6)
              : "Not Set",
            smtpHost: process.env.SMTP_HOST || "Not Set",
            smtpPort: process.env.SMTP_PORT || "Not Set",
            smtpEmail: process.env.SMTP_EMAIL || "Not Set",
            baseUrl: process.env.BASE_URL || "http://localhost:5000",
          }
        : undefined;

    return res.json({
      success: true,
      data: { platform, profile, systemConfig },
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

//////////////////////////////////////////////////////
// UPDATE PLATFORM SETTINGS
//////////////////////////////////////////////////////

router.put("/platform", allowRoles("SUPER_ADMIN"), async (req: any, res: Response) => {
  try {
    let settings = await prisma.platformSettings.findFirst();

    if (settings) {
      const updated = await prisma.platformSettings.update({
        where: { id: settings.id },
        data: {
          ...(req.body.appName && { appName: req.body.appName }),
          ...(req.body.tagline && { tagline: req.body.tagline }),
          ...(req.body.primaryColor && { primaryColor: req.body.primaryColor }),
          ...(req.body.logoUrl && { logoUrl: req.body.logoUrl }),
          ...(req.body.faviconUrl && { faviconUrl: req.body.faviconUrl }),
        },
      });
      return res.json({ success: true, data: updated });
    } else {
      const created = await prisma.platformSettings.create({ data: req.body });
      return res.json({ success: true, data: created });
    }
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

//////////////////////////////////////////////////////
// UPDATE PROFILE
//////////////////////////////////////////////////////

router.put("/profile", async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { name, email, currentPassword, newPassword } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    if (newPassword) {
      if (!currentPassword) {
        throw new Error("Current password is required");
      }
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) throw new Error("Current password is incorrect");

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true },
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

export default router;

