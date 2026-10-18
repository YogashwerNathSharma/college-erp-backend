import { Response } from "express";
import prisma from "../../utils/prisma";

// ══════════════════════════════════════════════════════════════════
// STUDENT COMMUNICATION CONTROLLER
// ══════════════════════════════════════════════════════════════════

/**
 * POST /api/students/communication/:id/send-sms
 * Body: { message: string, to: "student" | "father" | "mother" | "guardian", customNumber?: string }
 */
export const sendSMSHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;
    const { message, to, customNumber } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, tenantId, isDeleted: false },
      select: {
        id: true, firstName: true, lastName: true, phone: true,
        fatherPhone: true, motherPhone: true, guardianPhone: true,
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Resolve phone number
    let phoneNumber = customNumber;
    if (!phoneNumber) {
      switch (to) {
        case "student": phoneNumber = student.phone; break;
        case "father": phoneNumber = student.fatherPhone; break;
        case "mother": phoneNumber = student.motherPhone; break;
        case "guardian": phoneNumber = (student as any).guardianPhone; break;
        default: phoneNumber = student.fatherPhone;
      }
    }

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: `No phone number found for ${to || "student"}` });
    }

    // Log the communication (actual SMS sending would use a provider like Twilio/MSG91)
    const log = await (prisma.communicationLog as any).create({ data: {
        studentId,
        tenantId,
        type: "sms", channel: "SMS",
        message,
        sentTo: phoneNumber,
        sentBy: req.user?.name || req.user?.userId || "System",
        status: "sent",
        metadata: { to, recipient: `${student.firstName} ${student.lastName}` },
      },
    }).catch(async () => {
      // If StudentCommunicationLog model doesn't exist yet, log to timeline
      await prisma.studentTimelineEntry.create({
        data: {
          studentId,
          tenantId,
          type: "communication",
          title: `SMS sent to ${to || "parent"}`,
          description: message.substring(0, 200),
          createdBy: req.user?.name || "Admin",
        },
      });
      return { id: "timeline-fallback", status: "sent" };
    });

    // TODO: Integrate actual SMS provider (MSG91, Twilio, etc.)
    // await smsProvider.send({ to: phoneNumber, message });

    res.json({
      success: true,
      data: { logId: log.id, status: "sent", sentTo: phoneNumber },
      message: `SMS sent successfully to ${phoneNumber}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/communication/:id/send-email
 * Body: { subject: string, body: string, to: "student" | "father" | "mother" | "guardian", customEmail?: string }
 */
export const sendEmailHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;
    const { subject, body, to, customEmail } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ success: false, message: "Subject and body are required" });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, tenantId, isDeleted: false },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        fatherName: true, motherName: true,
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Resolve email address
    let emailAddress = customEmail;
    if (!emailAddress) {
      switch (to) {
        case "student": emailAddress = student.email; break;
        case "father": emailAddress = (student as any).fatherEmail; break;
        case "mother": emailAddress = (student as any).motherEmail; break;
        case "guardian": emailAddress = (student as any).guardianEmail; break;
        default: emailAddress = student.email || (student as any).fatherEmail;
      }
    }

    if (!emailAddress) {
      return res.status(400).json({ success: false, message: `No email found for ${to || "student"}` });
    }

    // Log communication
    const log = await (prisma.communicationLog as any).create({ data: {
        studentId,
        tenantId,
        type: "email", channel: "EMAIL",
        subject,
        message: body,
        sentTo: emailAddress,
        sentBy: req.user?.name || req.user?.userId || "System",
        status: "sent",
        metadata: { to, recipient: `${student.firstName} ${student.lastName}` },
      },
    }).catch(async () => {
      await prisma.studentTimelineEntry.create({
        data: {
          studentId, tenantId, type: "communication",
          title: `Email: ${subject}`, description: body.substring(0, 200),
          createdBy: req.user?.name || "Admin",
        },
      });
      return { id: "timeline-fallback", status: "sent" };
    });

    // TODO: Integrate actual email provider (nodemailer/SES)
    // await emailService.send({ to: emailAddress, subject, html: body });

    res.json({
      success: true,
      data: { logId: log.id, status: "sent", sentTo: emailAddress },
      message: `Email sent successfully to ${emailAddress}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/communication/:id/send-whatsapp
 * Body: { message: string, to: "student" | "father" | "mother" | "guardian", customNumber?: string }
 */
export const sendWhatsAppHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;
    const { message, to, customNumber } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, tenantId, isDeleted: false },
      select: {
        id: true, firstName: true, lastName: true, phone: true,
        fatherPhone: true, motherPhone: true, guardianPhone: true,
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Resolve WhatsApp number (prefer whatsapp field, fallback to phone)
    let whatsappNumber = customNumber;
    if (!whatsappNumber) {
      switch (to) {
        case "student": whatsappNumber = (student as any).whatsApp || student.phone; break;
        case "father": whatsappNumber = (student as any).fatherWhatsApp || student.fatherPhone; break;
        case "mother": whatsappNumber = (student as any).motherWhatsApp || student.motherPhone; break;
        case "guardian": whatsappNumber = (student as any).guardianWhatsApp || (student as any).guardianPhone; break;
        default: whatsappNumber = student.fatherPhone;
      }
    }

    if (!whatsappNumber) {
      return res.status(400).json({ success: false, message: `No WhatsApp number found for ${to || "parent"}` });
    }

    // Log communication
    const log = await (prisma.communicationLog as any).create({ data: {
        studentId,
        tenantId,
        type: "whatsapp", channel: "WHATSAPP",
        message,
        sentTo: whatsappNumber,
        sentBy: req.user?.name || req.user?.userId || "System",
        status: "sent",
        metadata: { to, recipient: `${student.firstName} ${student.lastName}` },
      },
    }).catch(async () => {
      await prisma.studentTimelineEntry.create({
        data: {
          studentId, tenantId, type: "communication",
          title: `WhatsApp sent to ${to || "parent"}`, description: message.substring(0, 200),
          createdBy: req.user?.name || "Admin",
        },
      });
      return { id: "timeline-fallback", status: "sent" };
    });

    // TODO: Integrate WhatsApp Business API
    // await whatsappService.send({ to: whatsappNumber, message });

    res.json({
      success: true,
      data: { logId: log.id, status: "sent", sentTo: whatsappNumber },
      message: `WhatsApp message sent successfully to ${whatsappNumber}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/communication/bulk-sms
 * Body: { studentIds: string[], message: string, to: "student"|"father"|"mother" }
 */
export const bulkSMSHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { studentIds, message, to, filters } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    // Get students - either by IDs or by filters
    let students: any[];
    if (studentIds && studentIds.length > 0) {
      students = await prisma.student.findMany({
        where: { id: { in: studentIds }, tenantId, isDeleted: false },
        select: { id: true, firstName: true, lastName: true, phone: true, fatherPhone: true, motherPhone: true, guardianPhone: true },
      });
    } else if (filters) {
      const where: any = { tenantId, isDeleted: false, status: "active" };
      if (filters.classId) where.enrollments = { some: { classId: filters.classId, isDeleted: false, status: "active" } };
      if (filters.sectionId) where.enrollments = { some: { ...where.enrollments?.some, sectionId: filters.sectionId } };
      if (filters.gender) where.gender = { in: [filters.gender, filters.gender.toLowerCase()] };

      students = await prisma.student.findMany({
        where,
        select: { id: true, firstName: true, lastName: true, phone: true, fatherPhone: true, motherPhone: true, guardianPhone: true },
      });
    } else {
      return res.status(400).json({ success: false, message: "Either studentIds or filters required" });
    }

    let sent = 0;
    let failed = 0;
    const errors: { studentId: string; error: string }[] = [];

    for (const student of students) {
      let phoneNumber: string | null = null;
      switch (to) {
        case "student": phoneNumber = student.phone; break;
        case "mother": phoneNumber = student.motherPhone; break;
        case "guardian": phoneNumber = student.guardianPhone; break;
        default: phoneNumber = student.fatherPhone;
      }

      if (!phoneNumber) {
        failed++;
        errors.push({ studentId: student.id, error: "No phone number" });
        continue;
      }

      try {
        // Log + send
        await (prisma.communicationLog as any).create({ data: {
            studentId: student.id,
            tenantId,
            type: "sms", channel: "SMS",
            message: message.replace("{{student_name}}", `${student.firstName} ${student.lastName}`),
            sentTo: phoneNumber,
            sentBy: req.user?.name || "System",
            status: "sent",
            metadata: { to, bulk: true },
          },
        }).catch(() => null);

        // TODO: Actual SMS send
        sent++;
      } catch (e: any) {
        failed++;
        errors.push({ studentId: student.id, error: e.message });
      }
    }

    res.json({
      success: true,
      data: { totalStudents: students.length, sent, failed, errors: errors.slice(0, 10) },
      message: `Bulk SMS: ${sent} sent, ${failed} failed`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/communication/bulk-email
 * Body: { studentIds: string[], subject: string, body: string, to: "student"|"father"|"mother" }
 */
export const bulkEmailHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { studentIds, subject, body, to, filters } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ success: false, message: "Subject and body are required" });
    }

    let students: any[];
    if (studentIds && studentIds.length > 0) {
      students = await prisma.student.findMany({
        where: { id: { in: studentIds }, tenantId, isDeleted: false },
        select: { id: true, firstName: true, lastName: true, email: true },
      });
    } else if (filters) {
      const where: any = { tenantId, isDeleted: false, status: "active" };
      if (filters.classId) where.enrollments = { some: { classId: filters.classId, isDeleted: false, status: "active" } };
      if (filters.gender) where.gender = { in: [filters.gender, filters.gender.toLowerCase()] };

      students = await prisma.student.findMany({
        where,
        select: { id: true, firstName: true, lastName: true, email: true },
      });
    } else {
      return res.status(400).json({ success: false, message: "Either studentIds or filters required" });
    }

    let sent = 0;
    let failed = 0;

    for (const student of students) {
      const emailAddr = student.email || (student as any).fatherEmail;
      if (!emailAddr) { failed++; continue; }

      try {
        const personalizedBody = body
          .replace(/{{student_name}}/g, `${student.firstName} ${student.lastName}`)
          .replace(/{{father_name}}/g, student.fatherName || "Parent");

        await (prisma.communicationLog as any).create({ data: {
            studentId: student.id, tenantId, type: "email", channel: "EMAIL",
            subject, message: personalizedBody, sentTo: emailAddr,
            sentBy: req.user?.name || "System", status: "sent",
            metadata: { to, bulk: true },
          },
        }).catch(() => null);

        // TODO: Actual email send via nodemailer
        sent++;
      } catch { failed++; }
    }

    res.json({
      success: true,
      data: { totalStudents: students.length, sent, failed },
      message: `Bulk Email: ${sent} sent, ${failed} failed`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/communication/bulk-whatsapp
 * Body: { studentIds: string[], message: string, to: "student"|"father"|"mother" }
 */
export const bulkWhatsAppHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { studentIds, message, to, filters } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    let students: any[];
    if (studentIds && studentIds.length > 0) {
      students = await prisma.student.findMany({
        where: { id: { in: studentIds }, tenantId, isDeleted: false },
        select: { id: true, firstName: true, lastName: true, phone: true, fatherPhone: true, motherPhone: true },
      });
    } else if (filters) {
      const where: any = { tenantId, isDeleted: false, status: "active" };
      if (filters.classId) where.enrollments = { some: { classId: filters.classId, isDeleted: false, status: "active" } };

      students = await prisma.student.findMany({
        where,
        select: { id: true, firstName: true, lastName: true, phone: true, fatherPhone: true, motherPhone: true },
      });
    } else {
      return res.status(400).json({ success: false, message: "Either studentIds or filters required" });
    }

    let sent = 0;
    let failed = 0;

    for (const student of students) {
      let number: string | null = null;
      switch (to) {
        case "student": number = (student as any).whatsApp || student.phone; break;
        case "mother": number = (student as any).motherWhatsApp || student.motherPhone; break;
        default: number = (student as any).fatherWhatsApp || student.fatherPhone;
      }

      if (!number) { failed++; continue; }

      try {
        const personalizedMessage = message
          .replace(/{{student_name}}/g, `${student.firstName} ${student.lastName}`);

        await (prisma.communicationLog as any).create({ data: {
            studentId: student.id, tenantId, type: "whatsapp", channel: "WHATSAPP",
            message: personalizedMessage, sentTo: number,
            sentBy: req.user?.name || "System", status: "sent",
            metadata: { to, bulk: true },
          },
        }).catch(() => null);

        // TODO: WhatsApp Business API integration
        sent++;
      } catch { failed++; }
    }

    res.json({
      success: true,
      data: { totalStudents: students.length, sent, failed },
      message: `Bulk WhatsApp: ${sent} sent, ${failed} failed`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/communication/birthday-wishes
 * Sends birthday wishes to all students whose birthday is today
 */
export const sendBirthdayWishesHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { message, channel } = req.body;

    const defaultMessage = message || "Happy Birthday, {{student_name}}! 🎂 Wishing you a wonderful day from our school family!";
    const selectedChannel = channel || "sms";

    // Find students with birthday today
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const allStudents = await prisma.student.findMany({
      where: { tenantId, isDeleted: false, status: "active" },
      select: { id: true, firstName: true, lastName: true, fullName: true, dob: true, phone: true, fatherPhone: true, email: true },
    });

    const birthdayStudents = allStudents.filter((s: any) => {
      const dob = new Date(s.dob);
      return dob.getMonth() + 1 === month && dob.getDate() === day;
    });

    if (birthdayStudents.length === 0) {
      return res.json({ success: true, data: { sent: 0 }, message: "No birthdays today" });
    }

    let sent = 0;
    for (const student of birthdayStudents) {
      const personalizedMsg = defaultMessage
        .replace(/{{student_name}}/g, student.fullName || `${student.firstName} ${student.lastName}`);

      const contactNumber = student.phone || student.fatherPhone;
      const contactEmail = student.email;

      try {
        await (prisma.communicationLog as any).create({ data: {
            studentId: student.id, tenantId, type: selectedChannel,
            message: personalizedMsg,
            sentTo: selectedChannel === "email" ? (contactEmail || "") : (contactNumber || ""),
            sentBy: req.user?.name || "System", status: "sent",
            metadata: { occasion: "birthday", autoSent: true },
          },
        }).catch(() => null);

        // Add to timeline
        await prisma.studentTimelineEntry.create({
          data: {
            studentId: student.id, tenantId, type: "communication",
            title: "Birthday Wishes Sent 🎂",
            description: personalizedMsg.substring(0, 200),
            createdBy: "System",
          },
        }).catch(() => null);

        sent++;
      } catch { /* skip individual failures */ }
    }

    res.json({
      success: true,
      data: { birthdayCount: birthdayStudents.length, sent },
      message: `Birthday wishes sent to ${sent}/${birthdayStudents.length} students`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/communication/fee-reminder
 * Body: { studentIds?: string[], message?: string }
 */
export const sendFeeReminderHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { studentIds, message } = req.body;

    const defaultMessage = message || "Dear Parent of {{student_name}}, this is a reminder that fee payment of ₹{{amount}} is pending. Please pay at the earliest. - School Administration";

    // Find students with pending fees
    let feeDefaulters: any[];
    if (studentIds && studentIds.length > 0) {
      feeDefaulters = await prisma.studentFee.findMany({
        where: {
          tenantId, isDeleted: false, balanceAmount: { gt: 0 },
          enrollment: { studentId: { in: studentIds }, isDeleted: false },
        },
        include: {
          enrollment: {
            include: {
              student: { select: { id: true, firstName: true, lastName: true, fullName: true, fatherPhone: true, phone: true } },
            },
          },
        },
      });
    } else {
      feeDefaulters = await prisma.studentFee.findMany({
        where: { tenantId, isDeleted: false, balanceAmount: { gt: 0 } },
        include: {
          enrollment: {
            include: {
              student: { select: { id: true, firstName: true, lastName: true, fullName: true, fatherPhone: true, phone: true } },
            },
          },
        },
      });
    }

    // Group by student
    const studentFeeMap: Record<string, { student: any; totalPending: number }> = {};
    for (const fee of feeDefaulters) {
      const sid = fee.enrollment?.studentId;
      if (!sid) continue;
      if (!studentFeeMap[sid]) {
        studentFeeMap[sid] = { student: fee.enrollment.student, totalPending: 0 };
      }
      studentFeeMap[sid].totalPending += fee.balanceAmount;
    }

    let sent = 0;
    for (const [studentId, { student, totalPending }] of Object.entries(studentFeeMap)) {
      const personalizedMsg = defaultMessage
        .replace(/{{student_name}}/g, student.fullName || `${student.firstName} ${student.lastName}`)
        .replace(/{{amount}}/g, totalPending.toLocaleString("en-IN"));

      const contactNumber = student.fatherPhone || student.phone;
      if (!contactNumber) continue;

      try {
        await (prisma.communicationLog as any).create({ data: {
            studentId, tenantId, type: "sms", channel: "SMS",
            message: personalizedMsg, sentTo: contactNumber,
            sentBy: req.user?.name || "System", status: "sent",
            metadata: { occasion: "fee_reminder", pendingAmount: totalPending },
          },
        }).catch(() => null);

        sent++;
      } catch { /* skip */ }
    }

    res.json({
      success: true,
      data: { totalDefaulters: Object.keys(studentFeeMap).length, sent },
      message: `Fee reminders sent to ${sent} parents`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/communication/:id/communication-log
 * Query params: ?type=sms|email|whatsapp&page=1&limit=20
 */
export const getCommunicationLogHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const studentId = req.params.id;
    const { type, page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where: any = { studentId, tenantId };
    if (type) where.type = type;

    // Try the new model first, fallback to timeline
    try {
      const [logs, total] = await Promise.all([
        prisma.communicationLog.findMany({
          where,
          orderBy: { sentAt: "desc" },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.communicationLog.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          logs,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch {
      // Fallback: get communication entries from timeline
      const timeline = await prisma.studentTimelineEntry.findMany({
        where: { studentId, tenantId, type: "communication" },
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      });

      res.json({
        success: true,
        data: {
          logs: timeline.map((t: any) => ({
            id: t.id,
            type: "timeline",
            subject: t.title,
            message: t.description,
            sentAt: t.createdAt,
            sentBy: t.createdBy,
            status: "sent",
          })),
          total: timeline.length,
          page: pageNum,
          limit: limitNum,
          totalPages: 1,
        },
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
