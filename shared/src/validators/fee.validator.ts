import { z } from "zod";

//////////////////////////////////////////////////////
// 💰 FEE VALIDATORS
//////////////////////////////////////////////////////

export const feeHeadCreateSchema = z.object({
  name: z.string().min(1, "Fee head name is required").max(100),
  code: z.string().min(1, "Fee code is required").max(20),
  description: z.string().max(500).optional(),
  isOptional: z.boolean().default(false),
  isRefundable: z.boolean().default(false),
});

export const feeStructureCreateSchema = z.object({
  name: z.string().min(1, "Structure name is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
  classId: z.string().min(1, "Class is required"),
  frequency: z.enum(["ONE_TIME", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"]),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  items: z.array(z.object({
    feeHeadId: z.string().min(1),
    amount: z.number().min(0, "Amount must be positive"),
  })).min(1, "At least one fee item is required"),
});

export const feeCollectionSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  feeStructureId: z.string().min(1, "Fee structure is required"),
  paidAmount: z.number().min(1, "Amount must be at least 1"),
  paymentMode: z.enum(["CASH", "CHEQUE", "ONLINE", "UPI", "BANK_TRANSFER", "DD"]),
  discountId: z.string().optional(),
  remarks: z.string().max(500).optional(),
  items: z.array(z.object({
    feeHeadId: z.string().min(1),
    amount: z.number().min(0),
  })).min(1, "At least one payment item is required"),
});

export const feeDiscountCreateSchema = z.object({
  name: z.string().min(1, "Discount name is required"),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().min(0, "Value must be positive"),
  applicableTo: z.enum(["ALL", "CLASS", "CATEGORY", "INDIVIDUAL"]),
  criteria: z.string().optional(),
});

export type FeeHeadCreateInput = z.infer<typeof feeHeadCreateSchema>;
export type FeeStructureCreateInput = z.infer<typeof feeStructureCreateSchema>;
export type FeeCollectionInput = z.infer<typeof feeCollectionSchema>;
export type FeeDiscountCreateInput = z.infer<typeof feeDiscountCreateSchema>;
