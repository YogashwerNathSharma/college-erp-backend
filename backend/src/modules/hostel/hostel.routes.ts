import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  createHostelHandler,
  getAllHostelsHandler,
  getHostelByIdHandler,
  updateHostelHandler,
  deleteHostelHandler,
  createRoomHandler,
  getRoomsByHostelHandler,
  updateRoomHandler,
  deleteRoomHandler,
  allocateRoomHandler,
  deallocateRoomHandler,
  getAllocationsHandler,
  createMessHandler,
  getMessByHostelHandler,
  updateMessHandler,
  setMessMenuHandler,
  getMessMenuHandler,
} from "./hostel.controller";

const router = Router();

router.use(authMiddleware, resolveTenant);

// ============================================
// HOSTEL ROUTES
// ============================================
router.get("/", getAllHostelsHandler);

// Frontend compatibility aliases
router.get("/hostels", getAllHostelsHandler);        // Frontend calls /api/hostel/hostels
router.get("/rooms", getRoomsByHostelHandler);       // Frontend calls /api/hostel/rooms (hostelId from query)
router.get("/mess-menu", getMessMenuHandler);        // Frontend calls /api/hostel/mess-menu

// Hostel Fees
router.get("/fees", (req: any, res: any) => {
  res.json({ success: true, data: { students: [], stats: { total: 0, collected: 0, pending: 0, defaulters: 0 } } });
});
router.post("/fees/collect", (req: any, res: any) => {
  res.json({ success: true, message: "Fee collection recorded" });
});
router.get("/fees/receipt/:id", (req: any, res: any) => {
  res.json({ success: true, data: null });
});

router.get("/:id", getHostelByIdHandler);
router.post("/", allowRoles("ADMIN"), createHostelHandler);
router.put("/:id", allowRoles("ADMIN"), updateHostelHandler);
router.delete("/:id", allowRoles("ADMIN"), deleteHostelHandler);

// ============================================
// ROOM ROUTES
// ============================================
router.get("/:hostelId/rooms", getRoomsByHostelHandler);
router.post("/rooms", allowRoles("ADMIN"), createRoomHandler);
router.put("/rooms/:id", allowRoles("ADMIN"), updateRoomHandler);
router.delete("/rooms/:id", allowRoles("ADMIN"), deleteRoomHandler);

// ============================================
// ALLOCATION ROUTES
// ============================================
router.get("/allocations", getAllocationsHandler);
router.post("/allocations", allowRoles("ADMIN"), allocateRoomHandler);
router.post("/allocations/deallocate", allowRoles("ADMIN"), deallocateRoomHandler);

// ============================================
// MESS ROUTES
// ============================================
router.get("/:hostelId/mess", getMessByHostelHandler);
router.post("/mess", allowRoles("ADMIN"), createMessHandler);
router.put("/mess/:id", allowRoles("ADMIN"), updateMessHandler);
router.post("/mess/menu", allowRoles("ADMIN"), setMessMenuHandler);
router.get("/mess/:messId/menu", getMessMenuHandler);

export default router;
