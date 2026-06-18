
import { Router } from "express";
import transportController from "./transport.controller";
import { authMiddleware } from "../../middleware/auth.middleware"; // Adjust path as per your project structure

const router = Router();

// Apply auth middleware to all transport routes
router.use(authMiddleware);

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
router.get("/dashboard", transportController.getDashboard.bind(transportController));

// ─────────────────────────────────────────────
// VEHICLES
// ─────────────────────────────────────────────
router.post("/vehicles", transportController.createVehicle.bind(transportController));
router.get("/vehicles", transportController.getAllVehicles.bind(transportController));
router.get("/vehicles/:id", transportController.getVehicleById.bind(transportController));
router.put("/vehicles/:id", transportController.updateVehicle.bind(transportController));
router.delete("/vehicles/:id", transportController.deleteVehicle.bind(transportController));

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────
router.post("/routes", transportController.createRoute.bind(transportController));
router.get("/routes", transportController.getAllRoutes.bind(transportController));
router.get("/routes/:id", transportController.getRouteById.bind(transportController));
router.put("/routes/:id", transportController.updateRoute.bind(transportController));
router.delete("/routes/:id", transportController.deleteRoute.bind(transportController));

// ─────────────────────────────────────────────
// ROUTE STOPS
// ─────────────────────────────────────────────
router.post("/stops/:routeId", transportController.addStop.bind(transportController));
router.get("/stops/route/:routeId", transportController.getStopsByRoute.bind(transportController));
router.put("/stops/:id", transportController.updateStop.bind(transportController));
router.delete("/stops/:id", transportController.deleteStop.bind(transportController));

// ─────────────────────────────────────────────
// ASSIGNMENTS
// ─────────────────────────────────────────────
router.post("/assignments", transportController.createAssignment.bind(transportController));
router.get("/assignments", transportController.getAllAssignments.bind(transportController));
router.get("/assignments/:id", transportController.getAssignmentById.bind(transportController));
router.put("/assignments/:id", transportController.updateAssignment.bind(transportController));
router.delete("/assignments/:id", transportController.unassignStudent.bind(transportController));

// ─────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────
router.post("/attendance", transportController.markAttendance.bind(transportController));
router.get("/attendance", transportController.getAttendance.bind(transportController));

// ─────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────
router.get("/reports/:type", transportController.getReport.bind(transportController));

// ─────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────
router.get("/settings", transportController.getSettings.bind(transportController));
router.put("/settings", transportController.updateSettings.bind(transportController));

export default router;

// ─────────────────────────────────────────────
// REGISTRATION IN APP
// ─────────────────────────────────────────────
// In your main app.ts or index.ts, add:
//
// import transportRoutes from "./modules/transport/transport.routes";
// app.use("/api/transport", transportRoutes);

