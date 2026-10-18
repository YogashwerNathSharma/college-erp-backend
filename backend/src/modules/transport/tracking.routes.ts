
import { Router, Request, Response, NextFunction } from "express";
import trackingController from "./tracking.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

// ============================================
// TRACKING ROUTES
// All prefixed with /api/transport/tracking
// ============================================

const router = Router();

// Apply auth middleware to all tracking routes
router.use(authMiddleware);

// ─────────────────────────────────────────────
// ROLE-BASED ACCESS MIDDLEWARE
// ─────────────────────────────────────────────

/**
 * Restrict to admin only.
 */
const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
  next();
};

/**
 * Allow admin + driver/teacher (anyone who can update location).
 */
const driverOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;
  if (!user || !["ADMIN", "SUPER_ADMIN", "TEACHER", "DRIVER", "STAFF"].includes(user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Driver or admin privileges required.",
    });
  }
  next();
};

/**
 * Allow any authenticated user (including parents viewing their child's status).
 */
const anyAuthenticated = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};

// ─────────────────────────────────────────────
// LOCATION ROUTES
// ─────────────────────────────────────────────

// Update vehicle location (drivers & admins)
router.post(
  "/location",
  driverOrAdmin,
  trackingController.updateLocation.bind(trackingController)
);

// Get current location of a vehicle (any authenticated user)
router.get(
  "/vehicle/:vehicleId/location",
  anyAuthenticated,
  trackingController.getVehicleLocation.bind(trackingController)
);

// Get vehicle location history (admin & drivers)
router.get(
  "/vehicle/:vehicleId/history",
  driverOrAdmin,
  trackingController.getVehicleHistory.bind(trackingController)
);

// ─────────────────────────────────────────────
// ROUTE LIVE TRACKING
// ─────────────────────────────────────────────

// Get all vehicles on a route (real-time) - any authenticated
router.get(
  "/route/:routeId/live",
  anyAuthenticated,
  trackingController.getRouteLive.bind(trackingController)
);

// ─────────────────────────────────────────────
// TRIP ROUTES
// ─────────────────────────────────────────────

// Start a trip (drivers & admins)
router.post(
  "/trip/start",
  driverOrAdmin,
  trackingController.startTrip.bind(trackingController)
);

// End a trip (drivers & admins)
router.put(
  "/trip/:tripId/end",
  driverOrAdmin,
  trackingController.endTrip.bind(trackingController)
);

// List trips (any authenticated)
router.get(
  "/trips",
  anyAuthenticated,
  trackingController.listTrips.bind(trackingController)
);

// ─────────────────────────────────────────────
// GEOFENCE ALERT ROUTES
// ─────────────────────────────────────────────

// Create geofence alert (drivers & admins - system/device can trigger)
router.post(
  "/geofence-alert",
  driverOrAdmin,
  trackingController.createGeofenceAlert.bind(trackingController)
);

// List alerts (admin only)
router.get(
  "/alerts",
  adminOnly,
  trackingController.listAlerts.bind(trackingController)
);

// Resolve alert (admin only)
router.put(
  "/alerts/:id/resolve",
  adminOnly,
  trackingController.resolveAlert.bind(trackingController)
);

// ─────────────────────────────────────────────
// PICKUP / DROP ROUTES
// ─────────────────────────────────────────────

// Record student pickup/drop (drivers & admins)
router.post(
  "/pickup-drop",
  driverOrAdmin,
  trackingController.recordPickupDrop.bind(trackingController)
);

// ─────────────────────────────────────────────
// STUDENT STATUS (PARENT APP)
// ─────────────────────────────────────────────

// Get student transport status (any authenticated - parents, admins)
router.get(
  "/student/:studentId/status",
  anyAuthenticated,
  trackingController.getStudentStatus.bind(trackingController)
);

export default router;

// ─────────────────────────────────────────────────────────────────
// REGISTRATION
// ─────────────────────────────────────────────────────────────────
// In your main app.ts or index.ts, add:
//
// import trackingRoutes from "./modules/transport/tracking.routes";
// app.use("/api/transport/tracking", trackingRoutes);
//
// OR register alongside the existing transport routes in app.ts:
//
// import transportRoutes from "./modules/transport/transport.routes";
// import trackingRoutes from "./modules/transport/tracking.routes";
// app.use("/api/transport", transportRoutes);
// app.use("/api/transport/tracking", trackingRoutes);
// ─────────────────────────────────────────────────────────────────
