import { Router } from "express";

const router = Router();

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

export default router;