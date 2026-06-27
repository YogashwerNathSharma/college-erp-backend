
import { z } from "zod";

// ============================================
// TRACKING VALIDATORS - Zod Schemas
// ============================================

// ─────────────────────────────────────────────
// LOCATION
// ─────────────────────────────────────────────

export const updateLocationSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  latitude: z.number().min(-90).max(90, "Invalid latitude"),
  longitude: z.number().min(-180).max(180, "Invalid longitude"),
  speed: z.number().min(0, "Speed cannot be negative").default(0),
  heading: z.number().min(0).max(360).optional(),
  accuracy: z.number().min(0).optional(),
  altitude: z.number().optional(),
  timestamp: z.string().datetime().optional(),
});

export const vehicleLocationParamsSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
});

export const vehicleHistoryQuerySchema = z.object({
  startDate: z.string().datetime("Invalid start date format"),
  endDate: z.string().datetime("Invalid end date format"),
  limit: z.coerce.number().min(1).max(1000).optional().default(100),
  page: z.coerce.number().min(1).optional().default(1),
});

// ─────────────────────────────────────────────
// ROUTE LIVE
// ─────────────────────────────────────────────

export const routeLiveParamsSchema = z.object({
  routeId: z.string().min(1, "Route ID is required"),
});

// ─────────────────────────────────────────────
// TRIPS
// ─────────────────────────────────────────────

export const startTripSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  routeId: z.string().min(1, "Route ID is required"),
  driverName: z.string().min(1, "Driver name is required"),
  startLatitude: z.number().min(-90).max(90, "Invalid latitude"),
  startLongitude: z.number().min(-180).max(180, "Invalid longitude"),
  tripType: z.enum(["PICKUP", "DROP"]).optional().default("PICKUP"),
});

export const endTripParamsSchema = z.object({
  tripId: z.string().min(1, "Trip ID is required"),
});

export const endTripSchema = z.object({
  endLatitude: z.number().min(-90).max(90, "Invalid latitude"),
  endLongitude: z.number().min(-180).max(180, "Invalid longitude"),
  totalDistance: z.number().min(0, "Distance cannot be negative"),
  notes: z.string().optional(),
});

export const listTripsQuerySchema = z.object({
  vehicleId: z.string().optional(),
  routeId: z.string().optional(),
  driverName: z.string().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

// ─────────────────────────────────────────────
// GEOFENCE ALERTS
// ─────────────────────────────────────────────

export const createGeofenceAlertSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  alertType: z.enum([
    "GEOFENCE_ENTRY",
    "GEOFENCE_EXIT",
    "SPEED_VIOLATION",
    "ROUTE_DEVIATION",
    "SOS",
    "BREAKDOWN",
    "FUEL_LOW",
  ]),
  latitude: z.number().min(-90).max(90, "Invalid latitude"),
  longitude: z.number().min(-180).max(180, "Invalid longitude"),
  geofenceName: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  metadata: z.record(z.any()).optional(),
});

export const listAlertsQuerySchema = z.object({
  vehicleId: z.string().optional(),
  alertType: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["ACTIVE", "RESOLVED", "DISMISSED"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const resolveAlertParamsSchema = z.object({
  id: z.string().min(1, "Alert ID is required"),
});

export const resolveAlertSchema = z.object({
  resolvedBy: z.string().min(1, "Resolver identity is required"),
  resolution: z.string().optional(),
});

// ─────────────────────────────────────────────
// PICKUP / DROP
// ─────────────────────────────────────────────

export const recordPickupDropSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  studentName: z.string().min(1, "Student name is required"),
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  tripId: z.string().optional(),
  stopId: z.string().optional(),
  type: z.enum(["PICKUP", "DROP"]),
  latitude: z.number().min(-90).max(90, "Invalid latitude"),
  longitude: z.number().min(-180).max(180, "Invalid longitude"),
  parentPhone: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

// ─────────────────────────────────────────────
// STUDENT STATUS
// ─────────────────────────────────────────────

export const studentStatusParamsSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
});

// ─────────────────────────────────────────────
// TYPE EXPORTS
// ─────────────────────────────────────────────

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type StartTripInput = z.infer<typeof startTripSchema>;
export type EndTripInput = z.infer<typeof endTripSchema>;
export type CreateGeofenceAlertInput = z.infer<typeof createGeofenceAlertSchema>;
export type RecordPickupDropInput = z.infer<typeof recordPickupDropSchema>;
export type ListTripsQuery = z.infer<typeof listTripsQuerySchema>;
export type ListAlertsQuery = z.infer<typeof listAlertsQuerySchema>;
