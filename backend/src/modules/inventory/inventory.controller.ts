import { Request, Response } from "express";
import * as inventoryService from "./inventory.service";

// ============================================
// ASSET HANDLERS
// ============================================

export const createAssetHandler = async (req: any, res: Response) => {
  try {
    const result = await inventoryService.createAsset(req.body, req.tenantId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAllAssetsHandler = async (req: any, res: Response) => {
  try {
    const { category, condition, location, search, page, limit } = req.query;
    const result = await inventoryService.getAllAssets(req.tenantId, {
      category, condition, location, search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAssetByIdHandler = async (req: any, res: Response) => {
  try {
    const asset = await inventoryService.getAssetById(req.params.id, req.tenantId);
    if (!asset) return res.status(404).json({ success: false, message: "Asset not found" });
    res.json({ success: true, data: asset });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateAssetHandler = async (req: any, res: Response) => {
  try {
    const result = await inventoryService.updateAsset(req.params.id, req.body, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteAssetHandler = async (req: any, res: Response) => {
  try {
    await inventoryService.deleteAsset(req.params.id, req.tenantId);
    res.json({ success: true, message: "Asset deleted successfully" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================================
// STOCK HANDLERS
// ============================================

export const createStockItemHandler = async (req: any, res: Response) => {
  try {
    const result = await inventoryService.createStockItem(req.body, req.tenantId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAllStockItemsHandler = async (req: any, res: Response) => {
  try {
    const { category, lowStock, search, page, limit } = req.query;
    const result = await inventoryService.getAllStockItems(req.tenantId, {
      category, lowStock: lowStock === "true", search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const recordStockTransactionHandler = async (req: any, res: Response) => {
  try {
    const result = await inventoryService.recordStockTransaction(req.body, req.tenantId, req.user?.userId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================================
// ISSUE / RETURN HANDLERS
// ============================================

export const issueAssetHandler = async (req: any, res: Response) => {
  try {
    const result = await inventoryService.issueAsset(req.body, req.tenantId, req.user?.userId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const returnAssetHandler = async (req: any, res: Response) => {
  try {
    const result = await inventoryService.returnAsset(req.body, req.tenantId, req.user?.userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getIssueHistoryHandler = async (req: any, res: Response) => {
  try {
    const { assetId, issuedTo, status } = req.query;
    const result = await inventoryService.getIssueHistory(req.tenantId, { assetId, issuedTo, status });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// STATS
// ============================================

export const getInventoryStatsHandler = async (req: any, res: Response) => {
  try {
    const result = await inventoryService.getInventoryStats(req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
