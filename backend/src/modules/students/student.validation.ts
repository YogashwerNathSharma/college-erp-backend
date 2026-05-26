import { z } from "zod";

/////////////////////////
// COMMON FIELDS
/////////////////////////

const nameField = z
  .string()
  .min(2, "Must be at least 2 characters")
  .trim();

const phoneField = z
  .string()
  .regex(/^[6-9][0-9]{9}$/, "Invalid Indian phone number"); // 🔥 improved

const genderEnum = z.enum(["MALE", "FEMALE", "OTHER"]);

/////////////////////////
// DATE VALIDATION 🔥
/////////////////////////

const dobField = z.string().refine((val) => {
  const date = new Date(val);
  return !isNaN(date.getTime()) && date < new Date();
}, {
  message: "Invalid or future date not allowed",
});

/////////////////////////
// CREATE STUDENT
/////////////////////////

export const createStudentSchema = z.object({
  firstName: nameField,
  lastName: nameField,

  gender: genderEnum,

  dob: dobField,

  email: z.string().email().optional(), // 🔥 optional

  phone: phoneField,

  address: z.string().min(5),

  admissionNo: z.string().min(3),

  rollNumber: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)), // 🔥 fix empty string

  fatherName: nameField,
  motherName: nameField,

  parentPhone: phoneField,

  academicYearId: z.string().min(1),
});

/////////////////////////
// UPDATE STUDENT
/////////////////////////

export const updateStudentSchema = createStudentSchema.partial();