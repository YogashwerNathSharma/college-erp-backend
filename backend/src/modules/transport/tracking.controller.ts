
import { Response } from "express";
import trackingService from "./tracking.service";
import {
  updateLocationSchema,
  vehicleLocationParamsSchema,
  vehicleHistoryQuerySchema,
  routeLiveParamsSchema,
  startTripSchema,
  endTripParamsSchema,
  endTripSchema,
  listTripsQuerySchema,
  createGeofenceAlertSchema,
  listAlertsQuerySchema,
  resolveAlertParamsSchema,
  resolveAlertSchema,
  recordPickupDropSchema,
  studentStatusParamsSchema,
} from "./tracking.validator";

// ============================================
// TRACKING CONTROLLER - Request Handlers
// ============================================

class TrackingController {
  // ─────────────────────────────────────────────
  // LOCATION UPDATES
  // ─────────────────────────────────────────────

  /**
   * POST /location
   * Update vehicle location (from driver app).
   */
  async updateLocation(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const parsed = updateLocationSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { vehicleId, latitude, longitude, speed, heading } = parsed.data;

      const data = await trackingService.updateVehicleLocation(
        vehicleId,
        latitude,
        longitude,
        speed,
        heading,
        tenantId
      );

      return res.status(200).json({
        success: true,
        data,
        message: "Location updated successfully",
      });
    } catch (error: any) {
      console.error("Update Location Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to update location",
      });
    }
  }

  /**
   * GET /vehicle/:vehicleId/location
   * Get current location of a vehicle.
   */
  async getVehicleLocation(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const parsed = vehicleLocationParamsSchema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const data = await trackingService.getVehicleCurrentLocation(
        parsed.data.vehicleId,
        tenantId
      );

      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("Get Vehicle Location Error:", error);
      const status = error.message.includes("not found") || error.message.includes("No location") ? 404 : 500;
      return res.status(status).json({
        success: false,
        message: error.message || "Failed to fetch vehicle location",
      });
    }
  }

  /**
   * GET /vehicle/:vehicleId/history
   * Get vehicle location history with date range.
   */
  async getVehicleHistory(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const paramsParsed = vehicleLocationParamsSchema.safeParse(req.params);
      const queryParsed = vehicleHistoryQuerySchema.safeParse(req.query);

      if (!paramsParsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: paramsParsed.error.flatten().fieldErrors,
        });
      }

      if (!queryParsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: queryParsed.error.flatten().fieldErrors,
        });
      }

      const { vehicleId } = paramsParsed.data;
      const { startDate, endDate, page, limit } = queryParsed.data;

      const data = await trackingService.getVehicleLocationHistory(
        vehicleId,
        startDate,
        endDate,
        tenantId,
        page,
        limit
      );

      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("Get Vehicle History Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch location history",
      });
    }
  }

  // ─────────────────────────────────────────────
  // ROUTE LIVE TRACKING
  // ─────────────────────────────────────────────

  /**
   * GET /route/:routeId/live
   * Get all vehicles on a route in real-time.
   */
  async getRouteLive(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const parsed = routeLiveParamsSchema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const data = await trackingService.getRouteLiveVehicles(parsed.data.routeId, tenantId);

      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("Get Route Live Error:", error);
      const status = error.message.includes("not found") ? 404 : 500;
      return res.status(status).json({
        success: false,
        message: error.message || "Failed to fetch live route data",
      });
    }
  }

  // ─────────────────────────────────────────────
  // TRIPS
  // ─────────────────────────────────────────────

  /**
   * POST /trip/start
   * Start a new trip.
   */
  async startTrip(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const parsed = startTripSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { vehicleId, routeId, driverName, startLatitude, startLongitude, tripType } = parsed.data;

      const data = await trackingService.startTrip(
        vehicleId,
        routeId,
        driverName,
        startLatitude,
        startLongitude,
        tenantId,
        tripType
      );

      return res.status(201).json({
        success: true,
        data,
        message: "Trip started successfully",
      });
    } catch (error: any) {
      console.error("Start Trip Error:", error);
      const status = error.message.includes("not found") ? 404 : error.message.includes("already") ? 409 : 500;
      return res.status(status).json({
        success: false,
        message: error.message || "Failed to start trip",
      });
    }
  }

  /**
   * PUT /trip/:tripId/end
   * End an active trip.
   */
  async endTrip(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const paramsParsed = endTripParamsSchema.safeParse(req.params);
      const bodyParsed = endTripSchema.safeParse(req.body);

      if (!paramsParsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: paramsParsed.error.flatten().fieldErrors,
        });
      }

      if (!bodyParsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: bodyParsed.error.flatten().fieldErrors,
        });
      }

      const { tripId } = paramsParsed.data;
      const { endLatitude, endLongitude, totalDistance, notes } = bodyParsed.data;

      const data = await trackingService.endTrip(
        tripId,
        endLatitude,
        endLongitude,
        totalDistance,
        tenantId,
        notes
      );

      return res.status(200).json({
        success: true,
        data,
        message: "Trip ended successfully",
      });
    } catch (error: any) {
      console.error("End Trip Error:", error);
      const status = error.message.includes("not found") ? 404 : 500;
      return res.status(status).json({
        success: false,
        message: error.message || "Failed to end trip",
      });
    }
  }

  /**
   * GET /trips
   * List trips with filters.
   */
  async listTrips(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const parsed = listTripsQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const data = await trackingService.getTrips(parsed.data, tenantId);

      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("List Trips Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch trips",
      });
    }
  }

  // ─────────────────────────────────────────────
  // GEOFENCE ALERTS
  // ─────────────────────────────────────────────

  /**
   * POST /geofence-alert
   * Create a geofence alert.
   */
  async createGeofenceAlert(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const parsed = createGeofenceAlertSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const data = await trackingService.createGeofenceAlert(parsed.data, tenantId);

      return res.status(201).json({
        success: true,
        data,
        message: "Alert created successfully",
      });
    } catch (error: any) {
      console.error("Create Geofence Alert Error:", error);
      const status = error.message.includes("not found") ? 404 : 500;
      return res.status(status).json({
        success: false,
        message: error.message || "Failed to create alert",
      });
    }
  }

  /**
   * GET /alerts
   * List alerts with filters.
   */
  async listAlerts(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const parsed = listAlertsQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const data = await trackingService.getAlerts(parsed.data, tenantId);

      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("List Alerts Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch alerts",
      });
    }
  }

  /**
   * PUT /alerts/:id/resolve
   * Resolve an alert.
   */
  async resolveAlert(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const paramsParsed = resolveAlertParamsSchema.safeParse(req.params);
      const bodyParsed = resolveAlertSchema.safeParse(req.body);

      if (!paramsParsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: paramsParsed.error.flatten().fieldErrors,
        });
      }

      if (!bodyParsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: bodyParsed.error.flatten().fieldErrors,
        });
      }

      const { id } = paramsParsed.data;
      const { resolvedBy, resolution } = bodyParsed.data;

      const data = await trackingService.resolveAlert(id, resolvedBy, tenantId, resolution);

      return res.status(200).json({
        success: true,
        data,
        message: "Alert resolved successfully",
      });
    } catch (error: any) {
      console.error("Resolve Alert Error:", error);
      const status = error.message.includes("not found") ? 404 : 500;
      return res.status(status).json({
        success: false,
        message: error.message || "Failed to resolve alert",
      });
    }
  }

  // ─────────────────────────────────────────────
  // PICKUP / DROP
  // ─────────────────────────────────────────────

  /**
   * POST /pickup-drop
   * Record a student pickup or drop event.
   */
  async recordPickupDrop(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const parsed = recordPickupDropSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const data = await trackingService.recordPickupDrop(parsed.data, tenantId);

      return res.status(201).json({
        success: true,
        data,
        message: `Student ${parsed.data.type.toLowerCase()} recorded successfully`,
      });
    } catch (error: any) {
      console.error("Record Pickup/Drop Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to record pickup/drop",
      });
    }
  }

  // ─────────────────────────────────────────────
  // STUDENT STATUS
  // ─────────────────────────────────────────────

  /**
   * GET /student/:studentId/status
   * Get student's current transport status (for parent app).
   */
  async getStudentStatus(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const parsed = studentStatusParamsSchema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const data = await trackingService.getStudentTransportStatus(
        parsed.data.studentId,
        tenantId
      );

      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("Get Student Status Error:", error);
      const status = error.message.includes("not found") || error.message.includes("No active") ? 404 : 500;
      return res.status(status).json({
        success: false,
        message: error.message || "Failed to fetch student status",
      });
    }
  }
}

export default new TrackingController();
