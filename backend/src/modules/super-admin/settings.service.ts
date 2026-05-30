import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";

//////////////////////////////////////////////////////
// GET SETTINGS
//////////////////////////////////////////////////////

export const getSettingsService = async () => {
  // Get platform settings (first row or create default)
  let settings = await prisma.platformSettings.findFirst();

  if (!settings) {
    settings = await prisma.platformSettings.create({
      data: {
        appName: "College ERP",
        tagline: "Complete School Management System",
        primaryColor: "#4f46e5",
      },
    });
  }

  return settings;
};

//////////////////////////////////////////////////////
// UPDATE PLATFORM SETTINGS
//////////////////////////////////////////////////////

export const updatePlatformSettingsService = async (data: any) => {
  let settings = await prisma.platformSettings.findFirst();

  if (settings) {
    return prisma.platformSettings.update({
      where: { id: settings.id },
      data: {
        ...(data.appName && { appName: data.appName }),
        ...(data.tagline && { tagline: data.tagline }),
        ...(data.primaryColor && { primaryColor: data.primaryColor }),
        ...(data.logoUrl && { logoUrl: data.logoUrl }),
        ...(data.faviconUrl && { faviconUrl: data.faviconUrl }),
      },
    });
  } else {
    return prisma.platformSettings.create({ data });
  }
};

//////////////////////////////////////////////////////
// UPDATE SUPER ADMIN PROFILE
//////////////////////////////////////////////////////

export const updateProfileService = async (userId: string, data: any) => {
  const updateData: any = {};

  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;

  if (data.newPassword) {
    if (!data.currentPassword) {
      throw new Error("Current password is required");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const isValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValid) throw new Error("Current password is incorrect");

    updateData.password = await bcrypt.hash(data.newPassword, 10);
  }

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, role: true },
  });
};

//////////////////////////////////////////////////////
// GET SYSTEM CONFIG
//////////////////////////////////////////////////////

export const getSystemConfigService = async () => {
  return {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID ? "***" + process.env.RAZORPAY_KEY_ID.slice(-6) : "Not Set",
    smtpHost: process.env.SMTP_HOST || "Not Set",
    smtpPort: process.env.SMTP_PORT || "Not Set",
    smtpEmail: process.env.SMTP_EMAIL || "Not Set",
    baseUrl: process.env.BASE_URL || "http://localhost:5000",
  };
};