
import { getFeeSettings, updateFeeSettings } from "./feeSettings.service";

// GET /api/fees/settings
export const getFeeSettingsController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const result = await getFeeSettings(tenantId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// PUT /api/fees/settings
export const updateFeeSettingsController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const settings = req.body;

    if (!settings) {
      return res.status(400).json({ error: "Settings data is required" });
    }

    const result = await updateFeeSettings(tenantId, settings);
    res.json({ success: true, data: result, message: "Settings updated successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

