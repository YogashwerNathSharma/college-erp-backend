// ══════════════════════════════════════════════════════════════════════════════
// STUDENT MODULE — TypeScript Type Definitions
// ══════════════════════════════════════════════════════════════════════════════

// ── Enums ────────────────────────────────────────────────────────────────────

export enum StudentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  TRANSFERRED = "transferred",
  PASSED = "passed",
  DROPPED = "dropped",
  SUSPENDED = "suspended",
  ALUMNI = "alumni",
  DELETED = "deleted",
}

export enum AdmissionType {
  QUICK = "quick",
  COMPLETE = "complete",
  BULK = "bulk",
  TRANSFER = "transfer",
  LATERAL = "lateral",
}

export enum AdmissionStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  VERIFIED = "verified",
  WAITLISTED = "waitlisted",
}

export enum CommunicationType {
  SMS = "sms",
  EMAIL = "email",
  WHATSAPP = "whatsapp",
  PUSH = "push",
  NOTICE = "notice",
  CALL = "call",
}

export enum CommunicationStatus {
  QUEUED = "queued",
  SENT = "sent",
  DELIVERED = "delivered",
  FAILED = "failed",
  READ = "read",
}

export enum DocumentCategory {
  BIRTH_CERT = "birth_cert",
  TRANSFER_CERT = "tc",
  MIGRATION = "migration",
  MARKSHEET = "marksheet",
  AADHAAR = "aadhaar",
  PAN = "pan",
  PASSPORT = "passport",
  INCOME = "income",
  CASTE = "caste",
  MEDICAL = "medical",
  PHOTO = "photo",
  OTHER = "other",
}

export enum VerificationStatus {
  PENDING = "pending",
  VERIFIED = "verified",
  REJECTED = "rejected",
  EXPIRED = "expired",
}

export enum CertificateType {
  BONAFIDE = "bonafide",
  CHARACTER = "character",
  LEAVING = "leaving",
  MIGRATION = "migration",
  STUDY = "study",
  INCOME = "income",
  CUSTOM = "custom",
}

// ── Input Types ──────────────────────────────────────────────────────────────

export interface StudentQuickAdmission {
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  fatherName: string;
  fatherPhone: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
}

export interface StudentCreateInput extends StudentQuickAdmission {
  middleName?: string;
  email?: string;
  phone?: string;
  whatsApp?: string;
  address?: string;
  admissionNo?: string;
  bloodGroup?: string;
  religion?: string;
  caste?: string;
  category?: string;
  nationality?: string;
  motherTongue?: string;
  identificationMarks?: string;
  aadharNo?: string;
  passportNo?: string;
  penNumber?: string;
  apaarId?: string;
  registrationNo?: string;
  boardRegNo?: string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
  motherOccupation?: string;
  motherQualification?: string;
  motherWhatsApp?: string;
  fatherEmail?: string;
  fatherOccupation?: string;
  fatherQualification?: string;
  fatherAnnualIncome?: number;
  fatherWhatsApp?: string;
  fatherOfficeAddress?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  guardianOccupation?: string;
  guardianEmail?: string;
  guardianWhatsApp?: string;
  rollNumber?: string;
  houseId?: string;
  shiftId?: string;
  streamId?: string;
  mediumId?: string;
  subjectGroupId?: string;
  previousSchool?: string;
  previousClass?: string;
  previousResult?: string;
  previousPercentage?: number;
  permanentAddress?: AddressJson;
  correspondenceAddress?: AddressJson;
  photoUrl?: string;
  admissionType?: AdmissionType;
}

export interface StudentUpdateInput {
  [key: string]: any;
}

export interface AddressJson {
  line1?: string;
  line2?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  village?: string;
  landmark?: string;
  lat?: number;
  lng?: number;
}

// ── Filter & Search Types ────────────────────────────────────────────────────

export interface StudentFilters {
  classId?: string;
  sectionId?: string;
  academicYearId?: string;
  status?: string;
  search?: string;
  gender?: string;
  page?: number;
  limit?: number;
}

export interface StudentAdvancedSearch {
  admissionNo?: string;
  rollNo?: string;
  name?: string;
  fatherName?: string;
  motherName?: string;
  mobile?: string;
  aadhaar?: string;
  classId?: string;
  sectionId?: string;
  academicYearId?: string;
  houseId?: string;
  category?: string;
  religion?: string;
  transport?: boolean;
  hostel?: boolean;
  status?: string;
  gender?: string;
  bloodGroup?: string;
  admissionDateFrom?: string;
  admissionDateTo?: string;
  dobFrom?: string;
  dobTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface SavedFilterInput {
  name: string;
  description?: string;
  filters: Record<string, any>;
  isDefault?: boolean;
  isShared?: boolean;
}

// ── Dashboard Types ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  newAdmissions: number;
  leavingStudents: number;
  boysCount: number;
  girlsCount: number;
  transportStudents: number;
  hostelStudents: number;
  scholarshipStudents: number;
  feeDefaulters: number;
  birthdayToday: number;
}

export interface DashboardFullData {
  stats: DashboardStats;
  classStrength: Array<{ class: string; classId: string; count: number }>;
  sectionStrength: Array<{ class: string; section: string; count: number }>;
  categoryDistribution: Array<{ category: string; count: number; percentage: number }>;
  genderRatio: { male: number; female: number; other: number };
  monthlyAdmission: Array<{ month: string; count: number }>;
  studentGrowth: Array<{ year: string; count: number }>;
  admissionTrend: Array<{ month: string; count: number }>;
  recentAdmissions: Array<{ id: string; name: string; admNo: string; class: string; date: string }>;
  birthdayStudents: Array<{ id: string; name: string; class: string; photoUrl?: string; dob: string }>;
  feeDefaultersList: Array<{ id: string; name: string; class: string; pendingAmount: number }>;
}

// ── Certificate Types ────────────────────────────────────────────────────────

export interface CertificateOptions {
  type: CertificateType;
  purpose?: string;
  issuedDate?: string;
  validUntil?: string;
  customFields?: Record<string, string>;
  templateId?: string;
  signatureId?: string;
  remarks?: string;
}

export interface CertificateResult {
  pdfBuffer: Buffer;
  certificateNo: string;
  metadata: {
    studentId: string;
    studentName: string;
    type: CertificateType;
    issuedDate: string;
    issuedBy: string;
  };
}

// ── PDF Types ────────────────────────────────────────────────────────────────

export interface PDFOptions {
  title?: string;
  orientation?: "portrait" | "landscape";
  includePhoto?: boolean;
  includeHeader?: boolean;
  includeFooter?: boolean;
  columns?: string[];
  filters?: Record<string, any>;
}

// ── Excel Types ──────────────────────────────────────────────────────────────

export interface ExcelExportOptions {
  columns?: string[];
  sheetName?: string;
  includeHeaders?: boolean;
  filters?: Record<string, any>;
  format?: "xlsx" | "csv";
}

export interface ExcelImportResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ row: number; field: string; message: string }>;
  createdStudents: Array<{ id: string; admissionNo: string; name: string }>;
}

// ── Communication Types ──────────────────────────────────────────────────────

export interface CommunicationInput {
  studentId?: string;
  studentIds?: string[];
  type: CommunicationType;
  subject?: string;
  message: string;
  to?: string;
  templateId?: string;
  variables?: Record<string, string>;
}

// ── Status Change Types ──────────────────────────────────────────────────────

export interface StatusChangeInput {
  status: StudentStatus;
  reason: string;
  effectiveDate?: string;
}

export interface TransferInput {
  reason: string;
  destinationSchool: string;
  effectiveDate: string;
  generateTC: boolean;
  remarks?: string;
}

// ── Bulk Operation Types ─────────────────────────────────────────────────────

export interface BulkOperationResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ id: string; message: string }>;
}

// ── Report Types ─────────────────────────────────────────────────────────────

export interface ReportFilters {
  academicYearId?: string;
  classId?: string;
  sectionId?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
  gender?: string;
  category?: string;
  format?: "json" | "pdf" | "excel";
}

export interface ReportResult {
  title: string;
  generatedAt: string;
  filters: Record<string, any>;
  data: any[];
  summary?: Record<string, number>;
}
