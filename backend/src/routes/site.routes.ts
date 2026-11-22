import { Router } from "express";
import prisma from "../utils/prisma";

const router = Router();

// Dummy site content (abhi DB nahi, baad me connect karenge)
router.get("/site-content", async (req, res) => {
  try {
    // Try to fetch from tenant settings first
    const tenant = await prisma.tenant.findFirst({
      select: { name: true, address: true, phone: true, email: true },
    });
    res.json({
      schoolName: tenant?.name || "School Name",
      addressLine1: tenant?.address || "",
      heroSubtitle: "Building future leaders",
      aboutHeading: "About Our School",
      aboutBody: "We provide quality education with modern approach.",
      principalName: "",
      principalMessage: "Education is the key to success",
    });
  } catch {
    res.json({ schoolName: "School Name", addressLine1: "", heroSubtitle: "Building future leaders", aboutHeading: "About Our School", aboutBody: "", principalName: "", principalMessage: "" });
  }
});

// Dummy gallery
router.get("/gallery", (req, res) => {
  res.json([
    {
      id: 1,
      imagePath: "uploads/img1.jpg",
      caption: "Annual Function",
    },
    {
      id: 2,
      imagePath: "uploads/img2.jpg",
      caption: "Sports Day",
    },
  ]);
});

//////////////////////////////////////////////////////
// PUBLIC: Developer Profile (for Tenant sidebar)
//////////////////////////////////////////////////////
router.get("/developer-profile", async (req, res) => {
  try {
    const profile = await (prisma as any).platformSetting.findFirst({
      where: { key: "developer_profile" },
    });
    if (!profile) {
      return res.json({ success: true, data: null });
    }
    const data = JSON.parse(profile.value);
    if (!data.isVisible) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//////////////////////////////////////////////////////
// PUBLIC: Maintenance status (no auth - tenant/login screen reads this)
//////////////////////////////////////////////////////
router.get("/maintenance-status", async (req, res) => {
  try {
    const setting = await (prisma as any).platformSetting.findFirst({
      where: { key: "maintenance_mode" },
    });
    const meta = (setting?.metadata as any) || {};
    res.json({
      success: true,
      enabled: setting?.value === "true",
      message: meta.message || "System is under maintenance",
      scheduledEnd: meta.scheduledEnd || null,
      blockApp: meta.blockApp === true,
    });
  } catch {
    // Fail-open: never block the app due to a status lookup error
    res.json({ success: true, enabled: false, message: "", scheduledEnd: null, blockApp: false });
  }
});

export default router;
