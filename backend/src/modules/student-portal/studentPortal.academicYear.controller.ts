import { Response } from "express";
import {
  getMyProfileServiceAY,
  getMyDashboardServiceAY,
  getMyTimetableServiceAY,
  getMyAttendanceSummaryServiceAY,
  getMyAttendanceDetailServiceAY,
  getMyFeeSummaryServiceAY,
  getMyFeeDetailsServiceAY,
  getMyExamsServiceAY,
  getMyMarksServiceAY,
  getMySubjectsServiceAY,
  getMyLibraryServiceAY,
} from "./studentPortal.academicYear.service";

const context = (req: any) => {
  const userId = req.user?.userId;
  const tenantId = req.tenantId;
  const academicYearId = req.academicYearId;
  if (!userId || !tenantId || !academicYearId) throw new Error("Academic year context is required");
  return { userId, tenantId, academicYearId };
};

const handle = (fn: (req: any) => Promise<any>) => async (req: any, res: Response) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyProfileControllerAY = handle(req => {
  const { userId, tenantId, academicYearId } = context(req);
  return getMyProfileServiceAY(userId, tenantId, academicYearId);
});

export const getMyDashboardControllerAY = handle(req => {
  const { userId, tenantId, academicYearId } = context(req);
  return getMyDashboardServiceAY(userId, tenantId, academicYearId);
});

export const getMyTimetableControllerAY = handle(req => {
  const { userId, tenantId, academicYearId } = context(req);
  return getMyTimetableServiceAY(userId, tenantId, academicYearId, req.query.day as string);
});

export const getMyAttendanceSummaryControllerAY = handle(req => {
  const { userId, tenantId, academicYearId } = context(req);
  return getMyAttendanceSummaryServiceAY(userId, tenantId, academicYearId);
});

export const getMyAttendanceDetailControllerAY = handle(req => {
  const { userId, tenantId, academicYearId } = context(req);
  const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
  const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
  return getMyAttendanceDetailServiceAY(userId, tenantId, academicYearId, month, year);
});

export const getMyFeeSummaryControllerAY = handle(req => {
  const { userId, tenantId, academicYearId } = context(req);
  return getMyFeeSummaryServiceAY(userId, tenantId, academicYearId);
});

export const getMyFeeDetailsControllerAY = handle(req => {
  const { userId, tenantId, academicYearId } = context(req);
  return getMyFeeDetailsServiceAY(userId, tenantId, academicYearId);
});

export const getMyExamsControllerAY = handle(req => {
  const { userId, tenantId, academicYearId } = context(req);
  return getMyExamsServiceAY(userId, tenantId, academicYearId);
});

export const getMyMarksControllerAY = handle(req => {
  const { userId, tenantId, academicYearId } = context(req);
  return getMyMarksServiceAY(userId, tenantId, academicYearId, req.query.examId as string);
});

export const getMySubjectsControllerAY = handle(req => {
  const { userId, tenantId, academicYearId } = context(req);
  return getMySubjectsServiceAY(userId, tenantId, academicYearId);
});

export const getMyLibraryControllerAY = handle(req => {
  const { userId, tenantId, academicYearId } = context(req);
  return getMyLibraryServiceAY(userId, tenantId, academicYearId);
});
