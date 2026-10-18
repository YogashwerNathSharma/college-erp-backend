
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STUDENT PORTAL CONTROLLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Response } from "express";
import {
  getMyProfileService,
  getMyDashboardService,
  getMyTimetableService,
  getMyAttendanceSummaryService,
  getMyAttendanceDetailService,
  getMyFeeSummaryService,
  getMyFeeDetailsService,
  getMyExamsService,
  getMyMarksService,
  getMySubjectsService,
  getMyLibraryService,
} from "./studentPortal.service";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY PROFILE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getMyProfileController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.tenantId;
    const data = await getMyProfileService(userId, tenantId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY DASHBOARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getMyDashboardController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.tenantId;
    const data = await getMyDashboardService(userId, tenantId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY TIMETABLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getMyTimetableController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.tenantId;
    const { day } = req.query; // optional: "MON", "TUE", etc. or "today"
    const data = await getMyTimetableService(userId, tenantId, day as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY ATTENDANCE SUMMARY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getMyAttendanceSummaryController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.tenantId;
    const data = await getMyAttendanceSummaryService(userId, tenantId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY ATTENDANCE DETAIL (day-by-day)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getMyAttendanceDetailController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.tenantId;
    const { month, year } = req.query;
    const data = await getMyAttendanceDetailService(
      userId,
      tenantId,
      month ? parseInt(month as string) : undefined,
      year ? parseInt(year as string) : undefined
    );
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY FEE SUMMARY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getMyFeeSummaryController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.tenantId;
    const data = await getMyFeeSummaryService(userId, tenantId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY FEE DETAILS (installment-wise)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getMyFeeDetailsController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.tenantId;
    const data = await getMyFeeDetailsService(userId, tenantId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY EXAMS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getMyExamsController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.tenantId;
    const data = await getMyExamsService(userId, tenantId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY MARKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getMyMarksController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.tenantId;
    const { examId } = req.query;
    const data = await getMyMarksService(userId, tenantId, examId as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY SUBJECTS (Courses)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getMySubjectsController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.tenantId;
    const data = await getMySubjectsService(userId, tenantId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET MY LIBRARY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getMyLibraryController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.tenantId;
    const data = await getMyLibraryService(userId, tenantId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
