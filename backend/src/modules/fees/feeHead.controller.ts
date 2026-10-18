
import { feeHeadService } from "./feeHead.service";

// ═══════════════════════════════════════════════════════════════════════════
// FEE HEAD CONTROLLER — Enhanced with Category, Frequency, Source filters
// ═══════════════════════════════════════════════════════════════════════════

// Get all fee heads (with optional filters: ?category=Transport&sourceModule=Manual&type=RECURRING)
const getAll = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    const { category, sourceModule, type } = req.query;
    const feeHeads = await feeHeadService.getAll(tenantId, { category, sourceModule, type });
    return res.status(200).json(feeHeads);
  } catch (error: any) {
    console.error("Error fetching fee heads:", error);
    return res.status(500).json({ message: "Failed to fetch fee heads" });
  }
};

// Get fee head by ID
const getById = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    const { id } = req.params;
    const feeHead = await feeHeadService.getById(id, tenantId);

    if (!feeHead) {
      return res.status(404).json({ message: "Fee head not found" });
    }

    return res.status(200).json(feeHead);
  } catch (error: any) {
    console.error("Error fetching fee head:", error);
    return res.status(500).json({ message: "Failed to fetch fee head" });
  }
};

// Create a new fee head
const create = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    const { name, code, description, type, category, frequency, isTaxable, isRefundable, sourceModule } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Fee head name is required" });
    }

    const feeHead = await feeHeadService.create({
      name: name.trim(),
      code: code?.trim(),
      description: description?.trim(),
      type,
      category: category?.trim(),
      frequency: frequency?.trim(),
      isTaxable,
      isRefundable,
      sourceModule: sourceModule?.trim(),
      tenantId,
    });

    return res.status(201).json(feeHead);
  } catch (error: any) {
    console.error("Error creating fee head:", error);

    if (error.code === "P2002") {
      return res.status(400).json({ message: "A fee head with this name already exists" });
    }

    return res.status(500).json({ message: "Failed to create fee head" });
  }
};

// Update a fee head
const update = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    const { id } = req.params;
    const { name, code, description, type, isActive, category, frequency, isTaxable, isRefundable, sourceModule } = req.body;

    if (name !== undefined && name.trim() === "") {
      return res.status(400).json({ message: "Fee head name cannot be empty" });
    }

    const feeHead = await feeHeadService.update(
      id,
      {
        name: name?.trim(),
        code: code?.trim(),
        description: description?.trim(),
        type,
        isActive,
        category: category?.trim(),
        frequency: frequency?.trim(),
        isTaxable,
        isRefundable,
        sourceModule: sourceModule?.trim(),
      },
      tenantId
    );

    if (!feeHead) {
      return res.status(404).json({ message: "Fee head not found" });
    }

    return res.status(200).json(feeHead);
  } catch (error: any) {
    console.error("Error updating fee head:", error);

    if (error.code === "P2002") {
      return res.status(400).json({ message: "A fee head with this name already exists" });
    }

    return res.status(500).json({ message: "Failed to update fee head" });
  }
};

// Soft delete a fee head
const softDelete = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    const { id } = req.params;
    const feeHead = await feeHeadService.softDelete(id, tenantId);

    if (!feeHead) {
      return res.status(404).json({ message: "Fee head not found" });
    }

    return res.status(200).json({ message: "Fee head deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting fee head:", error);
    return res.status(500).json({ message: "Failed to delete fee head" });
  }
};

// Get fee heads grouped by category
const getByCategory = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    const grouped = await feeHeadService.getByCategory(tenantId);
    return res.status(200).json({ success: true, data: grouped });
  } catch (error: any) {
    console.error("Error fetching fee heads by category:", error);
    return res.status(500).json({ message: "Failed to fetch fee heads" });
  }
};

// Get fee heads by source module
const getBySource = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    const { source } = req.params;
    if (!source) {
      return res.status(400).json({ message: "Source module is required" });
    }

    const heads = await feeHeadService.getBySource(tenantId, source);
    return res.status(200).json({ success: true, data: heads });
  } catch (error: any) {
    console.error("Error fetching fee heads by source:", error);
    return res.status(500).json({ message: "Failed to fetch fee heads" });
  }
};

export const feeHeadController = {
  getAll,
  getById,
  create,
  update,
  softDelete,
  getByCategory,
  getBySource,
};
