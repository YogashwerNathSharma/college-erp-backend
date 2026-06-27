import { z } from "zod";

//////////////////////////////////////////////////////
// 🎓 STUDENT VALIDATORS
//////////////////////////////////////////////////////

export const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Invalid pincode"),
  country: z.string().default("India"),
});

export const studentCreateSchema = z.object({
  admissionNo: z.string().min(1, "Admission number is required"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  middleName: z.string().max(50).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  religion: z.enum(["HINDU", "MUSLIM", "CHRISTIAN", "SIKH", "BUDDHIST", "JAIN", "OTHER"]).optional(),
  category: z.enum(["GENERAL", "OBC", "SC", "ST", "EWS", "OTHER"]).optional(),
  nationality: z.string().default("Indian"),
  motherTongue: z.string().optional(),
  aadharNo: z.string().regex(/^[0-9]{12}$/, "Aadhar must be 12 digits").optional(),
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().min(1, "Section is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
  admissionDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  fatherName: z.string().min(1, "Father name is required"),
  fatherPhone: z.string().regex(/^[6-9][0-9]{9}$/, "Invalid phone number"),
  fatherOccupation: z.string().optional(),
  fatherEmail: z.string().email().optional(),
  motherName: z.string().min(1, "Mother name is required"),
  motherPhone: z.string().regex(/^[6-9][0-9]{9}$/, "Invalid phone number").optional(),
  motherOccupation: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianRelation: z.string().optional(),
  currentAddress: addressSchema,
  permanentAddress: addressSchema.optional(),
  isSameAddress: z.boolean().default(false),
});

export const studentUpdateSchema = studentCreateSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE", "LEFT", "PASSED_OUT", "EXPELLED", "SUSPENDED"]).optional(),
  isActive: z.boolean().optional(),
});

export const studentFilterSchema = z.object({
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  academicYearId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "LEFT", "PASSED_OUT", "EXPELLED", "SUSPENDED"]).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  category: z.enum(["GENERAL", "OBC", "SC", "ST", "EWS", "OTHER"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
export type StudentFilterInput = z.infer<typeof studentFilterSchema>;
