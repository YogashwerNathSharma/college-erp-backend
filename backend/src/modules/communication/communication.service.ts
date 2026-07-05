import prisma from "../../config/prisma";
import { sendSms } from "./helpers/sms.helper";
import { sendWhatsApp } from "./helpers/whatsapp.helper";
import { sendEmail } from "./helpers/email.helper";

// ============================================
// NOTICE CRUD
// ============================================

export const createNotice = async (data: any, tenantId: string, createdBy: string) => {
  return prisma.notice.create({
    data: {
      title: data.title,
      content: data.content,
      type: data.type || "GENERAL",
      audience: data.audience || "ALL",
      targetAudience: data.targetAudience || data.audience || null,
      attachmentUrl: data.attachmentUrl || null,
      isPinned: data.isPinned === "true" || data.isPinned === true,
      tenantId,
      publishedBy: createdBy,
      createdBy,
      publishDate: data.publishDate ? new Date(data.publishDate) : new Date(),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
    },
  });
};

export const getAllNotices = async (tenantId: string, filters?: {
  type?: string;
  targetAudience?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { tenantId, isDeleted: false };
  if (filters?.type) where.type = filters.type;
  if (filters?.targetAudience) where.targetAudience = filters.targetAudience;
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { content: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [notices, total] = await Promise.all([
    prisma.notice.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { publishDate: "desc" }],
      skip,
      take: limit,
    }),
    prisma.notice.count({ where }),
  ]);

  return { notices, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getNoticeById = async (id: string, tenantId: string) => {
  return prisma.notice.findFirst({
    where: { id, tenantId, isDeleted: false },
  });
};

export const updateNotice = async (id: string, data: any, tenantId: string) => {
  return prisma.notice.update({
    where: { id, tenantId },
    data,
  });
};

export const deleteNotice = async (id: string, tenantId: string) => {
  return prisma.notice.update({
    where: { id, tenantId },
    data: { isDeleted: true },
  });
};

// ============================================
// SMS SERVICE
// ============================================

export const sendBulkSms = async (data: any, tenantId: string) => {
  const { recipients, message, templateId } = data;
  const results = [];

  for (const recipient of recipients) {
    try {
      const result = await sendSms(recipient.phone, message, templateId);
      results.push({ phone: recipient.phone, status: "sent", ...result });
    } catch (err: any) {
      results.push({ phone: recipient.phone, status: "failed", error: err.message });
    }
  }

  // Log communication
  await prisma.communicationLog.create({
    data: {
      tenantId,
      channel: "SMS",
      recipientCount: recipients.length,
      successCount: results.filter((r) => r.status === "sent").length,
      failedCount: results.filter((r) => r.status === "failed").length,
      message,
    },
  });

  return results;
};

// ============================================
// WHATSAPP SERVICE
// ============================================

export const sendBulkWhatsApp = async (data: any, tenantId: string) => {
  const { recipients, message, templateName, mediaUrl } = data;
  const results = [];

  for (const recipient of recipients) {
    try {
      const result = await sendWhatsApp(recipient.phone, message, templateName, mediaUrl);
      results.push({ phone: recipient.phone, status: "sent", ...result });
    } catch (err: any) {
      results.push({ phone: recipient.phone, status: "failed", error: err.message });
    }
  }

  await prisma.communicationLog.create({
    data: {
      tenantId,
      channel: "WHATSAPP",
      recipientCount: recipients.length,
      successCount: results.filter((r) => r.status === "sent").length,
      failedCount: results.filter((r) => r.status === "failed").length,
      message,
    },
  });

  return results;
};

// ============================================
// EMAIL SERVICE
// ============================================

export const sendBulkEmail = async (data: any, tenantId: string) => {
  const { recipients, subject, body, isHtml, attachments } = data;
  const results = [];

  for (const recipient of recipients) {
    try {
      const result = await sendEmail({
        to: recipient.email,
        subject,
        body,
        isHtml,
        attachments,
      });
      results.push({ email: recipient.email, status: "sent", ...result });
    } catch (err: any) {
      results.push({ email: recipient.email, status: "failed", error: err.message });
    }
  }

  await prisma.communicationLog.create({
    data: {
      tenantId,
      channel: "EMAIL",
      recipientCount: recipients.length,
      successCount: results.filter((r) => r.status === "sent").length,
      failedCount: results.filter((r) => r.status === "failed").length,
      message: subject,
    },
  });

  return results;
};

// ============================================
// COMMUNICATION LOGS
// ============================================

export const getCommunicationLogs = async (tenantId: string, filters?: {
  channel?: string;
  page?: number;
  limit?: number;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { tenantId };
  if (filters?.channel) where.channel = filters.channel;

  const [logs, total] = await Promise.all([
    prisma.communicationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.communicationLog.count({ where }),
  ]);

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
};
