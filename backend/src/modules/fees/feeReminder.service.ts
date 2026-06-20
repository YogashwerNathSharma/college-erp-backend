
import prisma from "../../utils/prisma";

interface SendReminderParams {
  classId?: string;
  academicYearId: string;
  sendTo: "ALL" | "DUE_ONLY";
  message: string;
  channels: string[]; // ["SMS", "EMAIL", "WHATSAPP"]
  tenantId: string;
}

/**
 * Get students for reminder (filter by due status if needed)
 */
export const getStudentsForReminder = async (
  classId: string | undefined,
  academicYearId: string,
  sendTo: "ALL" | "DUE_ONLY",
  tenantId: string
) => {
  const whereClause: any = {
    tenantId,
    academicYearId,
    status: "active",
    isDeleted: false,
  };

  if (classId) {
    whereClause.classId = classId;
  }

  const enrollments = await prisma.enrollment.findMany({
    where: whereClause,
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
          admissionNo: true,
          fatherName: true,
          phone: true,
        },
      },
      class: { select: { name: true } },
      section: { select: { name: true } },
    },
  });

  if (sendTo === "ALL") {
    return enrollments;
  }

  // DUE_ONLY — filter students who have pending balance
  const enrollmentIds = enrollments.map((e) => e.id);
  const dueStudents = await prisma.studentFee.groupBy({
    by: ["enrollmentId"],
    where: {
      enrollmentId: { in: enrollmentIds },
      tenantId,
      balanceAmount: { gt: 0 },
      isDeleted: false,
    },
    _sum: { balanceAmount: true },
  });

  const dueEnrollmentIds = new Set(dueStudents.map((d) => d.enrollmentId));
  return enrollments.filter((e) => dueEnrollmentIds.has(e.id));
};

/**
 * Send fee reminders (simulated — logs to console, returns count)
 */
export const sendFeeReminders = async (params: SendReminderParams) => {
  const { classId, academicYearId, sendTo, message, channels, tenantId } = params;

  const students = await getStudentsForReminder(classId, academicYearId, sendTo, tenantId);

  if (students.length === 0) {
    throw new Error("No students found for the selected criteria");
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const enrollment of students) {
    try {
      const studentName = `${enrollment.student.firstName} ${enrollment.student.lastName}`;
      const phone = enrollment.student.phone;

      // Simulate sending
      const personalizedMessage = message
        .replace("[student_name]", studentName)
        .replace("[father_name]", enrollment.student.fatherName || "Parent")
        .replace("[class]", enrollment.class.name)
        .replace("[admission_no]", enrollment.student.admissionNo || "");

      // Log (in production, integrate with SMS/Email/WhatsApp API)
      console.log(`[FEE REMINDER] To: ${phone} | Channels: ${channels.join(",")} | Message: ${personalizedMessage.substring(0, 50)}...`);

      sentCount++;
    } catch (error) {
      failedCount++;
    }
  }

  return {
    sent: sentCount,
    failed: failedCount,
    total: students.length,
    message: `Reminders sent to ${sentCount} students via ${channels.join(", ")}`,
    channels,
  };
};

/**
 * Get reminder preview — count of students who will receive
 */
export const getReminderPreview = async (
  classId: string | undefined,
  academicYearId: string,
  sendTo: "ALL" | "DUE_ONLY",
  tenantId: string
) => {
  const students = await getStudentsForReminder(classId, academicYearId, sendTo, tenantId);

  return {
    totalStudents: students.length,
    students: students.slice(0, 10).map((e) => ({
      name: `${e.student.firstName} ${e.student.lastName}`,
      admissionNo: e.student.admissionNo,
      phone: e.student.phone,
      class: e.class.name,
    })),
  };
};

