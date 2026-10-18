//////////////////////////////////////////////////////
// 🛡️ PERMISSIONS
//////////////////////////////////////////////////////

export const PERMISSIONS = {
  // Student Module
  STUDENT_VIEW: "student:view",
  STUDENT_CREATE: "student:create",
  STUDENT_EDIT: "student:edit",
  STUDENT_DELETE: "student:delete",
  STUDENT_EXPORT: "student:export",
  STUDENT_PROMOTE: "student:promote",

  // Teacher Module
  TEACHER_VIEW: "teacher:view",
  TEACHER_CREATE: "teacher:create",
  TEACHER_EDIT: "teacher:edit",
  TEACHER_DELETE: "teacher:delete",

  // Fee Module
  FEE_VIEW: "fee:view",
  FEE_COLLECT: "fee:collect",
  FEE_STRUCTURE: "fee:structure",
  FEE_DISCOUNT: "fee:discount",
  FEE_REPORTS: "fee:reports",
  FEE_REFUND: "fee:refund",

  // Exam Module
  EXAM_VIEW: "exam:view",
  EXAM_CREATE: "exam:create",
  EXAM_MARKS: "exam:marks",
  EXAM_PUBLISH: "exam:publish",
  EXAM_REPORTS: "exam:reports",

  // Attendance
  ATTENDANCE_VIEW: "attendance:view",
  ATTENDANCE_MARK: "attendance:mark",
  ATTENDANCE_REPORTS: "attendance:reports",

  // Communication
  NOTICE_VIEW: "notice:view",
  NOTICE_CREATE: "notice:create",
  SMS_SEND: "sms:send",
  WHATSAPP_SEND: "whatsapp:send",

  // HR
  HR_VIEW: "hr:view",
  HR_MANAGE: "hr:manage",
  PAYROLL_VIEW: "payroll:view",
  PAYROLL_MANAGE: "payroll:manage",

  // Hostel
  HOSTEL_VIEW: "hostel:view",
  HOSTEL_MANAGE: "hostel:manage",

  // Inventory
  INVENTORY_VIEW: "inventory:view",
  INVENTORY_MANAGE: "inventory:manage",

  // Certificates
  CERTIFICATE_VIEW: "certificate:view",
  CERTIFICATE_GENERATE: "certificate:generate",

  // Reports
  REPORTS_VIEW: "reports:view",
  REPORTS_EXPORT: "reports:export",

  // Settings
  SETTINGS_VIEW: "settings:view",
  SETTINGS_MANAGE: "settings:manage",

  // Transport
  TRANSPORT_VIEW: "transport:view",
  TRANSPORT_MANAGE: "transport:manage",

  // Library
  LIBRARY_VIEW: "library:view",
  LIBRARY_MANAGE: "library:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Default permissions for each role
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  TENANT_ADMIN: Object.values(PERMISSIONS),
  PRINCIPAL: [
    PERMISSIONS.STUDENT_VIEW, PERMISSIONS.STUDENT_EXPORT,
    PERMISSIONS.TEACHER_VIEW,
    PERMISSIONS.FEE_VIEW, PERMISSIONS.FEE_REPORTS,
    PERMISSIONS.EXAM_VIEW, PERMISSIONS.EXAM_REPORTS, PERMISSIONS.EXAM_PUBLISH,
    PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_REPORTS,
    PERMISSIONS.NOTICE_VIEW, PERMISSIONS.NOTICE_CREATE,
    PERMISSIONS.HR_VIEW, PERMISSIONS.PAYROLL_VIEW,
    PERMISSIONS.HOSTEL_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.CERTIFICATE_VIEW, PERMISSIONS.CERTIFICATE_GENERATE,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.TRANSPORT_VIEW, PERMISSIONS.LIBRARY_VIEW,
  ],
  TEACHER: [
    PERMISSIONS.STUDENT_VIEW,
    PERMISSIONS.EXAM_VIEW, PERMISSIONS.EXAM_MARKS,
    PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.NOTICE_VIEW,
    PERMISSIONS.LIBRARY_VIEW,
  ],
  STUDENT: [
    PERMISSIONS.NOTICE_VIEW,
  ],
};
