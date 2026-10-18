
import { feeDiscountService } from "./feeDiscount.service";

export const feeDiscountController = {
  async getAll(req: any, res: any) {
    try {
      const tenantId = req.user?.tenantId;
      const discounts = await feeDiscountService.getAll(tenantId);
      res.json({ success: true, data: discounts });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getById(req: any, res: any) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      const discount = await feeDiscountService.getById(id, tenantId);
      if (!discount) {
        return res.status(404).json({ success: false, message: "Fee discount not found" });
      }
      res.json({ success: true, data: discount });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async create(req: any, res: any) {
    try {
      const tenantId = req.user?.tenantId;
      const { name, type, value, description, applicableHeadIds } = req.body;

      if (!name || !type || value === undefined) {
        return res.status(400).json({ success: false, message: "Name, type, and value are required" });
      }

      if (!["PERCENTAGE", "FIXED"].includes(type)) {
        return res.status(400).json({ success: false, message: "Type must be PERCENTAGE or FIXED" });
      }

      if (type === "PERCENTAGE" && (value < 0 || value > 100)) {
        return res.status(400).json({ success: false, message: "Percentage value must be between 0 and 100" });
      }

      const discount = await feeDiscountService.create({
        tenantId,
        name,
        type,
        value,
        description,
        applicableHeadIds,
      });

      res.status(201).json({ success: true, data: discount });
    } catch (error: any) {
      if (error.code === "P2002") {
        return res.status(409).json({ success: false, message: "A discount with this name already exists" });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async update(req: any, res: any) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      const { name, type, value, description, applicableHeadIds, isActive } = req.body;

      if (type && !["PERCENTAGE", "FIXED"].includes(type)) {
        return res.status(400).json({ success: false, message: "Type must be PERCENTAGE or FIXED" });
      }

      if (type === "PERCENTAGE" && value !== undefined && (value < 0 || value > 100)) {
        return res.status(400).json({ success: false, message: "Percentage value must be between 0 and 100" });
      }

      const result = await feeDiscountService.update(id, tenantId, {
        name,
        type,
        value,
        description,
        applicableHeadIds,
        isActive,
      });

      if (result.count === 0) {
        return res.status(404).json({ success: false, message: "Fee discount not found" });
      }

      res.json({ success: true, message: "Fee discount updated successfully" });
    } catch (error: any) {
      if (error.code === "P2002") {
        return res.status(409).json({ success: false, message: "A discount with this name already exists" });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async delete(req: any, res: any) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      const result = await feeDiscountService.softDelete(id, tenantId);

      if (result.count === 0) {
        return res.status(404).json({ success: false, message: "Fee discount not found" });
      }

      res.json({ success: true, message: "Fee discount deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

