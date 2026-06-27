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
