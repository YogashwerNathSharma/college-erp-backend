
import { getStudentLedger, searchStudentForLedger } from "./studentLedger.service";

// GET /api/fees/ledger/:enrollmentId
export const getStudentLedgerController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { enrollmentId } = req.params;

    if (!enrollmentId) {
      return res.status(400).json({ success: false, error: "enrollmentId is required" });
    }

    const result = await getStudentLedger(enrollmentId, tenantId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// GET /api/fees/ledger/search?q=xxx
export const searchStudentForLedgerController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { q } = req.query;

    if (!q || (q as string).trim().length < 2) {
      return res.status(400).json({ success: false, error: "Search query (q) must be at least 2 characters" });
    }

    const result = await searchStudentForLedger(q as string, tenantId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

