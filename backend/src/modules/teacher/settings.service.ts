

import prisma from "../../utils/prisma";

//////////////////////////////////////////////////////
// GET SETTINGS
//////////////////////////////////////////////////////
export const getSettings = async (tenantId: string) => {
  let settings = await prisma.teacherSettings.findFirst({
    where: { tenantId },
  });

  // Create default settings if not exists
  if (!settings) {
    // Get active academic year
    const activeYear = await prisma.academicYear.findFirst({
      where: { tenantId, isCurrent: true },
    });

    settings = await prisma.teacherSettings.create({
      data: {
        tenantId,
        academicYearId: activeYear?.id || "",
      },
    });
  }

  return settings;
};

//////////////////////////////////////////////////////
// UPDATE SETTINGS
//////////////////////////////////////////////////////
export const updateSettings = async (data: any, tenantId: string) => {
  let settings = await prisma.teacherSettings.findFirst({
    where: { tenantId },
  });

  if (!settings) {
    // Create with provided data
    const activeYear = await prisma.academicYear.findFirst({
      where: { tenantId, isCurrent: true },
    });

    settings = await prisma.teacherSettings.create({
      data: {
        tenantId,
        academicYearId: data.academicYearId || activeYear?.id || "",
        ...data,
      },
    });
    return settings;
  }

  // Update existing
  const updated = await prisma.teacherSettings.update({
    where: { id: settings.id },
    data: {
      dateFormat: data.dateFormat ?? settings.dateFormat,
      timeFormat: data.timeFormat ?? settings.timeFormat,
      attendanceRequired: data.attendanceRequired ?? settings.attendanceRequired,
      lateMarkTime: data.lateMarkTime ?? settings.lateMarkTime,
      halfDayTime: data.halfDayTime ?? settings.halfDayTime,
      casualLeavePerYear: data.casualLeavePerYear ?? settings.casualLeavePerYear,
      medicalLeavePerYear: data.medicalLeavePerYear ?? settings.medicalLeavePerYear,
      earnedLeavePerYear: data.earnedLeavePerYear ?? settings.earnedLeavePerYear,
      payDay: data.payDay ?? settings.payDay,
      salarySlipTemplate: data.salarySlipTemplate ?? settings.salarySlipTemplate,
      emailNotifications: data.emailNotifications ?? settings.emailNotifications,
      smsNotifications: data.smsNotifications ?? settings.smsNotifications,
    },
  });

  return updated;
};

