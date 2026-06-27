
import prisma from "../../utils/prisma";
import { calculateDistance, calculateETA, isWithinGeofence, checkSpeedLimit, checkRouteDeviation } from "./helpers/gps.helper";
import { sendPickupNotification, sendDropNotification, sendSpeedAlert } from "./helpers/notification.helper";

// ============================================
// TRACKING SERVICE - Business Logic Layer
// ============================================

class TrackingService {
  // ─────────────────────────────────────────────
  // VEHICLE LOCATION
  // ─────────────────────────────────────────────

  /**
   * Update vehicle's current GPS location.
   * Also stores in location history.
   */
  async updateVehicleLocation(
    vehicleId: string,
    lat: number,
    lng: number,
    speed: number,
    heading: number | undefined,
    tenantId: string
  ) {
    // Verify vehicle belongs to this tenant
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId, isDeleted: false },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    // Check speed limit (default 60 km/h for school vehicles)
    const speedLimit = 60;
    const speedCheck = checkSpeedLimit(speed, speedLimit);

    // Upsert current location record
    const locationData = {
      vehicleId,
      latitude: lat,
      longitude: lng,
      speed,
      heading: heading ?? 0,
      timestamp: new Date(),
      tenantId,
    };

    const currentLocation = await prisma.vehicleLocation.upsert({
      where: {
        vehicleId_tenantId: {
          vehicleId,
          tenantId,
        },
      },
      update: {
        latitude: lat,
        longitude: lng,
        speed,
        heading: heading ?? 0,
        timestamp: new Date(),
      },
      create: locationData,
    });

    // Save to location history
    await prisma.vehicleLocationHistory.create({
      data: {
        vehicleId,
        latitude: lat,
        longitude: lng,
        speed,
        heading: heading ?? 0,
        timestamp: new Date(),
        tenantId,
      },
    });

    // If speed violation detected, create an alert
    if (speedCheck.isViolation) {
      await prisma.transportAlert.create({
        data: {
          vehicleId,
          alertType: "SPEED_VIOLATION",
          latitude: lat,
          longitude: lng,
          description: `Speed violation: ${speed} km/h (limit: ${speedLimit} km/h, excess: ${speedCheck.excessSpeed} km/h)`,
          severity: speedCheck.excessSpeed > 20 ? "HIGH" : "MEDIUM",
          status: "ACTIVE",
          tenantId,
        },
      });
    }

    return {
      ...currentLocation,
      speedViolation: speedCheck.isViolation ? speedCheck : null,
    };
  }

  /**
   * Get vehicle's current/latest location.
   */
  async getVehicleCurrentLocation(vehicleId: string, tenantId: string) {
    const location = await prisma.vehicleLocation.findFirst({
      where: { vehicleId, tenantId },
      include: {
        vehicle: {
          select: {
            id: true,
            vehicleNo: true,
            driverName: true,
            driverPhone: true,
            type: true,
            status: true,
          },
        },
      },
    });

    if (!location) {
      throw new Error("No location data available for this vehicle");
    }

    return location;
  }

  /**
   * Get vehicle's location history within a date range.
   */
  async getVehicleLocationHistory(
    vehicleId: string,
    startDate: string,
    endDate: string,
    tenantId: string,
    page: number = 1,
    limit: number = 100
  ) {
    const skip = (page - 1) * limit;

    const where = {
      vehicleId,
      tenantId,
      timestamp: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    const [history, total] = await Promise.all([
      prisma.vehicleLocationHistory.findMany({
        where,
        orderBy: { timestamp: "asc" },
        skip,
        take: limit,
      }),
      prisma.vehicleLocationHistory.count({ where }),
    ]);

    // Calculate total distance traveled
    let totalDistance = 0;
    for (let i = 1; i < history.length; i++) {
      totalDistance += calculateDistance(
        history[i - 1].latitude,
        history[i - 1].longitude,
        history[i].latitude,
        history[i].longitude
      );
    }

    return {
      history,
      totalDistance: Math.round(totalDistance * 100) / 100,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─────────────────────────────────────────────
  // ROUTE LIVE TRACKING
  // ─────────────────────────────────────────────

  /**
   * Get all vehicles currently on a specific route (real-time positions).
   */
  async getRouteLiveVehicles(routeId: string, tenantId: string) {
    // Verify route exists
    const route = await prisma.route.findFirst({
      where: { id: routeId, tenantId, isDeleted: false },
      include: {
        stops: {
          where: { isDeleted: false },
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!route) {
      throw new Error("Route not found");
    }

    // Get active trips on this route
    const activeTrips = await prisma.transportTrip.findMany({
      where: {
        routeId,
        tenantId,
        status: "ACTIVE",
      },
      include: {
        vehicle: {
          select: { id: true, vehicleNo: true, driverName: true, driverPhone: true, type: true },
        },
      },
    });

    // Get current locations of these vehicles
    const vehicleIds = activeTrips.map((trip) => trip.vehicleId);
    const locations = await prisma.vehicleLocation.findMany({
      where: {
        vehicleId: { in: vehicleIds },
        tenantId,
      },
    });

    // Build response with vehicle positions
    const vehiclesOnRoute = activeTrips.map((trip) => {
      const location = locations.find((loc) => loc.vehicleId === trip.vehicleId);
      return {
        trip: {
          id: trip.id,
          status: trip.status,
          startedAt: trip.startedAt,
          tripType: trip.tripType,
        },
        vehicle: trip.vehicle,
        currentLocation: location
          ? {
              latitude: location.latitude,
              longitude: location.longitude,
              speed: location.speed,
              heading: location.heading,
              lastUpdated: location.timestamp,
            }
          : null,
      };
    });

    return {
      route: {
        id: route.id,
        name: route.name,
        stops: route.stops,
      },
      vehicles: vehiclesOnRoute,
      activeVehicleCount: vehiclesOnRoute.length,
    };
  }

  // ─────────────────────────────────────────────
  // TRIPS
  // ─────────────────────────────────────────────

  /**
   * Start a new trip for a vehicle on a route.
   */
  async startTrip(
    vehicleId: string,
    routeId: string,
    driverName: string,
    startLat: number,
    startLng: number,
    tenantId: string,
    tripType: string = "PICKUP"
  ) {
    // Verify vehicle and route
    const [vehicle, route] = await Promise.all([
      prisma.vehicle.findFirst({ where: { id: vehicleId, tenantId, isDeleted: false } }),
      prisma.route.findFirst({ where: { id: routeId, tenantId, isDeleted: false } }),
    ]);

    if (!vehicle) throw new Error("Vehicle not found");
    if (!route) throw new Error("Route not found");

    // Check if vehicle already has an active trip
    const existingTrip = await prisma.transportTrip.findFirst({
      where: { vehicleId, tenantId, status: "ACTIVE" },
    });

    if (existingTrip) {
      throw new Error("Vehicle already has an active trip. End the current trip first.");
    }

    // Create the trip
    const trip = await prisma.transportTrip.create({
      data: {
        vehicleId,
        routeId,
        driverName,
        startLatitude: startLat,
        startLongitude: startLng,
        tripType,
        status: "ACTIVE",
        startedAt: new Date(),
        tenantId,
      },
      include: {
        vehicle: { select: { id: true, vehicleNo: true, type: true } },
        route: { select: { id: true, name: true, code: true } },
      },
    });

    return trip;
  }

  /**
   * End an active trip.
   */
  async endTrip(
    tripId: string,
    endLat: number,
    endLng: number,
    totalDistance: number,
    tenantId: string,
    notes?: string
  ) {
    const trip = await prisma.transportTrip.findFirst({
      where: { id: tripId, tenantId, status: "ACTIVE" },
    });

    if (!trip) {
      throw new Error("Active trip not found");
    }

    const endedAt = new Date();
    const durationSeconds = Math.round((endedAt.getTime() - trip.startedAt.getTime()) / 1000);

    const updatedTrip = await prisma.transportTrip.update({
      where: { id: tripId },
      data: {
        endLatitude: endLat,
        endLongitude: endLng,
        totalDistance,
        durationSeconds,
        status: "COMPLETED",
        endedAt,
        notes: notes || null,
      },
      include: {
        vehicle: { select: { id: true, vehicleNo: true } },
        route: { select: { id: true, name: true } },
      },
    });

    return updatedTrip;
  }

  /**
   * List trips with filters.
   */
  async getTrips(
    filters: {
      vehicleId?: string;
      routeId?: string;
      driverName?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
    tenantId: string
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (filters.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters.routeId) where.routeId = filters.routeId;
    if (filters.driverName) {
      where.driverName = { contains: filters.driverName, mode: "insensitive" };
    }
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.startedAt = {};
      if (filters.startDate) where.startedAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.startedAt.lte = new Date(filters.endDate);
    }

    const [trips, total] = await Promise.all([
      prisma.transportTrip.findMany({
        where,
        orderBy: { startedAt: "desc" },
        skip,
        take: limit,
        include: {
          vehicle: { select: { id: true, vehicleNo: true, driverName: true } },
          route: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.transportTrip.count({ where }),
    ]);

    return {
      trips,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─────────────────────────────────────────────
  // GEOFENCE ALERTS
  // ─────────────────────────────────────────────

  /**
   * Create a geofence/tracking alert.
   */
  async createGeofenceAlert(
    data: {
      vehicleId: string;
      alertType: string;
      latitude: number;
      longitude: number;
      geofenceName?: string;
      description: string;
      severity: string;
      metadata?: Record<string, any>;
    },
    tenantId: string
  ) {
    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, tenantId, isDeleted: false },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    const alert = await prisma.transportAlert.create({
      data: {
        vehicleId: data.vehicleId,
        alertType: data.alertType,
        latitude: data.latitude,
        longitude: data.longitude,
        geofenceName: data.geofenceName || null,
        description: data.description,
        severity: data.severity,
        status: "ACTIVE",
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        tenantId,
      },
      include: {
        vehicle: { select: { id: true, vehicleNo: true, driverName: true } },
      },
    });

    return alert;
  }

  /**
   * Get alerts with filters.
   */
  async getAlerts(
    filters: {
      vehicleId?: string;
      alertType?: string;
      severity?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
    tenantId: string
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (filters.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters.alertType) where.alertType = filters.alertType;
    if (filters.severity) where.severity = filters.severity;
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [alerts, total] = await Promise.all([
      prisma.transportAlert.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          vehicle: { select: { id: true, vehicleNo: true, driverName: true } },
        },
      }),
      prisma.transportAlert.count({ where }),
    ]);

    return {
      alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Resolve an alert.
   */
  async resolveAlert(alertId: string, resolvedBy: string, tenantId: string, resolution?: string) {
    const alert = await prisma.transportAlert.findFirst({
      where: { id: alertId, tenantId, status: "ACTIVE" },
    });

    if (!alert) {
      throw new Error("Active alert not found");
    }

    return prisma.transportAlert.update({
      where: { id: alertId },
      data: {
        status: "RESOLVED",
        resolvedBy,
        resolvedAt: new Date(),
        resolution: resolution || null,
      },
      include: {
        vehicle: { select: { id: true, vehicleNo: true } },
      },
    });
  }

  // ─────────────────────────────────────────────
  // PICKUP / DROP
  // ─────────────────────────────────────────────

  /**
   * Record a student pickup or drop event.
   */
  async recordPickupDrop(
    data: {
      studentId: string;
      studentName: string;
      vehicleId: string;
      tripId?: string;
      stopId?: string;
      type: "PICKUP" | "DROP";
      latitude: number;
      longitude: number;
      parentPhone?: string;
      timestamp?: string;
    },
    tenantId: string
  ) {
    const record = await prisma.transportPickupDrop.create({
      data: {
        studentId: data.studentId,
        studentName: data.studentName,
        vehicleId: data.vehicleId,
        tripId: data.tripId || null,
        stopId: data.stopId || null,
        type: data.type,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        tenantId,
      },
      include: {
        vehicle: { select: { id: true, vehicleNo: true } },
      },
    });

    // Send notification to parent if phone number provided
    if (data.parentPhone) {
      const vehicleNo = record.vehicle?.vehicleNo || "Unknown";
      if (data.type === "PICKUP") {
        await sendPickupNotification(data.parentPhone, data.studentName, vehicleNo);
      } else {
        await sendDropNotification(data.parentPhone, data.studentName);
      }
    }

    return record;
  }

  // ─────────────────────────────────────────────
  // STUDENT STATUS
  // ─────────────────────────────────────────────

  /**
   * Get a student's current transport status (for parent app).
   */
  async getStudentTransportStatus(studentId: string, tenantId: string) {
    // Get the student's transport assignment
    const assignment = await prisma.transportAssignment.findFirst({
      where: { studentId, tenantId, isDeleted: false, status: "ACTIVE" },
      include: {
        route: {
          include: {
            stops: { where: { isDeleted: false }, orderBy: { sequence: "asc" } },
          },
        },
        vehicle: { select: { id: true, vehicleNo: true, driverName: true, driverPhone: true } },
        stop: true,
      },
    });

    if (!assignment) {
      throw new Error("No active transport assignment found for this student");
    }

    // Get latest pickup/drop event for the student (today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestEvent = await prisma.transportPickupDrop.findFirst({
      where: {
        studentId,
        tenantId,
        timestamp: { gte: today },
      },
      orderBy: { timestamp: "desc" },
    });

    // Get vehicle's current location
    let vehicleLocation = null;
    let eta = null;

    if (assignment.vehicle) {
      vehicleLocation = await prisma.vehicleLocation.findFirst({
        where: { vehicleId: assignment.vehicle.id, tenantId },
      });

      // Calculate ETA to student's stop if vehicle is moving
      if (vehicleLocation && assignment.stop && assignment.stop.latitude && assignment.stop.longitude) {
        const etaSeconds = calculateETA(
          vehicleLocation.latitude,
          vehicleLocation.longitude,
          assignment.stop.latitude,
          assignment.stop.longitude,
          vehicleLocation.speed > 0 ? vehicleLocation.speed : 30 // Default 30 km/h if stationary
        );
        eta = etaSeconds;
      }
    }

    // Check if there's an active trip for this vehicle
    let activeTrip = null;
    if (assignment.vehicle) {
      activeTrip = await prisma.transportTrip.findFirst({
        where: {
          vehicleId: assignment.vehicle.id,
          tenantId,
          status: "ACTIVE",
        },
        select: {
          id: true,
          tripType: true,
          status: true,
          startedAt: true,
          driverName: true,
        },
      });
    }

    // Determine current status
    let currentStatus = "NOT_STARTED";
    if (latestEvent) {
      currentStatus = latestEvent.type === "PICKUP" ? "IN_TRANSIT" : "DROPPED";
    } else if (activeTrip) {
      currentStatus = "BUS_EN_ROUTE";
    }

    return {
      student: {
        id: studentId,
        assignedRoute: assignment.route
          ? { id: assignment.route.id, name: assignment.route.name }
          : null,
        assignedStop: assignment.stop
          ? { id: assignment.stop.id, name: assignment.stop.name, pickupTime: assignment.stop.pickupTime, dropTime: assignment.stop.dropTime }
          : null,
        assignedVehicle: assignment.vehicle,
      },
      currentStatus,
      latestEvent: latestEvent
        ? {
            type: latestEvent.type,
            timestamp: latestEvent.timestamp,
            latitude: latestEvent.latitude,
            longitude: latestEvent.longitude,
          }
        : null,
      vehicleLocation: vehicleLocation
        ? {
            latitude: vehicleLocation.latitude,
            longitude: vehicleLocation.longitude,
            speed: vehicleLocation.speed,
            heading: vehicleLocation.heading,
            lastUpdated: vehicleLocation.timestamp,
          }
        : null,
      eta: eta ? { seconds: eta, minutes: Math.ceil(eta / 60) } : null,
      activeTrip,
    };
  }

  // ─────────────────────────────────────────────
  // ETA CALCULATION
  // ─────────────────────────────────────────────

  /**
   * Calculate ETA for a vehicle to reach a specific stop.
   */
  async calculateETAForStop(vehicleId: string, stopId: string, tenantId: string) {
    const [vehicleLocation, stop] = await Promise.all([
      prisma.vehicleLocation.findFirst({ where: { vehicleId, tenantId } }),
      prisma.routeStop.findFirst({ where: { id: stopId, tenantId, isDeleted: false } }),
    ]);

    if (!vehicleLocation) {
      throw new Error("No location data available for this vehicle");
    }

    if (!stop) {
      throw new Error("Stop not found");
    }

    if (!stop.latitude || !stop.longitude) {
      throw new Error("Stop does not have coordinates configured");
    }

    const speed = vehicleLocation.speed > 0 ? vehicleLocation.speed : 30; // Default 30 km/h
    const distance = calculateDistance(
      vehicleLocation.latitude,
      vehicleLocation.longitude,
      stop.latitude,
      stop.longitude
    );

    const etaSeconds = calculateETA(
      vehicleLocation.latitude,
      vehicleLocation.longitude,
      stop.latitude,
      stop.longitude,
      speed
    );

    return {
      vehicleId,
      stopId,
      stopName: stop.name,
      distance: Math.round(distance * 100) / 100,
      speed,
      etaSeconds,
      etaMinutes: etaSeconds ? Math.ceil(etaSeconds / 60) : null,
      estimatedArrival: etaSeconds ? new Date(Date.now() + etaSeconds * 1000).toISOString() : null,
    };
  }
}

export default new TrackingService();
