
import { getFeeDashboard } from "./feeDashboard.service";

// GET /api/fees/dashboard?academicYearId=xxx
export const getFeeDashboardController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: "Unauthorized" });

    // Use middleware-resolved academicYearId as primary, fall back to query param
    const academicYearId = (req as any).academicYearId || req.query.academicYearId as string;

    const result = await getFeeDashboard(tenantId, academicYearId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Fee Dashboard Error:", error.message, error.stack);
    // Return empty data instead of error so frontend doesn't crash
    res.json({ success: true, data: {
      summary: { totalStudents: 0, totalReceivable: 0, totalCollected: 0, outstanding: 0 },
      monthlyCollection: [],
      classwiseOutstanding: [],
      recentCollections: [],
    }});
  }
};
