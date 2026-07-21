import { z } from "zod";

// ══════════════════════════════════════════════════════════════════
// STUDENT ENHANCED VALIDATORS (Zod Schemas)
// ══════════════════════════════════════════════════════════════════

// Phone validation (Indian 10-digit mobile)
const indianPhoneSchema = z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number (10 digits, starting with 6-9)");

// Aadhaar validation (12 digits)
const aadhaarSchema = z.string().regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits");

// ══════════════════════════════════════════════════════════════════
// ADMISSION SCHEMAS
// ══════════════════════════════════════════════════════════════════

/**
 * Quick Admission — minimal fields for fast entry
 */
export const quickAdmissionSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  gender: z.enum(["Male", "Female", "Other"], { message: "Gender must be Male, Female, or Other" }),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
  fatherName: z.string().min(2, "Father name must be at least 2 characters"),
  fatherPhone: indianPhoneSchema,
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().min(1, "Section is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
});

/**
 * Complete Admission — all fields for thorough admission
 */
export const completeAdmissionSchema = quickAdmissionSchema.extend({
  // Optional extended personal info
  middleName: z.string().max(50).optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable(),
  phone: indianPhoneSchema.optional().nullable(),
  whatsApp: indianPhoneSchema.optional().nullable(),
  address: z.string().min(5, "Address must be at least 5 characters"),
  aadharNo: aadhaarSchema.optional().nullable(),
  passportNo: z.string().max(20).optional().nullable(),

  // Demographics
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]).optional().nullable(),
  religion: z.string().max(30).optional().nullable(),
  caste: z.string().max(50).optional().nullable(),
  category: z.enum(["General", "OBC", "SC", "ST", "EWS"]).optional().nullable(),
  nationality: z.string().default("Indian"),
  motherTongue: z.string().max(30).optional().nullable(),
  identificationMarks: z.string().max(200).optional().nullable(),

  // IDs
  registrationNo: z.string().max(30).optional().nullable(),
  boardRegNo: z.string().max(30).optional().nullable(),
  penNumber: z.string().max(30).optional().nullable(),
  apaarId: z.string().max(30).optional().nullable(),

  // Mother info
  motherName: z.string().min(2, "Mother name required"),
  motherPhone: indianPhoneSchema.optional().nullable(),
  motherEmail: z.string().email().optional().nullable(),
  motherOccupation: z.string().max(50).optional().nullable(),
  motherQualification: z.string().max(50).optional().nullable(),

  // Father extended
  fatherEmail: z.string().email().optional().nullable(),
  fatherOccupation: z.string().max(50).optional().nullable(),
  fatherQualification: z.string().max(50).optional().nullable(),
  fatherAnnualIncome: z.number().min(0).optional().nullable(),
  fatherWhatsApp: indianPhoneSchema.optional().nullable(),
  fatherOfficeAddress: z.string().max(200).optional().nullable(),

  // Guardian
  guardianName: z.string().max(50).optional().nullable(),
  guardianPhone: indianPhoneSchema.optional().nullable(),
  guardianRelation: z.string().max(30).optional().nullable(),
  guardianOccupation: z.string().max(50).optional().nullable(),
  guardianEmail: z.string().email().optional().nullable(),

  // Academic
  houseId: z.string().optional().nullable(),
  shiftId: z.string().optional().nullable(),
  streamId: z.string().optional().nullable(),
  mediumId: z.string().optional().nullable(),
  subjectGroupId: z.string().optional().nullable(),
  rollNumber: z.string().max(10).optional().nullable(),

  // Previous school
  previousSchool: z.string().max(100).optional().nullable(),
  previousClass: z.string().max(20).optional().nullable(),
  previousResult: z.string().max(20).optional().nullable(),
  previousPercentage: z.number().min(0).max(100).optional().nullable(),
  tcNumber: z.string().max(30).optional().nullable(),
  tcDate: z.string().optional().nullable(),

  // Admission
  admissionDate: z.string().optional(),
  admissionType: z.enum(["quick", "complete", "bulk", "transfer"]).default("complete"),

  // Photo
  photoUrl: z.string().url().optional().nullable(),
});

// ══════════════════════════════════════════════════════════════════
// STATUS & OPERATIONS SCHEMAS
// ══════════════════════════════════════════════════════════════════

/**
 * Status Change
 */
export const statusChangeSchema = z.object({
  status: z.enum(["active", "inactive", "transferred", "passed", "dropped", "suspended", "alumni"], {
    message: "Invalid status value",
  }),
  reason: z.string().max(500).optional(),
});

/**
 * Transfer Student
 */
export const transferSchema = z.object({
  reason: z.string().min(3, "Transfer reason is required").max(500),
  destinationSchool: z.string().max(200).optional(),
  effectiveDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date").optional(),
  generateTC: z.boolean().default(false),
});

// ══════════════════════════════════════════════════════════════════
// SEARCH & FILTER SCHEMAS
// ══════════════════════════════════════════════════════════════════

/**
 * Advanced Search
 */
export const advancedSearchSchema = z.object({
  admissionNo: z.string().optional(),
  rollNo: z.string().optional(),
  name: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  mobile: z.string().optional(),
  aadhaar: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  academicYearId: z.string().optional(),
  houseId: z.string().optional(),
  category: z.string().optional(),
  religion: z.string().optional(),
  transport: z.union([z.boolean(), z.string()]).optional(),
  hostel: z.union([z.boolean(), z.string()]).optional(),
  status: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(200).default(50),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Saved Filter
 */
export const savedFilterSchema = z.object({
  name: z.string().min(2, "Filter name must be at least 2 characters").max(50),
  filters: z.record(z.any()),
  isDefault: z.boolean().default(false),
});

// ══════════════════════════════════════════════════════════════════
// COMMUNICATION SCHEMAS
// ══════════════════════════════════════════════════════════════════

/**
 * Single Communication
 */
export const communicationSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000),
  to: z.enum(["student", "father", "mother", "guardian"]).default("father"),
  customNumber: indianPhoneSchema.optional(),
  subject: z.string().max(200).optional(), // for email
});

/**
 * Bulk Communication
 */
export const bulkCommunicationSchema = z.object({
  studentIds: z.array(z.string()).optional(),
  filters: z.record(z.any()).optional(),
  message: z.string().min(1).max(2000),
  to: z.enum(["student", "father", "mother", "guardian"]).default("father"),
  subject: z.string().max(200).optional(),
}).refine(
  (data) => (data.studentIds && data.studentIds.length > 0) || (data.filters && Object.keys(data.filters).length > 0),
  { message: "Either studentIds or filters must be provided" }
);

// ══════════════════════════════════════════════════════════════════
// CERTIFICATE SCHEMAS
// ══════════════════════════════════════════════════════════════════

/**
 * Certificate Options
 */
export const certificateOptionsSchema = z.object({
  purpose: z.string().max(200).optional(),
  date: z.string().optional(),
  conductRating: z.enum(["Excellent", "Very Good", "Good", "Satisfactory", "Average"]).optional(),
  reason: z.string().max(500).optional(),
  destinationBoard: z.string().max(100).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

// ══════════════════════════════════════════════════════════════════
// EXCEL & BULK SCHEMAS
// ══════════════════════════════════════════════════════════════════

/**
 * Excel Import Config
 */
export const excelImportSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().min(1, "Section is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
});

/**
 * Bulk Operation
 */
export const bulkOperationSchema = z.object({
  studentIds: z.array(z.string()).min(1, "At least one student ID is required"),
  action: z.enum(["delete", "activate", "deactivate", "transfer", "promote", "generate-id", "send-sms", "send-email"]),
  params: z.record(z.any()).optional(),
});

// ══════════════════════════════════════════════════════════════════
// MEDICAL & SIBLING SCHEMAS
// ══════════════════════════════════════════════════════════════════

/**
 * Vaccination Record
 */
export const vaccinationSchema = z.object({
  vaccineName: z.string().min(2, "Vaccine name is required").max(100),
  doseNumber: z.number().int().min(1).max(10),
  dateGiven: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  nextDueDate: z.string().optional().nullable(),
  hospital: z.string().max(100).optional().nullable(),
  doctorName: z.string().max(50).optional().nullable(),
  batchNo: z.string().max(30).optional().nullable(),
  remarks: z.string().max(500).optional().nullable(),
  documentUrl: z.string().url().optional().nullable(),
});

/**
 * Sibling Record
 */
export const siblingSchema = z.object({
  name: z.string().min(2, "Sibling name is required").max(50),
  relation: z.enum(["brother", "sister", "step-brother", "step-sister", "cousin"], {
    message: "Invalid relation type",
  }),
  siblingStudentId: z.string().optional().nullable(),
  class: z.string().max(20).optional().nullable(),
  school: z.string().max(100).optional().nullable(),
  dob: z.string().optional().nullable(),
});

// ══════════════════════════════════════════════════════════════════
// CUSTOM REPORT SCHEMA
// ══════════════════════════════════════════════════════════════════

export const customReportSchema = z.object({
  fields: z.array(z.string()).min(1, "At least one field is required"),
  filters: z.record(z.any()).optional(),
  groupBy: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ══════════════════════════════════════════════════════════════════
// HELPER: Validate request body against schema
// ══════════════════════════════════════════════════════════════════

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }
    req.validatedBody = result.data;
    next();
  };
}
