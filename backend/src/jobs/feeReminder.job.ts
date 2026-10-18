import prisma from "../config/prisma";
import { sendSms } from "../modules/communication/helpers/sms.helper";
import { sendEmail } from "../modules/communication/helpers/email.helper";
import { sendFCMMulticast } from "../modules/notifications/helpers/fcm.helper";

/**
 * Fee Reminder Job
 * Sends reminders to parents/students with pending fee balances
 * Scheduled to run daily at 9 AM
 */
export const runFeeReminderJob = async () => {
  console.log("[FeeReminderJob] Starting fee reminder job...");

  try {
    // Get all tenants with active subscriptions
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    let totalReminders = 0;

    for (const tenant of tenants) {
      const tenantId = tenant.id;

      // Get overdue fees (due date passed, balance > 0)
      const overdueFees = await prisma.studentFee.findMany({
        where: {
          tenantId,
          isDeleted: false,
          balanceAmount: { gt: 0 },
          dueDate: { lt: new Date() },
        },
        include: {
          enrollment: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  fatherPhone: true,
                  phone: true,
                  email: true,
                },
              },
              class: { select: { name: true } },
            },
          },
          feeHead: { select: { name: true } },
        },
      });

      // Group by student
      const studentFees: Record<string, { student: any; totalPending: number; fees: any[] }> = {};
      for (const fee of overdueFees) {
        const studentId = fee.enrollment?.student?.id;
        if (!studentId) continue;

        if (!studentFees[studentId]) {
          studentFees[studentId] = {
            student: fee.enrollment.student,
            totalPending: 0,
            fees: [],
          };
        }
        studentFees[studentId].totalPending += fee.balanceAmount;
        studentFees[studentId].fees.push(fee);
      }

      // Send reminders
      for (const [studentId, data] of Object.entries(studentFees)) {
        const { student, totalPending } = data;
        const message = `Dear Parent, a fee of Rs.${totalPending} is pending for ${student.firstName} ${student.lastName}. Please pay at the earliest. - ${tenant.name}`;

        // SMS to father
        if (student.fatherPhone) {
          try {
            await sendSms(student.fatherPhone, message);
          } catch (err) {
            console.error(`[FeeReminderJob] SMS failed for ${student.fatherPhone}:`, err);
          }
        }

        // Email to student
        if (student.email) {
          try {
            await sendEmail({
              to: student.email,
              subject: `Fee Reminder - ${tenant.name}`,
              body: message,
            });
          } catch (err) {
            console.error(`[FeeReminderJob] Email failed for ${student.email}:`, err);
          }
        }

        totalReminders++;
      }

      console.log(`[FeeReminderJob] Tenant ${tenant.name}: ${Object.keys(studentFees).length} reminders sent`);
    }

    console.log(`[FeeReminderJob] Completed. Total reminders: ${totalReminders}`);
    return { success: true, totalReminders };
  } catch (error: any) {
    console.error("[FeeReminderJob] Error:", error.message);
    return { success: false, error: error.message };
  }
};

// Optional: Schedule configuration
export const FEE_REMINDER_SCHEDULE = "0 9 * * *"; // Every day at 9 AM
