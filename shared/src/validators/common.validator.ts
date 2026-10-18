import { z } from "zod";

//////////////////////////////////////////////////////
// 🌐 COMMON VALIDATORS
//////////////////////////////////////////////////////

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const idParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const dateRangeSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date"),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date"),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  "Start date must be before end date"
);

export const phoneSchema = z.string().regex(/^[6-9][0-9]{9}$/, "Invalid Indian phone number");

export const emailSchema = z.string().email("Invalid email address");

export const aadharSchema = z.string().regex(/^[0-9]{12}$/, "Aadhar must be 12 digits");

export const pincodeSchema = z.string().regex(/^[1-9][0-9]{5}$/, "Invalid pincode");

export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
