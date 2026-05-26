import { z } from "zod";

/////////////////////////
// COMMON FIELDS
/////////////////////////

const nameField = z.string().min(2, "Must be at least 2 characters").trim();

const phoneField = z
  .string()
  .regex(/^[0-9]{10}$/, "Phone must be 10 digits");

const genderEnum = z.enum(["MALE", "FEMALE", "OTHER"]);

/////////////////////////
// CREATE STUDENT
/////////////////////////

export const createStudentSchema = z.object({
  firstName: nameField,
  lastName: nameField,

  gender: genderEnum,

  dob: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),

  email: z.string().email(),
  phone: phoneField,
  address: z.string().min(5),

  admissionNo: z.string().min(3),
  rollNumber: z.string().optional(),

  fatherName: nameField,
  motherName: nameField,
  parentPhone: phoneField,

  academicYearId: z.string().min(1),
});

/////////////////////////
// UPDATE STUDENT
/////////////////////////

export const updateStudentSchema = createStudentSchema.partial();