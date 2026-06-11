
import { getFeeDashboard } from "./feeDashboard.service";

// GET /api/fees/dashboard?academicYearId=xxx
export const getFeeDashboardController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { academicYearId } = req.query;

    const result = await getFeeDashboard(tenantId, academicYearId as string);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

