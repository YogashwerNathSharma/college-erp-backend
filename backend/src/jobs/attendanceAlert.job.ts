import prisma from "../config/prisma";
import { sendFCMMulticast } from "../modules/notifications/helpers/fcm.helper";

/**
 * Attendance Alert Job
 * Sends notifications when attendance drops below threshold
 * Scheduled to run daily at 11 AM (after attendance is typically marked)
 */
export const runAttendanceAlertJob = async () => {
  console.log("[AttendanceAlertJob] Starting attendance alert job...");

  try {
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    let totalAlerts = 0;
    const ATTENDANCE_THRESHOLD = 75; // Alert if below 75%

    for (const tenant of tenants) {
      const tenantId = tenant.id;

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get students marked absent today
      const absentRecords = await prisma.attendance.findMany({
        where: {
          tenantId,
          date: { gte: today, lt: tomorrow },
          status: { in: ["ABSENT", "absent"] },
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fatherPhone: true,
            },
          },
        },
      });

      // Send immediate absent notifications to parents
      for (const record of absentRecords) {
        if (!record.student) continue;

        // Create in-app notification
        await prisma.notification.create({
          data: {
            tenantId,
            userId: record.student.id, // Parent user ID in a real system
            title: "Absence Alert",
            body: `${record.student.firstName} ${record.student.lastName} was marked absent today.`,
            type: "ATTENDANCE",
            isRead: false,
          },
        });

        totalAlerts++;
      }

      // Check students with attendance below threshold (monthly)
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const monthStart = new Date(currentYear, currentMonth, 1);

      const enrollments = await prisma.enrollment.findMany({
        where: { tenantId, status: "active", isDeleted: false },
        select: { studentId: true, student: { select: { firstName: true, lastName: true } } },
      });

      for (const enrollment of enrollments) {
        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            tenantId,
            studentId: enrollment.studentId,
            date: { gte: monthStart, lt: tomorrow },
          },
        });

        if (attendanceRecords.length < 5) continue; // Not enough data

        const presentCount = attendanceRecords.filter(
          (a) => a.status === "PRESENT" || a.status === "present"
        ).length;
        const percentage = (presentCount / attendanceRecords.length) * 100;

        if (percentage < ATTENDANCE_THRESHOLD) {
          // Create low attendance alert
          await prisma.notification.create({
            data: {
              tenantId,
              userId: enrollment.studentId,
              title: "Low Attendance Warning",
              body: `${enrollment.student.firstName} ${enrollment.student.lastName}'s attendance is ${Math.round(percentage)}%, below the ${ATTENDANCE_THRESHOLD}% threshold.`,
              type: "ATTENDANCE_WARNING",
              isRead: false,
            },
          });
          totalAlerts++;
        }
      }

      console.log(`[AttendanceAlertJob] Tenant ${tenant.name}: ${absentRecords.length} absent alerts sent`);
    }

    console.log(`[AttendanceAlertJob] Completed. Total alerts: ${totalAlerts}`);
    return { success: true, totalAlerts };
  } catch (error: any) {
    console.error("[AttendanceAlertJob] Error:", error.message);
    return { success: false, error: error.message };
  }
};

export const ATTENDANCE_ALERT_SCHEDULE = "0 11 * * 1-6"; // Mon-Sat at 11 AM
