import { z } from "zod";

// CREATE HOSTEL
export const createHostelSchema = z.object({
  name: z.string().min(1, "Hostel name is required").trim(),
  type: z.enum(["BOYS", "GIRLS", "MIXED"]),
  address: z.string().optional(),
  wardenName: z.string().optional(),
  wardenPhone: z.string().optional(),
  capacity: z.number().int().positive("Capacity must be positive"),
  description: z.string().optional(),
});

export const updateHostelSchema = createHostelSchema.partial();

// CREATE ROOM
export const createRoomSchema = z.object({
  hostelId: z.string().min(1, "Hostel ID is required"),
  roomNumber: z.string().min(1, "Room number is required").trim(),
  floor: z.number().int().min(0).optional(),
  capacity: z.number().int().positive("Room capacity must be positive"),
  roomType: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY"]).default("DOUBLE"),
  amenities: z.array(z.string()).optional(),
  monthlyRent: z.number().min(0).optional(),
});

export const updateRoomSchema = createRoomSchema.partial();

// ALLOCATE ROOM
export const allocateRoomSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  roomId: z.string().min(1, "Room ID is required"),
  hostelId: z.string().min(1, "Hostel ID is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
  bedNumber: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

export const deallocateSchema = z.object({
  allocationId: z.string().min(1, "Allocation ID is required"),
  reason: z.string().optional(),
  endDate: z.string().optional(),
});

// MESS MANAGEMENT
export const createMessSchema = z.object({
  hostelId: z.string().min(1, "Hostel ID is required"),
  name: z.string().min(1, "Mess name is required").trim(),
  type: z.enum(["VEG", "NON_VEG", "BOTH"]).default("BOTH"),
  monthlyCharge: z.number().min(0, "Monthly charge must be non-negative"),
  capacity: z.number().int().positive().optional(),
});

export const updateMessSchema = createMessSchema.partial();

export const messMenuSchema = z.object({
  messId: z.string().min(1, "Mess ID is required"),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  breakfast: z.string().optional(),
  lunch: z.string().optional(),
  snacks: z.string().optional(),
  dinner: z.string().optional(),
});
