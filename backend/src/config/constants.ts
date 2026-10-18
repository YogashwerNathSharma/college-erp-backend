/**
 * Application-wide constants
 */

// ============================================
// ROLES
// ============================================
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
  ACCOUNTANT: "ACCOUNTANT",
  LIBRARIAN: "LIBRARIAN",
  RECEPTIONIST: "RECEPTIONIST",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// ============================================
// STUDENT STATUS
// ============================================
export const STUDENT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  LEFT: "left",
  TC_ISSUED: "tc_issued",
  SUSPENDED: "suspended",
} as const;

// ============================================
// ATTENDANCE STATUS
// ============================================
export const ATTENDANCE_STATUS = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LATE: "LATE",
  HALF_DAY: "HALF_DAY",
  ON_LEAVE: "ON_LEAVE",
  HOLIDAY: "HOLIDAY",
} as const;

// ============================================
// FEE STATUS
// ============================================
export const FEE_STATUS = {
  PAID: "PAID",
  PARTIAL: "PARTIAL",
  PENDING: "PENDING",
  OVERDUE: "OVERDUE",
  WAIVED: "WAIVED",
} as const;

// ============================================
// LEAVE TYPES
// ============================================
export const LEAVE_TYPES = {
  CASUAL: "CASUAL",
  SICK: "SICK",
  EARNED: "EARNED",
  MATERNITY: "MATERNITY",
  PATERNITY: "PATERNITY",
  UNPAID: "UNPAID",
  COMPENSATORY: "COMPENSATORY",
} as const;

// ============================================
// LEAVE STATUS
// ============================================
export const LEAVE_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;

// ============================================
// PAYROLL STATUS
// ============================================
export const PAYROLL_STATUS = {
  GENERATED: "GENERATED",
  APPROVED: "APPROVED",
  PAID: "PAID",
  CANCELLED: "CANCELLED",
} as const;

// ============================================
// COMMUNICATION CHANNELS
// ============================================
export const COMMUNICATION_CHANNELS = {
  SMS: "SMS",
  WHATSAPP: "WHATSAPP",
  EMAIL: "EMAIL",
  PUSH: "PUSH",
  IN_APP: "IN_APP",
} as const;

// ============================================
// NOTICE TYPES
// ============================================
export const NOTICE_TYPES = {
  GENERAL: "GENERAL",
  ACADEMIC: "ACADEMIC",
  EVENT: "EVENT",
  EXAM: "EXAM",
  FEE: "FEE",
  HOLIDAY: "HOLIDAY",
  URGENT: "URGENT",
} as const;

// ============================================
// CERTIFICATE TYPES
// ============================================
export const CERTIFICATE_TYPES = {
  TRANSFER: "TRANSFER",
  CHARACTER: "CHARACTER",
  MIGRATION: "MIGRATION",
  BONAFIDE: "BONAFIDE",
  STUDY: "STUDY",
} as const;

// ============================================
// SUBSCRIPTION PLANS
// ============================================
export const SUBSCRIPTION_PLANS = {
  FREE: "FREE",
  STARTER: "STARTER",
  PROFESSIONAL: "PROFESSIONAL",
  ENTERPRISE: "ENTERPRISE",
} as const;

// ============================================
// LIMITS BY PLAN
// ============================================
export const PLAN_LIMITS: Record<string, Record<string, number>> = {
  FREE: {
    students: 50,
    teachers: 10,
    smsPerMonth: 100,
    storageGB: 1,
  },
  STARTER: {
    students: 500,
    teachers: 50,
    smsPerMonth: 1000,
    storageGB: 5,
  },
  PROFESSIONAL: {
    students: 2000,
    teachers: 200,
    smsPerMonth: 5000,
    storageGB: 20,
  },
  ENTERPRISE: {
    students: 99999,
    teachers: 99999,
    smsPerMonth: 99999,
    storageGB: 100,
  },
};

// ============================================
// PAGINATION DEFAULTS
// ============================================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 200,
} as const;

// ============================================
// FILE UPLOAD
// ============================================
export const FILE_UPLOAD = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  ALLOWED_DOC_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  MAX_PHOTO_SIZE_BYTES: 2 * 1024 * 1024, // 2MB
} as const;

// ============================================
// CACHE TTL (seconds)
// ============================================
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;

// ============================================
// DATE FORMATS
// ============================================
export const DATE_FORMATS = {
  DISPLAY: "DD/MM/YYYY",
  API: "YYYY-MM-DD",
  DATETIME: "YYYY-MM-DD HH:mm:ss",
  TIME: "HH:mm",
} as const;
