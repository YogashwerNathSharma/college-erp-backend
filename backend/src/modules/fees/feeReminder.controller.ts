
import { sendFeeReminders, getReminderPreview } from "./feeReminder.service";

// POST /api/fees/reminders/send
export const sendFeeReminderController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const { classId, sendTo, message, channels } = req.body;
    // Use body.academicYearId first, fall back to middleware-resolved academicYearId
    const academicYearId = req.body.academicYearId || (req as any).academicYearId;

    if (!academicYearId) {
      return res.status(400).json({ success: false, error: "academicYearId is required" });
    }

    if (!message || !channels || channels.length === 0) {
      return res.status(400).json({ success: false, error: "message and channels are required" });
    }

    const result = await sendFeeReminders({
      classId,
      academicYearId,
      sendTo: sendTo || "DUE_ONLY",
      message,
      channels,
      tenantId,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// GET /api/fees/reminders/preview?classId=xxx&academicYearId=xxx&sendTo=DUE_ONLY
export const getReminderPreviewController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const { classId, sendTo } = req.query;
    // Use query.academicYearId first, fall back to middleware-resolved academicYearId
    const academicYearId = req.query.academicYearId as string || (req as any).academicYearId;

    if (!academicYearId) {
      return res.status(400).json({ success: false, error: "academicYearId is required" });
    }

    const result = await getReminderPreview(
      classId as string,
      academicYearId,
      (sendTo as string as any) || "DUE_ONLY",
      tenantId
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
