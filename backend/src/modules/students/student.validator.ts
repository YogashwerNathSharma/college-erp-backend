
import { z } from "zod";

// CREATE STUDENT
export const createStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
  gender: z.enum(["Male", "Female", "Other"]),
  dob: z.string().min(1, "Date of birth is required"),
  bloodGroup: z.string().optional(),
  religion: z.string().optional(),
  caste: z.string().optional(),
  category: z.enum(["General", "OBC", "SC", "ST", "EWS"]).optional(),
  nationality: z.string().default("Indian"),
  aadharNo: z.string().length(12, "Aadhar must be 12 digits").optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  admissionNo: z.string().optional(),
  srNo: z.string().optional(),
  rollNumber: z.string().optional(),
  admissionDate: z.string().optional(),
  fatherName: z.string().min(1, "Father name is required").trim(),
  motherName: z.string().min(1, "Mother name is required").trim(),
  fatherPhone: z.string().min(10, "Father phone must be at least 10 digits"),
  motherPhone: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherOccupation: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianRelation: z.string().optional(),
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().min(1, "Section is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
  isCustomAdmissionNo: z.boolean().default(false),
  skipAgeValidation: z.boolean().default(false),
});

// BULK OLD STUDENT ENTRY
export const bulkOldStudentSchema = z.object({
  students: z.array(
    z.object({
      firstName: z.string().min(1).trim(),
      lastName: z.string().min(1).trim(),
      gender: z.enum(["Male", "Female", "Other"]),
      dob: z.string().min(1),
      address: z.string().min(1),
      admissionNo: z.string().min(1),
      srNo: z.string().optional(),
      fatherName: z.string().min(1).trim(),
      motherName: z.string().min(1).trim(),
      fatherPhone: z.string().min(10),
      motherPhone: z.string().optional(),
      classId: z.string().min(1),
      sectionId: z.string().min(1),
      rollNumber: z.string().optional(),
    })
  ).min(1, "At least one student is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
});

// UPDATE STUDENT
export const updateStudentSchema = z.object({
  firstName: z.string().min(1).trim().optional(),
  lastName: z.string().min(1).trim().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  dob: z.string().optional(),
  bloodGroup: z.string().optional(),
  religion: z.string().optional(),
  caste: z.string().optional(),
  category: z.enum(["General", "OBC", "SC", "ST", "EWS"]).optional(),
  nationality: z.string().optional(),
  aadharNo: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  rollNumber: z.string().optional(),
  fatherName: z.string().min(1).trim().optional(),
  motherName: z.string().min(1).trim().optional(),
  fatherPhone: z.string().min(10).optional(),
  motherPhone: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherOccupation: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianRelation: z.string().optional(),
  photoUrl: z.string().optional(),
  status: z.enum(["active", "inactive", "left", "tc_issued"]).optional(),
});

// PROMOTE STUDENT
export const promoteStudentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  fromClassId: z.string().min(1, "From class is required"),
  fromSectionId: z.string().min(1, "From section is required"),
  fromAcademicYearId: z.string().min(1, "From academic year is required"),
  toClassId: z.string().min(1, "To class is required"),
  toSectionId: z.string().min(1, "To section is required"),
  toAcademicYearId: z.string().min(1, "To academic year is required"),
  type: z.enum(["promotion", "jump", "detention"]),
  remarks: z.string().optional(),
});

// BULK PROMOTE
export const bulkPromoteSchema = z.object({
  studentIds: z.array(z.string()).min(1, "Select at least one student"),
  fromClassId: z.string().min(1),
  fromSectionId: z.string().min(1),
  fromAcademicYearId: z.string().min(1),
  toClassId: z.string().min(1),
  toSectionId: z.string().min(1),
  toAcademicYearId: z.string().min(1),
  type: z.enum(["promotion", "jump"]),
});

// CHANGE SECTION
export const changeSectionSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
  newSectionId: z.string().min(1, "New section is required"),
});

// SEED AGE CONFIG
export const seedAgeConfigSchema = z.object({
  board: z.enum(["UP_BOARD", "CBSE", "ICSE"]),
  classMapping: z.array(
    z.object({
      className: z.string().min(1),
      classId: z.string().min(1),
    })
  ).min(1),
});

// UPDATE AGE CONFIG
export const updateAgeConfigSchema = z.object({
  minAge: z.number().min(0).optional(),
  maxAge: z.number().min(0).optional(),
  ageCalcRefMonth: z.number().min(1).max(12).optional(),
  ageCalcRefDay: z.number().min(1).max(31).optional(),
});
