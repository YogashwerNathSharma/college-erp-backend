import prisma from "../../../config/prisma";

interface AttendanceSummary {
  staffId: string;
  staffName: string;
  department: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  leaveDays: number;
  attendancePercentage: number;
}

export const getAttendanceSummary = async (
  tenantId: string,
  month: number,
  year: number
): Promise<AttendanceSummary[]> => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month

  // Get all staff
  const allStaff = await prisma.staff.findMany({
    where: { tenantId, isDeleted: false },
    select: { id: true, firstName: true, lastName: true, department: true },
  });

  // Get attendance records for the month
  const attendanceRecords = await prisma.staffAttendance.findMany({
    where: {
      tenantId,
      date: { gte: startDate, lte: endDate },
    },
  });

  // Calculate working days (exclude Sundays)
  let totalWorkingDays = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    if (current.getDay() !== 0) totalWorkingDays++;
    current.setDate(current.getDate() + 1);
  }

  const summaries: AttendanceSummary[] = allStaff.map((staff) => {
    const staffRecords = attendanceRecords.filter((r) => r.staffId === staff.id);

    const presentDays = staffRecords.filter((r) => r.status === "PRESENT").length;
    const absentDays = staffRecords.filter((r) => r.status === "ABSENT").length;
    const lateDays = staffRecords.filter((r) => r.status === "LATE").length;
    const halfDays = staffRecords.filter((r) => r.status === "HALF_DAY").length;
    const leaveDays = staffRecords.filter((r) => r.status === "ON_LEAVE").length;

    const effectivePresent = presentDays + lateDays + halfDays * 0.5;
    const attendancePercentage = totalWorkingDays > 0
      ? Math.round((effectivePresent / totalWorkingDays) * 100)
      : 0;

    return {
      staffId: staff.id,
      staffName: `${staff.firstName} ${staff.lastName}`,
      department: staff.department || "N/A",
      totalDays: totalWorkingDays,
      presentDays,
      absentDays,
      lateDays,
      halfDays,
      leaveDays,
      attendancePercentage,
    };
  });

  return summaries;
};

export const getDailyAttendanceStatus = async (tenantId: string, date: string) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const [totalStaff, attendance] = await Promise.all([
    prisma.staff.count({ where: { tenantId, isDeleted: false } }),
    prisma.staffAttendance.findMany({
      where: { tenantId, date: { gte: targetDate, lt: nextDay } },
      include: { staff: { select: { firstName: true, lastName: true, department: true } } },
    }),
  ]);

  const present = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const absent = attendance.filter((a) => a.status === "ABSENT").length;
  const onLeave = attendance.filter((a) => a.status === "ON_LEAVE").length;
  const notMarked = totalStaff - attendance.length;

  return {
    date: targetDate.toISOString().split("T")[0],
    totalStaff,
    present,
    absent,
    onLeave,
    notMarked,
    attendancePercentage: totalStaff > 0 ? Math.round((present / totalStaff) * 100) : 0,
    records: attendance,
  };
};
