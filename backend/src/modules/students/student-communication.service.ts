// ══════════════════════════════════════════════════════════════════════════════
// STUDENT COMMUNICATION SERVICE — SMS, Email, WhatsApp, Push Notifications
// ══════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
import { CommunicationType, CommunicationStatus } from "./student.types";

const prisma = new PrismaClient();

// ============================================
// SEND SMS
// ============================================
export const sendSMS = async (
  tenantId: string,
  studentId: string,
  message: string,
  to: string,
  sentBy: string,
  templateId?: string
) => {
  // Validate phone number
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(to.replace(/^\+91/, ""))) {
    throw new Error("Invalid phone number format");
  }

  // Get student for name
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId },
    select: { firstName: true, lastName: true, fatherName: true },
  });
  if (!student) throw new Error("Student not found");

  // Replace variables in message
  const processedMessage = replaceVariables(message, {
    student_name: `${student.firstName} ${student.lastName}`,
    father_name: student.fatherName,
  });

  // TODO: Integrate with actual SMS provider (Twilio, MSG91, etc.)
  // For now, log the communication
  const log = await (prisma.communicationLog as any).create({
    data: {
      studentId,
      tenantId,
      type: "sms",
      message: processedMessage,
      sentTo: to,
      sentToName: determineSentToName(to, student as any),
      sentBy,
      status: "queued",
      templateId: templateId || null,
      sentAt: new Date(),
    },
  });

  // Simulate sending (replace with actual provider call)
  try {
    // await smsProvider.send({ to, message: processedMessage });
    await (prisma.communicationLog as any).update({
      where: { id: log.id },
      data: { status: "sent" },
    });
    return { success: true, logId: log.id, message: "SMS queued for delivery" };
  } catch (err: any) {
    await (prisma.communicationLog as any).update({
      where: { id: log.id },
      data: { status: "failed", failureReason: err.message },
    });
    throw new Error(`SMS delivery failed: ${err.message}`);
  }
};

// ============================================
// SEND EMAIL
// ============================================
export const sendEmail = async (
  tenantId: string,
  studentId: string,
  subject: string,
  body: string,
  to: string,
  sentBy: string,
  templateId?: string
) => {
  if (!to || !to.includes("@")) {
    throw new Error("Invalid email address");
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId },
    select: { firstName: true, lastName: true, fatherName: true },
  });
  if (!student) throw new Error("Student not found");

  const processedBody = replaceVariables(body, {
    student_name: `${student.firstName} ${student.lastName}`,
    father_name: student.fatherName,
  });

  const log = await (prisma.communicationLog as any).create({
    data: {
      studentId,
      tenantId,
      type: "email",
      subject,
      message: processedBody,
      sentTo: to,
      sentBy,
      status: "queued",
      templateId: templateId || null,
      sentAt: new Date(),
    },
  });

  try {
    // TODO: Integrate with nodemailer or email service
    // await emailService.send({ to, subject, html: processedBody });
    await (prisma.communicationLog as any).update({
      where: { id: log.id },
      data: { status: "sent" },
    });
    return { success: true, logId: log.id, message: "Email sent successfully" };
  } catch (err: any) {
    await (prisma.communicationLog as any).update({
      where: { id: log.id },
      data: { status: "failed", failureReason: err.message },
    });
    throw new Error(`Email delivery failed: ${err.message}`);
  }
};

// ============================================
// SEND WHATSAPP
// ============================================
export const sendWhatsApp = async (
  tenantId: string,
  studentId: string,
  message: string,
  to: string,
  sentBy: string,
  templateId?: string
) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(to.replace(/^\+91/, ""))) {
    throw new Error("Invalid phone number for WhatsApp");
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId },
    select: { firstName: true, lastName: true, fatherName: true },
  });
  if (!student) throw new Error("Student not found");

  const processedMessage = replaceVariables(message, {
    student_name: `${student.firstName} ${student.lastName}`,
    father_name: student.fatherName,
  });

  const log = await (prisma.communicationLog as any).create({
    data: {
      studentId,
      tenantId,
      type: "whatsapp",
      message: processedMessage,
      sentTo: to,
      sentBy,
      status: "queued",
      templateId: templateId || null,
      sentAt: new Date(),
    },
  });

  try {
    // TODO: Integrate with WhatsApp Business API
    // await whatsappService.send({ to: `+91${to}`, message: processedMessage });
    await (prisma.communicationLog as any).update({
      where: { id: log.id },
      data: { status: "sent" },
    });
    return { success: true, logId: log.id, message: "WhatsApp message queued" };
  } catch (err: any) {
    await (prisma.communicationLog as any).update({
      where: { id: log.id },
      data: { status: "failed", failureReason: err.message },
    });
    throw new Error(`WhatsApp delivery failed: ${err.message}`);
  }
};

// ============================================
// BULK SMS
// ============================================
export const bulkSMS = async (
  tenantId: string,
  studentIds: string[],
  message: string,
  sentBy: string,
  recipientType: "student" | "father" | "mother" | "guardian" = "father"
) => {
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, tenantId, isDeleted: false },
    select: {
      id: true, firstName: true, lastName: true,
      phone: true, fatherPhone: true, motherPhone: true, guardianPhone: true,
      fatherName: true,
    },
  });

  const results = { total: students.length, sent: 0, failed: 0, errors: [] as any[] };

  for (const student of students) {
    const to = getRecipientPhone(student, recipientType);
    if (!to) {
      results.failed++;
      results.errors.push({ id: student.id, message: `No ${recipientType} phone number` });
      continue;
    }

    try {
      await sendSMS(tenantId, student.id, message, to, sentBy);
      results.sent++;
    } catch (err: any) {
      results.failed++;
      results.errors.push({ id: student.id, message: err.message });
    }
  }

  return results;
};

// ============================================
// BULK EMAIL
// ============================================
export const bulkEmail = async (
  tenantId: string,
  studentIds: string[],
  subject: string,
  body: string,
  sentBy: string,
  recipientType: "student" | "father" | "mother" | "guardian" = "student"
) => {
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, tenantId, isDeleted: false },
    select: {
      id: true, firstName: true, lastName: true,
      email: true, fatherEmail: true, motherEmail: true, guardianEmail: true,
      fatherName: true,
    },
  });

  const results = { total: students.length, sent: 0, failed: 0, errors: [] as any[] };

  for (const student of students) {
    const to = getRecipientEmail(student, recipientType);
    if (!to) {
      results.failed++;
      results.errors.push({ id: student.id, message: `No ${recipientType} email address` });
      continue;
    }

    try {
      await sendEmail(tenantId, student.id, subject, body, to, sentBy);
      results.sent++;
    } catch (err: any) {
      results.failed++;
      results.errors.push({ id: student.id, message: err.message });
    }
  }

  return results;
};

// ============================================
// BULK WHATSAPP
// ============================================
export const bulkWhatsApp = async (
  tenantId: string,
  studentIds: string[],
  message: string,
  sentBy: string,
  recipientType: "student" | "father" | "mother" | "guardian" = "father"
) => {
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, tenantId, isDeleted: false },
    select: {
      id: true, firstName: true, lastName: true,
      whatsApp: true, fatherWhatsApp: true, motherWhatsApp: true, guardianWhatsApp: true,
      fatherPhone: true, phone: true, fatherName: true,
    },
  });

  const results = { total: students.length, sent: 0, failed: 0, errors: [] as any[] };

  for (const student of students) {
    const to = getRecipientWhatsApp(student, recipientType);
    if (!to) {
      results.failed++;
      results.errors.push({ id: student.id, message: `No ${recipientType} WhatsApp number` });
      continue;
    }

    try {
      await sendWhatsApp(tenantId, student.id, message, to, sentBy);
      results.sent++;
    } catch (err: any) {
      results.failed++;
      results.errors.push({ id: student.id, message: err.message });
    }
  }

  return results;
};

// ============================================
// SEND BIRTHDAY WISHES
// ============================================
export const sendBirthdayWishes = async (tenantId: string, sentBy: string) => {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const students = await prisma.student.findMany({
    where: { tenantId, isDeleted: false, status: "active" },
    select: {
      id: true, firstName: true, lastName: true, dob: true,
      phone: true, fatherPhone: true, email: true,
    },
  });

  const birthdayStudents = students.filter((s) => {
    const dob = new Date(s.dob);
    return dob.getMonth() + 1 === month && dob.getDate() === day;
  });

  const message = "🎂 Happy Birthday, {{student_name}}! Wishing you a wonderful day filled with joy and success. - From your School Family";
  let sent = 0;

  for (const student of birthdayStudents) {
    const phone = student.fatherPhone || student.phone;
    if (phone) {
      try {
        await sendSMS(tenantId, student.id, message, phone, sentBy);
        sent++;
      } catch {
        // Skip failures silently for birthday wishes
      }
    }
  }

  return { birthdayCount: birthdayStudents.length, messagesSent: sent };
};

// ============================================
// SEND FEE REMINDER
// ============================================
export const sendFeeReminder = async (
  tenantId: string,
  studentIds: string[],
  sentBy: string
) => {
  const message = "Dear Parent, this is a reminder that fee payment for {{student_name}} is pending. Please clear the dues at the earliest. - School Admin";
  return bulkSMS(tenantId, studentIds, message, sentBy, "father");
};

// ============================================
// GET COMMUNICATION LOG
// ============================================
export const getCommunicationLog = async (
  tenantId: string,
  studentId: string,
  filters?: { type?: string; status?: string; limit?: number }
) => {
  const where: any = { studentId, tenantId };
  if (filters?.type) where.type = filters.type;
  if (filters?.status) where.status = filters.status;

  return prisma.communicationLog.findMany({
    where,
    orderBy: { sentAt: "desc" },
    take: filters?.limit || 50,
  });
};

// ============================================
// HELPERS
// ============================================

function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || "");
  }
  return result;
}

function getRecipientPhone(student: any, type: string): string | null {
  switch (type) {
    case "student": return student.phone;
    case "father": return student.fatherPhone;
    case "mother": return student.motherPhone;
    case "guardian": return student.guardianPhone;
    default: return student.fatherPhone || student.phone;
  }
}

function getRecipientEmail(student: any, type: string): string | null {
  switch (type) {
    case "student": return student.email;
    case "father": return student.fatherEmail;
    case "mother": return student.motherEmail;
    case "guardian": return student.guardianEmail;
    default: return student.email;
  }
}

function getRecipientWhatsApp(student: any, type: string): string | null {
  switch (type) {
    case "student": return student.whatsApp || student.phone;
    case "father": return student.fatherWhatsApp || student.fatherPhone;
    case "mother": return student.motherWhatsApp || student.motherPhone;
    case "guardian": return student.guardianWhatsApp || student.guardianPhone;
    default: return student.fatherWhatsApp || student.fatherPhone;
  }
}

function determineSentToName(to: string, student: any): string {
  if (to === student.phone) return "Student";
  if (to === student.fatherPhone) return "Father";
  if (to === student.motherPhone) return "Mother";
  if (to === student.guardianPhone) return "Guardian";
  return "Unknown";
}
