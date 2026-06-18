
import { Response } from "express";
import transportService from "./transport.service";

// ============================================
// TRANSPORT CONTROLLER - Request Handlers
// ============================================

class TransportController {
  // ─────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────

  async getDashboard(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const data = await transportService.getDashboardStats(tenantId);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("Transport Dashboard Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to fetch dashboard data" });
    }
  }

  // ─────────────────────────────────────────────
  // VEHICLES
  // ─────────────────────────────────────────────

  async createVehicle(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const vehicle = await transportService.createVehicle(tenantId, req.body);
      return res.status(201).json({ success: true, data: vehicle, message: "Vehicle created successfully" });
    } catch (error: any) {
      console.error("Create Vehicle Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to create vehicle" });
    }
  }

  async getAllVehicles(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { page, limit, search, status, type } = req.query;
      const data = await transportService.getAllVehicles(tenantId, {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        search,
        status,
        type,
      });
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("Get All Vehicles Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to fetch vehicles" });
    }
  }

  async getVehicleById(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const vehicle = await transportService.getVehicleById(tenantId, req.params.id);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: "Vehicle not found" });
      }
      return res.status(200).json({ success: true, data: vehicle });
    } catch (error: any) {
      console.error("Get Vehicle Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to fetch vehicle" });
    }
  }

  async updateVehicle(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const vehicle = await transportService.updateVehicle(tenantId, req.params.id, req.body);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: "Vehicle not found" });
      }
      return res.status(200).json({ success: true, data: vehicle, message: "Vehicle updated successfully" });
    } catch (error: any) {
      console.error("Update Vehicle Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to update vehicle" });
    }
  }

  async deleteVehicle(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const vehicle = await transportService.deleteVehicle(tenantId, req.params.id);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: "Vehicle not found" });
      }
      return res.status(200).json({ success: true, message: "Vehicle deleted successfully" });
    } catch (error: any) {
      console.error("Delete Vehicle Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to delete vehicle" });
    }
  }

  // ─────────────────────────────────────────────
  // ROUTES
  // ─────────────────────────────────────────────

  async createRoute(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const route = await transportService.createRoute(tenantId, req.body);
      return res.status(201).json({ success: true, data: route, message: "Route created successfully" });
    } catch (error: any) {
      console.error("Create Route Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to create route" });
    }
  }

  async getAllRoutes(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { page, limit, search, status } = req.query;
      const data = await transportService.getAllRoutes(tenantId, {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        search,
        status,
      });
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("Get All Routes Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to fetch routes" });
    }
  }

  async getRouteById(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const route = await transportService.getRouteById(tenantId, req.params.id);
      if (!route) {
        return res.status(404).json({ success: false, message: "Route not found" });
      }
      return res.status(200).json({ success: true, data: route });
    } catch (error: any) {
      console.error("Get Route Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to fetch route" });
    }
  }

  async updateRoute(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const route = await transportService.updateRoute(tenantId, req.params.id, req.body);
      if (!route) {
        return res.status(404).json({ success: false, message: "Route not found" });
      }
      return res.status(200).json({ success: true, data: route, message: "Route updated successfully" });
    } catch (error: any) {
      console.error("Update Route Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to update route" });
    }
  }

  async deleteRoute(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const route = await transportService.deleteRoute(tenantId, req.params.id);
      if (!route) {
        return res.status(404).json({ success: false, message: "Route not found" });
      }
      return res.status(200).json({ success: true, message: "Route deleted successfully" });
    } catch (error: any) {
      console.error("Delete Route Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to delete route" });
    }
  }

  // ─────────────────────────────────────────────
  // ROUTE STOPS
  // ─────────────────────────────────────────────

  async addStop(req: any, res: any) {
  try {
    const tenantId = req.user.tenantId;
    const routeId = req.params.routeId;
    console.log("Adding stop for route:", routeId, req.body);  // Debug
    const result = await transportService.addStop(tenantId, routeId, req.body);
    if (!result) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }
    return res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error("Add Stop Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to add stop" });
  }
}
  async updateStop(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const stop = await transportService.updateStop(tenantId, req.params.id, req.body);
      if (!stop) {
        return res.status(404).json({ success: false, message: "Stop not found" });
      }
      return res.status(200).json({ success: true, data: stop, message: "Stop updated successfully" });
    } catch (error: any) {
      console.error("Update Stop Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to update stop" });
    }
  }

  async deleteStop(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const stop = await transportService.deleteStop(tenantId, req.params.id);
      if (!stop) {
        return res.status(404).json({ success: false, message: "Stop not found" });
      }
      return res.status(200).json({ success: true, message: "Stop deleted successfully" });
    } catch (error: any) {
      console.error("Delete Stop Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to delete stop" });
    }
  }

  async getStopsByRoute(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const stops = await transportService.getStopsByRoute(tenantId, req.params.routeId);
      return res.status(200).json({ success: true, data: stops });
    } catch (error: any) {
      console.error("Get Stops Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to fetch stops" });
    }
  }

  // ─────────────────────────────────────────────
  // ASSIGNMENTS
  // ─────────────────────────────────────────────

  async createAssignment(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const assignment = await transportService.createAssignment(tenantId, req.body);
      return res.status(201).json({ success: true, data: assignment, message: "Student assigned successfully" });
    } catch (error: any) {
      console.error("Create Assignment Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to create assignment" });
    }
  }

  async getAllAssignments(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { page, limit, search, routeId, vehicleId, status, classInfo } = req.query;
      const data = await transportService.getAllAssignments(tenantId, {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        search,
        routeId,
        vehicleId,
        status,
        classInfo,
      });
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("Get All Assignments Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to fetch assignments" });
    }
  }

  async getAssignmentById(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const assignment = await transportService.getAssignmentById(tenantId, req.params.id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: "Assignment not found" });
      }
      return res.status(200).json({ success: true, data: assignment });
    } catch (error: any) {
      console.error("Get Assignment Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to fetch assignment" });
    }
  }

  async updateAssignment(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const assignment = await transportService.updateAssignment(tenantId, req.params.id, req.body);
      if (!assignment) {
        return res.status(404).json({ success: false, message: "Assignment not found" });
      }
      return res.status(200).json({ success: true, data: assignment, message: "Assignment updated successfully" });
    } catch (error: any) {
      console.error("Update Assignment Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to update assignment" });
    }
  }

  async unassignStudent(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const assignment = await transportService.unassignStudent(tenantId, req.params.id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: "Assignment not found" });
      }
      return res.status(200).json({ success: true, message: "Student unassigned successfully" });
    } catch (error: any) {
      console.error("Unassign Student Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to unassign student" });
    }
  }

  // ─────────────────────────────────────────────
  // ATTENDANCE
  // ─────────────────────────────────────────────

  async markAttendance(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const data = {
        ...req.body,
        markedBy: req.user.id || req.user.userId,
      };
      const records = await transportService.markAttendance(tenantId, data);
      return res.status(200).json({ success: true, data: records, message: "Attendance marked successfully" });
    } catch (error: any) {
      console.error("Mark Attendance Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to mark attendance" });
    }
  }

  async getAttendance(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { date, routeId, type } = req.query;
      if (!date) {
        return res.status(400).json({ success: false, message: "Date is required" });
      }
      const data = await transportService.getAttendanceByDate(tenantId, { date, routeId, type });
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("Get Attendance Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to fetch attendance" });
    }
  }

  // ─────────────────────────────────────────────
  // REPORTS
  // ─────────────────────────────────────────────

  async getReport(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const { type } = req.params;
      const data = await transportService.getReport(tenantId, type, req.query);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("Get Report Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to generate report" });
    }
  }

  // ─────────────────────────────────────────────
  // SETTINGS
  // ─────────────────────────────────────────────

  async getSettings(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const settings = await transportService.getSettings(tenantId);
      return res.status(200).json({ success: true, data: settings });
    } catch (error: any) {
      console.error("Get Settings Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to fetch settings" });
    }
  }

  async updateSettings(req: any, res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const settings = await transportService.updateSettings(tenantId, req.body);
      return res.status(200).json({ success: true, data: settings, message: "Settings updated successfully" });
    } catch (error: any) {
      console.error("Update Settings Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to update settings" });
    }
  }
}

export default new TransportController();

