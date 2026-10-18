import { z } from "zod";

// CREATE ASSET
export const createAssetSchema = z.object({
  name: z.string().min(1, "Asset name is required").trim(),
  category: z.enum(["FURNITURE", "ELECTRONICS", "SPORTS", "LAB_EQUIPMENT", "BOOKS", "VEHICLES", "STATIONERY", "OTHER"]),
  assetCode: z.string().optional(),
  description: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().min(0).optional(),
  vendor: z.string().optional(),
  location: z.string().optional(),
  condition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]).default("NEW"),
  warrantyExpiry: z.string().optional(),
  quantity: z.number().int().positive().default(1),
});

export const updateAssetSchema = createAssetSchema.partial();

// CREATE STOCK ITEM
export const createStockSchema = z.object({
  name: z.string().min(1, "Item name is required").trim(),
  category: z.string().min(1, "Category is required"),
  sku: z.string().optional(),
  unit: z.string().default("pieces"),
  currentStock: z.number().int().min(0).default(0),
  minimumStock: z.number().int().min(0).default(5),
  maximumStock: z.number().int().min(0).optional(),
  costPerUnit: z.number().min(0).optional(),
  location: z.string().optional(),
  supplier: z.string().optional(),
});

export const updateStockSchema = createStockSchema.partial();

// STOCK TRANSACTION
export const stockTransactionSchema = z.object({
  stockItemId: z.string().min(1, "Stock item ID is required"),
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  quantity: z.number().int().positive("Quantity must be positive"),
  reason: z.string().optional(),
  referenceNo: z.string().optional(),
  date: z.string().optional(),
});

// ISSUE ASSET
export const issueAssetSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required"),
  issuedTo: z.string().min(1, "Issued to is required"),
  issuedToType: z.enum(["STAFF", "STUDENT", "DEPARTMENT"]),
  issueDate: z.string().min(1, "Issue date is required"),
  expectedReturnDate: z.string().optional(),
  remarks: z.string().optional(),
});

// RETURN ASSET
export const returnAssetSchema = z.object({
  issueId: z.string().min(1, "Issue ID is required"),
  returnDate: z.string().min(1, "Return date is required"),
  condition: z.enum(["GOOD", "FAIR", "DAMAGED"]).default("GOOD"),
  remarks: z.string().optional(),
});

// PURCHASE ORDER
export const purchaseOrderSchema = z.object({
  vendorName: z.string().min(1, "Vendor name is required"),
  vendorContact: z.string().optional(),
  items: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().int().positive(),
    unitPrice: z.number().min(0),
    description: z.string().optional(),
  })).min(1, "At least one item is required"),
  orderDate: z.string().optional(),
  expectedDelivery: z.string().optional(),
  notes: z.string().optional(),
});
