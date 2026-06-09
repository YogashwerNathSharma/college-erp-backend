
import { fineRuleService } from "./fineRule.service";

export const fineRuleController = {
  async getAll(req: any, res: any) {
    try {
      const tenantId = req.user?.tenantId;
      const rules = await fineRuleService.getAll(tenantId);
      res.json({ success: true, data: rules });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getById(req: any, res: any) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      const rule = await fineRuleService.getById(id, tenantId);
      if (!rule) {
        return res.status(404).json({ success: false, message: "Fine rule not found" });
      }
      res.json({ success: true, data: rule });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async create(req: any, res: any) {
    try {
      const tenantId = req.user?.tenantId;
      const { name, afterDays, amountPerDay, maxAmount } = req.body;

      if (!name || afterDays === undefined || amountPerDay === undefined || maxAmount === undefined) {
        return res.status(400).json({
          success: false,
          message: "Name, afterDays, amountPerDay, and maxAmount are required",
        });
      }

      if (afterDays < 0 || amountPerDay < 0 || maxAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "Numeric values must be non-negative",
        });
      }

      const rule = await fineRuleService.create({
        tenantId,
        name,
        afterDays,
        amountPerDay,
        maxAmount,
      });

      res.status(201).json({ success: true, data: rule });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async update(req: any, res: any) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      const { name, afterDays, amountPerDay, maxAmount, isActive } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (afterDays !== undefined) updateData.afterDays = afterDays;
      if (amountPerDay !== undefined) updateData.amountPerDay = amountPerDay;
      if (maxAmount !== undefined) updateData.maxAmount = maxAmount;
      if (isActive !== undefined) updateData.isActive = isActive;

      const result = await fineRuleService.update(id, tenantId, updateData);

      if (result.count === 0) {
        return res.status(404).json({ success: false, message: "Fine rule not found" });
      }

      res.json({ success: true, message: "Fine rule updated successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async delete(req: any, res: any) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      const result = await fineRuleService.softDelete(id, tenantId);

      if (result.count === 0) {
        return res.status(404).json({ success: false, message: "Fine rule not found" });
      }

      res.json({ success: true, message: "Fine rule deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

