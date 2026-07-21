// ══════════════════════════════════════════════════════════════════
// ENTERPRISE STUDENT MODULE — Constants
// ══════════════════════════════════════════════════════════════════

// ─── STATUS ──────────────────────────────────────────────────────

export const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  active: { label: "Active", color: "#22c55e", icon: "check-circle" },
  inactive: { label: "Inactive", color: "#6b7280", icon: "minus-circle" },
  transferred: { label: "Transferred", color: "#3b82f6", icon: "arrow-right-circle" },
  passed: { label: "Passed Out", color: "#8b5cf6", icon: "graduation-cap" },
  dropped: { label: "Dropped", color: "#ef4444", icon: "x-circle" },
  suspended: { label: "Suspended", color: "#f97316", icon: "alert-triangle" },
  alumni: { label: "Alumni", color: "#06b6d4", icon: "award" },
  deleted: { label: "Deleted", color: "#dc2626", icon: "trash" },
};

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  active: ["inactive", "transferred", "passed", "dropped", "suspended", "alumni"],
  inactive: ["active", "transferred", "dropped"],
  transferred: [], // final state
  passed: ["alumni"],
  dropped: ["active"],
  suspended: ["active", "inactive", "dropped"],
  alumni: [],
};

// ─── ADMISSION ───────────────────────────────────────────────────

export const ADMISSION_TYPES = [
  { value: "quick", label: "Quick Admission" },
  { value: "complete", label: "Complete Admission" },
  { value: "bulk", label: "Bulk Admission" },
  { value: "transfer", label: "Transfer Admission" },
] as const;

export const ADMISSION_STATUS_OPTIONS = [
  { value: "pending", label: "Pending Approval" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "verified", label: "Verified" },
] as const;

// ─── GENDER ──────────────────────────────────────────────────────

export const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
] as const;

export const GENDER_ALIASES: Record<string, string[]> = {
  Male: ["Male", "male", "M", "MALE", "m", "Boy", "boy"],
  Female: ["Female", "female", "F", "FEMALE", "f", "Girl", "girl"],
  Other: ["Other", "other", "O", "OTHER"],
};

// ─── BLOOD GROUPS ────────────────────────────────────────────────

export const BLOOD_GROUPS = [
  "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-",
] as const;

// ─── CATEGORIES ──────────────────────────────────────────────────

export const CATEGORY_OPTIONS = [
  { value: "General", label: "General" },
  { value: "OBC", label: "OBC (Other Backward Class)" },
  { value: "SC", label: "SC (Scheduled Caste)" },
  { value: "ST", label: "ST (Scheduled Tribe)" },
  { value: "EWS", label: "EWS (Economically Weaker Section)" },
  { value: "NT", label: "NT (Nomadic Tribe)" },
  { value: "VJ", label: "VJ (Vimukta Jati)" },
  { value: "SBC", label: "SBC (Special Backward Class)" },
] as const;

// ─── RELIGION ────────────────────────────────────────────────────

export const RELIGION_OPTIONS = [
  { value: "Hindu", label: "Hindu" },
  { value: "Muslim", label: "Muslim" },
  { value: "Christian", label: "Christian" },
  { value: "Sikh", label: "Sikh" },
  { value: "Buddhist", label: "Buddhist" },
  { value: "Jain", label: "Jain" },
  { value: "Parsi", label: "Parsi" },
  { value: "Jewish", label: "Jewish" },
  { value: "Other", label: "Other" },
] as const;

// ─── DOCUMENT TYPES ──────────────────────────────────────────────

export const DOCUMENT_TYPES = [
  { value: "birth_certificate", label: "Birth Certificate", required: true },
  { value: "transfer_certificate", label: "Transfer Certificate", required: false },
  { value: "migration_certificate", label: "Migration Certificate", required: false },
  { value: "marksheet", label: "Marksheet", required: false },
  { value: "aadhaar", label: "Aadhaar Card", required: false },
  { value: "pan", label: "PAN Card", required: false },
  { value: "passport", label: "Passport", required: false },
  { value: "income_certificate", label: "Income Certificate", required: false },
  { value: "caste_certificate", label: "Caste Certificate", required: false },
  { value: "medical_certificate", label: "Medical Certificate", required: false },
  { value: "photograph", label: "Photograph", required: true },
  { value: "other", label: "Other", required: false },
] as const;

// ─── CERTIFICATE TYPES ───────────────────────────────────────────

export const CERTIFICATE_TYPES = [
  { value: "bonafide", label: "Bonafide Certificate" },
  { value: "character", label: "Character Certificate" },
  { value: "leaving", label: "Leaving Certificate" },
  { value: "migration", label: "Migration Certificate" },
  { value: "study", label: "Study Certificate" },
  { value: "income", label: "Income Certificate" },
  { value: "custom", label: "Custom Certificate" },
] as const;

// ─── PAGINATION ──────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 500;
export const MAX_EXPORT_RECORDS = 10000;
export const MAX_BULK_OPERATION = 500;

// ─── SEARCH ──────────────────────────────────────────────────────

export const SEARCH_FIELDS = [
  "admissionNo",
  "rollNumber",
  "firstName",
  "lastName",
  "fullName",
  "fatherName",
  "motherName",
  "phone",
  "fatherPhone",
  "motherPhone",
  "email",
  "aadharNo",
  "srNo",
  "registrationNo",
  "boardRegNo",
  "penNumber",
  "apaarId",
] as const;

export const SORT_FIELDS = [
  "firstName",
  "lastName",
  "admissionNo",
  "rollNumber",
  "dob",
  "createdAt",
  "updatedAt",
  "admissionDate",
  "className",
  "sectionName",
  "fatherName",
  "status",
] as const;

// ─── EXCEL IMPORT/EXPORT COLUMNS ─────────────────────────────────

export const EXCEL_IMPORT_COLUMNS = [
  { key: "firstName", header: "First Name", required: true, type: "string" },
  { key: "middleName", header: "Middle Name", required: false, type: "string" },
  { key: "lastName", header: "Last Name", required: true, type: "string" },
  { key: "gender", header: "Gender", required: true, type: "string" },
  { key: "dob", header: "Date of Birth (DD/MM/YYYY)", required: true, type: "date" },
  { key: "fatherName", header: "Father Name", required: true, type: "string" },
  { key: "fatherPhone", header: "Father Phone", required: true, type: "string" },
  { key: "motherName", header: "Mother Name", required: false, type: "string" },
  { key: "motherPhone", header: "Mother Phone", required: false, type: "string" },
  { key: "email", header: "Email", required: false, type: "string" },
  { key: "phone", header: "Phone", required: false, type: "string" },
  { key: "address", header: "Address", required: true, type: "string" },
  { key: "aadharNo", header: "Aadhaar No", required: false, type: "string" },
  { key: "category", header: "Category", required: false, type: "string" },
  { key: "religion", header: "Religion", required: false, type: "string" },
  { key: "bloodGroup", header: "Blood Group", required: false, type: "string" },
  { key: "nationality", header: "Nationality", required: false, type: "string" },
  { key: "rollNumber", header: "Roll Number", required: false, type: "string" },
  { key: "previousSchool", header: "Previous School", required: false, type: "string" },
  { key: "previousClass", header: "Previous Class", required: false, type: "string" },
] as const;

export const EXCEL_EXPORT_COLUMNS = [
  { key: "admissionNo", header: "Admission No", width: 15 },
  { key: "srNo", header: "SR No", width: 12 },
  { key: "rollNumber", header: "Roll No", width: 10 },
  { key: "firstName", header: "First Name", width: 15 },
  { key: "middleName", header: "Middle Name", width: 15 },
  { key: "lastName", header: "Last Name", width: 15 },
  { key: "gender", header: "Gender", width: 8 },
  { key: "dob", header: "Date of Birth", width: 15 },
  { key: "className", header: "Class", width: 12 },
  { key: "sectionName", header: "Section", width: 10 },
  { key: "fatherName", header: "Father Name", width: 18 },
  { key: "fatherPhone", header: "Father Phone", width: 15 },
  { key: "motherName", header: "Mother Name", width: 18 },
  { key: "motherPhone", header: "Mother Phone", width: 15 },
  { key: "email", header: "Email", width: 25 },
  { key: "phone", header: "Phone", width: 15 },
  { key: "address", header: "Address", width: 30 },
  { key: "category", header: "Category", width: 12 },
  { key: "religion", header: "Religion", width: 12 },
  { key: "bloodGroup", header: "Blood Group", width: 12 },
  { key: "aadharNo", header: "Aadhaar No", width: 15 },
  { key: "status", header: "Status", width: 12 },
  { key: "admissionDate", header: "Admission Date", width: 15 },
] as const;

// ─── COMMUNICATION TEMPLATES ─────────────────────────────────────

export const SMS_TEMPLATES = {
  BIRTHDAY: "Dear {{student_name}}, Wishing you a very Happy Birthday! May this year bring you great success. - {{school_name}}",
  FEE_REMINDER: "Dear Parent, Fee of Rs.{{amount}} is pending for {{student_name}} ({{class}}). Please pay by {{due_date}}. - {{school_name}}",
  ATTENDANCE_ABSENT: "Dear Parent, {{student_name}} ({{class}}) was marked absent today ({{date}}). - {{school_name}}",
  GENERAL: "Dear {{recipient_name}}, {{message}} - {{school_name}}",
} as const;

export const EMAIL_TEMPLATES = {
  WELCOME: {
    subject: "Welcome to {{school_name}} - Admission Confirmed",
    body: "Dear {{parent_name}},\n\nWe are pleased to inform you that the admission of {{student_name}} has been confirmed.\n\nAdmission No: {{admission_no}}\nClass: {{class}}\nSection: {{section}}\n\nRegards,\n{{school_name}}",
  },
  FEE_REMINDER: {
    subject: "Fee Payment Reminder - {{school_name}}",
    body: "Dear {{parent_name}},\n\nThis is a reminder that a fee of Rs.{{amount}} is pending for {{student_name}} ({{class}} - {{section}}).\n\nPlease pay by {{due_date}} to avoid late fees.\n\nRegards,\n{{school_name}}",
  },
  BIRTHDAY: {
    subject: "Happy Birthday, {{student_name}}! 🎂",
    body: "Dear {{student_name}},\n\nWishing you a very Happy Birthday! May this year bring you joy, success, and wonderful memories.\n\nWith best wishes,\n{{school_name}} Family",
  },
} as const;

// ─── ID CARD DIMENSIONS ──────────────────────────────────────────

export const ID_CARD_DIMENSIONS = {
  width: 324, // 3.375 inches at 96 DPI (standard CR80)
  height: 204, // 2.125 inches at 96 DPI
  padding: 10,
  photoSize: 80,
  fontSize: {
    name: 14,
    detail: 10,
    label: 8,
    header: 12,
  },
} as const;

// ─── MONTHS ──────────────────────────────────────────────────────

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;
