
import { Router } from "express";
import transportController from "./transport.controller";
import * as academicYearController from "./transport.academicYear.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";

const router = Router();

// Apply auth + tenant + selected academic-year context to all transport routes.
router.use(authMiddleware, resolveTenant, resolveAcademicYear);

// Dashboard
router.get("/dashboard", academicYearController.getDashboard);

// Vehicles
router.post("/vehicles", transportController.createVehicle.bind(transportController));
router.get("/vehicles", transportController.getAllVehicles.bind(transportController));
router.get("/vehicles/:id", transportController.getVehicleById.bind(transportController));
router.put("/vehicles/:id", transportController.updateVehicle.bind(transportController));
router.delete("/vehicles/:id", transportController.deleteVehicle.bind(transportController));

// Routes
router.post("/routes", transportController.createRoute.bind(transportController));
router.get("/routes", transportController.getAllRoutes.bind(transportController));
router.get("/routes/:id", transportController.getRouteById.bind(transportController));
router.put("/routes/:id", transportController.updateRoute.bind(transportController));
router.delete("/routes/:id", transportController.deleteRoute.bind(transportController));

// Route Stops
router.post("/stops/:routeId", transportController.addStop.bind(transportController));
router.get("/stops/route/:routeId", transportController.getStopsByRoute.bind(transportController));
router.put("/stops/:id", transportController.updateStop.bind(transportController));
router.delete("/stops/:id", transportController.deleteStop.bind(transportController));

// Assignments — academic-year isolated
router.post("/assignments", academicYearController.createAssignment);
router.get("/assignments", academicYearController.getAllAssignments);
router.get("/assignments/:id", academicYearController.getAssignmentById);
router.put("/assignments/:id", academicYearController.updateAssignment);
router.delete("/assignments/:id", academicYearController.unassignStudent);

// Attendance — resolved through year-scoped assignments
router.post("/attendance", academicYearController.markAttendance);
router.get("/attendance", academicYearController.getAttendance);

// Reports / Settings remain on the existing implementation for now.
router.get("/reports/:type", transportController.getReport.bind(transportController));
router.get("/settings", transportController.getSettings.bind(transportController));
router.put("/settings", transportController.updateSettings.bind(transportController));

export default router;

// Registration in app.ts / index.ts:
// app.use("/api/transport", transportRoutes);
