
import { getFeeReports } from "./feeReports.service";

// GET /api/fees/reports?academicYearId=xxx&fromDate=xxx&toDate=xxx
export const getFeeReportsController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { academicYearId, fromDate, toDate } = req.query;

    const result = await getFeeReports(tenantId, {
      academicYearId: academicYearId as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

