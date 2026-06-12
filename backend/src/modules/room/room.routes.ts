
// ═══════════════════════════════════════════════════════
// room.routes.ts — Room CRUD Routes (for Exam Schedule)
// Place at: src/modules/room/room.routes.ts
// ═══════════════════════════════════════════════════════

import express from "express";
import { Response } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import prisma from "../../utils/prisma";

const router = express.Router();

// GET ALL ROOMS
router.get("/", authMiddleware, async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const rooms = await prisma.room.findMany({
      where: { tenantId, isDeleted: false },
      orderBy: { name: "asc" },
    });
    return res.json({ success: true, data: rooms });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE ROOM
router.post("/", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { name, capacity, location } = req.body;

    if (!name || !capacity) {
      return res.status(400).json({ success: false, message: "Name and capacity are required" });
    }

    const room = await prisma.room.create({
      data: { name, capacity: Number(capacity), location: location || null, tenantId, isDeleted: false },
    });
    return res.status(201).json({ success: true, data: room, message: "Room created" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE ROOM
router.put("/:id", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { name, capacity, location } = req.body;

    const room = await prisma.room.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(capacity && { capacity: Number(capacity) }),
        ...(location !== undefined && { location }),
      },
    });
    return res.json({ success: true, data: room, message: "Room updated" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE ROOM (soft)
router.delete("/:id", authMiddleware, allowRoles("ADMIN", "SUPER_ADMIN"), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.room.update({
      where: { id },
      data: { isDeleted: true },
    });
    return res.json({ success: true, message: "Room deleted" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

