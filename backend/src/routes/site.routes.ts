import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();

const prisma = new PrismaClient();

// 👉 Dummy site content (abhi DB nahi, baad me connect karenge)
router.get("/site-content", (req, res) => {
  res.json({
    schoolName: "RMS Academy",
    addressLine1: "Divna Road, Bareilly",
    heroSubtitle: "Building future leaders",
    aboutHeading: "About Our School",
    aboutBody: "We provide quality education with modern approach.",
    principalName: "Mr. Sharma",
    principalMessage: "Education is the key to success",
  });
});

// 👉 Dummy gallery
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
// 👨💻 PUBLIC: Developer Profile (for Tenant sidebar)
//////////////////////////////////////////////////////
router.get("/developer-profile", async (req, res) => {
  try {
    const profile = await prisma.developerProfile.findFirst();
    if (!profile || !profile.isVisible) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: profile });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
