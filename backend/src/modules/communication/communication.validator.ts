import { z } from "zod";

// CREATE NOTICE
export const createNoticeSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["GENERAL", "ACADEMIC", "EVENT", "EXAM", "FEE", "HOLIDAY", "URGENT"]),
  targetAudience: z.enum(["ALL", "STUDENTS", "TEACHERS", "PARENTS", "STAFF"]).default("ALL"),
  classIds: z.array(z.string()).optional(),
  sectionIds: z.array(z.string()).optional(),
  publishDate: z.string().optional(),
  expiryDate: z.string().optional(),
  attachmentUrl: z.string().optional(),
  isPinned: z.boolean().default(false),
});

export const updateNoticeSchema = createNoticeSchema.partial();

// SEND SMS
export const sendSmsSchema = z.object({
  recipients: z.array(z.object({
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    name: z.string().optional(),
  })).min(1, "At least one recipient is required"),
  message: z.string().min(1, "Message is required").max(160, "SMS message must be under 160 characters"),
  templateId: z.string().optional(),
});

// SEND WHATSAPP
export const sendWhatsAppSchema = z.object({
  recipients: z.array(z.object({
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    name: z.string().optional(),
  })).min(1, "At least one recipient is required"),
  message: z.string().min(1, "Message is required"),
  templateName: z.string().optional(),
  mediaUrl: z.string().optional(),
});

// SEND EMAIL
export const sendEmailSchema = z.object({
  recipients: z.array(z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().optional(),
  })).min(1, "At least one recipient is required"),
  subject: z.string().min(1, "Subject is required").trim(),
  body: z.string().min(1, "Email body is required"),
  isHtml: z.boolean().default(false),
  attachments: z.array(z.object({
    filename: z.string(),
    path: z.string(),
  })).optional(),
});

// BULK COMMUNICATION
export const bulkCommunicationSchema = z.object({
  channel: z.enum(["SMS", "WHATSAPP", "EMAIL"]),
  targetGroup: z.enum(["ALL_STUDENTS", "ALL_PARENTS", "CLASS_WISE", "SECTION_WISE", "CUSTOM"]),
  classIds: z.array(z.string()).optional(),
  sectionIds: z.array(z.string()).optional(),
  studentIds: z.array(z.string()).optional(),
  message: z.string().min(1, "Message is required"),
  subject: z.string().optional(),
});
