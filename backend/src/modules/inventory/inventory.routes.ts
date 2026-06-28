import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  createAssetHandler,
  getAllAssetsHandler,
  getAssetByIdHandler,
  updateAssetHandler,
  deleteAssetHandler,
  createStockItemHandler,
  getAllStockItemsHandler,
  recordStockTransactionHandler,
  issueAssetHandler,
  returnAssetHandler,
  getIssueHistoryHandler,
  getInventoryStatsHandler,
} from "./inventory.controller";

const router = Router();

router.use(authMiddleware, resolveTenant);

// ============================================
// DASHBOARD / STATS
// ============================================
router.get("/stats", allowRoles("ADMIN"), getInventoryStatsHandler);
router.get("/dashboard", allowRoles("ADMIN"), getInventoryStatsHandler); // Frontend alias

// ============================================
// ASSET ROUTES
// ============================================
router.get("/assets", getAllAssetsHandler);
router.get("/assets/:id", getAssetByIdHandler);
router.post("/assets", allowRoles("ADMIN"), createAssetHandler);
router.put("/assets/:id", allowRoles("ADMIN"), updateAssetHandler);
router.delete("/assets/:id", allowRoles("ADMIN"), deleteAssetHandler);

// ============================================
// STOCK ROUTES
// ============================================
router.get("/stock", getAllStockItemsHandler);
router.post("/stock", allowRoles("ADMIN"), createStockItemHandler);
router.post("/stock/transaction", allowRoles("ADMIN"), recordStockTransactionHandler);

// ============================================
// ISSUE / RETURN ROUTES
// ============================================
router.get("/issues", getIssueHistoryHandler);
router.post("/issues/issue", allowRoles("ADMIN"), issueAssetHandler);
router.post("/issues/return", allowRoles("ADMIN"), returnAssetHandler);

export default router;
