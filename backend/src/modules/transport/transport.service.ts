
import prisma from "../../utils/prisma";

// ============================================
// TRANSPORT SERVICE - Business Logic Layer
// ============================================

class TransportService {
  // ─────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────

  async getDashboardStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalVehicles, activeRoutes, totalAssignments, todayAttendance, totalStudentsToday] =
      await Promise.all([
        prisma.vehicle.count({
          where: { tenantId, isDeleted: false },
        }),
        prisma.route.count({
          where: { tenantId, isDeleted: false, status: "ACTIVE" },
        }),
        prisma.transportAssignment.count({
          where: { tenantId, isDeleted: false, status: "ACTIVE" },
        }),
        prisma.transportAttendance.count({
          where: {
            tenantId,
            isDeleted: false,
            date: { gte: today, lt: tomorrow },
            status: "PRESENT",
          },
        }),
        prisma.transportAttendance.count({
          where: {
            tenantId,
            isDeleted: false,
            date: { gte: today, lt: tomorrow },
          },
        }),
      ]);

    const attendancePercentage =
      totalStudentsToday > 0
        ? Math.round((todayAttendance / totalStudentsToday) * 100)
        : 0;

    const recentAssignments = await prisma.transportAssignment.findMany({
      where: { tenantId, isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { route: true, stop: true, vehicle: true },
    });

    const vehiclesByStatus = await prisma.vehicle.groupBy({
      by: ["status"],
      where: { tenantId, isDeleted: false },
      _count: { id: true },
    });

    return {
      totalVehicles,
      activeRoutes,
      totalAssignments,
      attendancePercentage,
      recentAssignments,
      vehiclesByStatus: vehiclesByStatus.map((v) => ({
        status: v.status,
        count: v._count.id,
      })),
    };
  }

  // ─────────────────────────────────────────────
  // VEHICLES
  // ─────────────────────────────────────────────

  async createVehicle(tenantId: string, data: any) {
    return prisma.vehicle.create({
      data: {
        vehicleNo: data.vehicleNo,
        type: data.type,
        capacity: data.capacity,
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        driverLicense: data.driverLicense,
        conductorName: data.conductorName || null,
        conductorPhone: data.conductorPhone || null,
        insuranceExpiry: new Date(data.insuranceExpiry),
        fitnessExpiry: new Date(data.fitnessExpiry),
        permitExpiry: new Date(data.permitExpiry),
        fuelType: data.fuelType,
        status: data.status || "ACTIVE",
        tenantId,
      },
    });
  }

  async getAllVehicles(
    tenantId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      type?: string;
    }
  ) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, isDeleted: false };

    if (query.search) {
      where.OR = [
        { vehicleNo: { contains: query.search, mode: "insensitive" } },
        { driverName: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { assignments: { where: { isDeleted: false, status: "ACTIVE" } } } } },
      }),
      prisma.vehicle.count({ where }),
    ]);

    return {
      vehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVehicleById(tenantId: string, id: string) {
    return prisma.vehicle.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: {
        assignments: {
          where: { isDeleted: false, status: "ACTIVE" },
          include: { route: true, stop: true },
        },
      },
    });
  }

  async updateVehicle(tenantId: string, id: string, data: any) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, tenantId, isDeleted: false },
    });

    if (!vehicle) return null;

    const updateData: any = { ...data };
    if (data.insuranceExpiry) updateData.insuranceExpiry = new Date(data.insuranceExpiry);
    if (data.fitnessExpiry) updateData.fitnessExpiry = new Date(data.fitnessExpiry);
    if (data.permitExpiry) updateData.permitExpiry = new Date(data.permitExpiry);

    return prisma.vehicle.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteVehicle(tenantId: string, id: string) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, tenantId, isDeleted: false },
    });

    if (!vehicle) return null;

    return prisma.vehicle.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  // ─────────────────────────────────────────────
  // ROUTES
  // ─────────────────────────────────────────────

  async createRoute(tenantId: string, data: any) {
    const route = await prisma.route.create({
      data: {
        name: data.name,
        code: data.code,
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        distance: data.distance,
        estimatedTime: data.estimatedTime,
        monthlyFee: data.monthlyFee,
        status: data.status || "ACTIVE",
        tenantId,
      },
    });

    if (data.stops && data.stops.length > 0) {
      const stopsData = data.stops.map((stop: any, index: number) => ({
        routeId: route.id,
        name: stop.name,
        pickupTime: stop.pickupTime,
        dropTime: stop.dropTime,
        sequence: stop.sequence || index + 1,
        latitude: stop.latitude || null,
        longitude: stop.longitude || null,
        tenantId,
      }));

      await prisma.routeStop.createMany({ data: stopsData });
    }

    return prisma.route.findFirst({
      where: { id: route.id },
      include: { stops: { where: { isDeleted: false }, orderBy: { sequence: "asc" } } },
    });
  }

  async getAllRoutes(
    tenantId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    }
  ) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, isDeleted: false };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { code: { contains: query.search, mode: "insensitive" } },
        { startLocation: { contains: query.search, mode: "insensitive" } },
        { endLocation: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    const [routes, total] = await Promise.all([
      prisma.route.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          stops: { where: { isDeleted: false }, orderBy: { sequence: "asc" } },
          _count: { select: { assignments: { where: { isDeleted: false, status: "ACTIVE" } } } },
        },
      }),
      prisma.route.count({ where }),
    ]);

    return {
      routes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRouteById(tenantId: string, id: string) {
  const route = await prisma.route.findFirst({
    where: { id, tenantId, isDeleted: false },
    include: {
      stops: {
        where: { isDeleted: false },
        orderBy: { sequence: "asc" },
      },
      _count: {
        select: {
          assignments: { where: { isDeleted: false, status: "ACTIVE" } },
        },
      },
    },
  });
  return route;
}

  async updateRoute(tenantId: string, id: string, data: any) {
    const route = await prisma.route.findFirst({
      where: { id, tenantId, isDeleted: false },
    });

    if (!route) return null;

    const { stops, ...routeData } = data;

    const updated = await prisma.route.update({
      where: { id },
      data: routeData,
    });

    return prisma.route.findFirst({
      where: { id },
      include: { stops: { where: { isDeleted: false }, orderBy: { sequence: "asc" } } },
    });
  }

  async deleteRoute(tenantId: string, id: string) {
    const route = await prisma.route.findFirst({
      where: { id, tenantId, isDeleted: false },
    });

    if (!route) return null;

    await prisma.routeStop.updateMany({
      where: { routeId: id, tenantId },
      data: { isDeleted: true },
    });

    return prisma.route.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  // ─────────────────────────────────────────────
  // ROUTE STOPS
  // ─────────────────────────────────────────────

  async addStop(tenantId: string, routeId: string, data: any) {
    const route = await prisma.route.findFirst({
      where: { id: routeId, tenantId, isDeleted: false },
    });

    if (!route) return null;

    return prisma.routeStop.create({
      data: {
        name: data.name,
        pickupTime: data.pickupTime,
        dropTime: data.dropTime,
        sequence: parseInt(data.sequence) || 1,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        route: { connect: { id: routeId } },
        tenant: { connect: { id: tenantId } },
      },
    });
  }
  async updateStop(tenantId: string, stopId: string, data: any) {
    const stop = await prisma.routeStop.findFirst({
      where: { id: stopId, tenantId, isDeleted: false },
    });

    if (!stop) return null;

    return prisma.routeStop.update({
      where: { id: stopId },
      data: {
        name: data.name,
        pickupTime: data.pickupTime,
        dropTime: data.dropTime,
        sequence: data.sequence,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });
  }

  async deleteStop(tenantId: string, stopId: string) {
    const stop = await prisma.routeStop.findFirst({
      where: { id: stopId, tenantId, isDeleted: false },
    });

    if (!stop) return null;

    return prisma.routeStop.update({
      where: { id: stopId },
      data: { isDeleted: true },
    });
  }

  async getStopsByRoute(tenantId: string, routeId: string) {
    return prisma.routeStop.findMany({
      where: { routeId, tenantId, isDeleted: false },
      orderBy: { sequence: "asc" },
    });
  }

  // ─────────────────────────────────────────────
  // TRANSPORT ASSIGNMENTS
  // ─────────────────────────────────────────────

  async createAssignment(tenantId: string, data: any) {
  const { addTransportFeeToStudent } = await import("../fees/feeIntegration.service");

  const createData: any = {
    studentId: data.studentId,
    studentName: data.studentName,
    classInfo: data.classInfo,
    assignmentType: data.assignmentType,
    monthlyFee: parseFloat(data.monthlyFee) || 0,
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : null,
    status: "ACTIVE",
    tenant: { connect: { id: tenantId } },
    route: { connect: { id: data.routeId } },
    vehicle: { connect: { id: data.vehicleId } },
  };

  if (data.stopId) {
    createData.stop = { connect: { id: data.stopId } };
  }

  const assignment = await prisma.transportAssignment.create({
    data: createData,
    include: {
      route: true,
      stop: true,
      vehicle: true,
    },
  });

  // ═══ AUTO FEE INTEGRATION ═══
  // When transport is assigned, auto-add transport fee to student's pending installments
  if (assignment.monthlyFee > 0) {
    try {
      const routeName = assignment.route?.name || "";
      await addTransportFeeToStudent(data.studentId, tenantId, assignment.monthlyFee, routeName);
    } catch (err) {
      console.error("Auto transport fee add failed (non-blocking):", err);
    }
  }

  return assignment;
}
  async getAllAssignments(
    tenantId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      routeId?: string;
      vehicleId?: string;
      status?: string;
      classInfo?: string;
    }
  ) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, isDeleted: false };

    if (query.search) {
      where.OR = [
        { studentName: { contains: query.search, mode: "insensitive" } },
        { studentId: { contains: query.search, mode: "insensitive" } },
        { classInfo: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.routeId) where.routeId = query.routeId;
    if (query.vehicleId) where.vehicleId = query.vehicleId;
    if (query.status) where.status = query.status;
    if (query.classInfo) where.classInfo = { contains: query.classInfo, mode: "insensitive" };

    const [assignments, total] = await Promise.all([
      prisma.transportAssignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { route: true, stop: true, vehicle: true },
      }),
      prisma.transportAssignment.count({ where }),
    ]);

    return {
      assignments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAssignmentById(tenantId: string, id: string) {
    return prisma.transportAssignment.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: { route: true, stop: true, vehicle: true },
    });
  }

  async updateAssignment(tenantId: string, id: string, data: any) {
    const assignment = await prisma.transportAssignment.findFirst({
      where: { id, tenantId, isDeleted: false },
    });

    if (!assignment) return null;

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    return prisma.transportAssignment.update({
      where: { id },
      data: updateData,
      include: { route: true, stop: true, vehicle: true },
    });
  }

  async unassignStudent(tenantId: string, id: string) {
    const assignment = await prisma.transportAssignment.findFirst({
      where: { id, tenantId, isDeleted: false },
    });

    if (!assignment) return null;

    const result = await prisma.transportAssignment.update({
      where: { id },
      data: { status: "INACTIVE", endDate: new Date(), isDeleted: true },
    });

    // ═══ AUTO FEE INTEGRATION ═══
    // Remove transport fee from pending installments when unassigned
    try {
      const { removeTransportFeeFromStudent } = await import("../fees/feeIntegration.service");
      await removeTransportFeeFromStudent(assignment.studentId, tenantId);
    } catch (err) {
      console.error("Auto transport fee remove failed (non-blocking):", err);
    }

    return result;
  }

  // ─────────────────────────────────────────────
  // TRANSPORT ATTENDANCE
  // ─────────────────────────────────────────────

  async markAttendance(tenantId: string, data: any) {
    const records = data.records as Array<{
      assignmentId: string;
      status: string;
      type: string;
      remarks?: string;
    }>;

    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    const results = [];

    for (const record of records) {
      const existing = await prisma.transportAttendance.findFirst({
        where: {
          assignmentId: record.assignmentId,
          date,
          type: record.type as any,
          tenantId,
          isDeleted: false,
        },
      });

      if (existing) {
        const updated = await prisma.transportAttendance.update({
          where: { id: existing.id },
          data: {
            status: record.status as any,
            remarks: record.remarks || null,
            markedBy: data.markedBy,
          },
        });
        results.push(updated);
      } else {
        const created = await prisma.transportAttendance.create({
          data: {
            assignmentId: record.assignmentId,
            date,
            status: record.status as any,
            type: record.type as any,
            remarks: record.remarks || null,
            markedBy: data.markedBy,
            tenantId,
          },
        });
        results.push(created);
      }
    }

    return results;
  }

  async getAttendanceByDate(
    tenantId: string,
    query: { date: string; routeId?: string; type?: string }
  ) {
    const date = new Date(query.date);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const where: any = {
      tenantId,
      isDeleted: false,
      date: { gte: date, lt: nextDay },
    };

    if (query.type) where.type = query.type;

    if (query.routeId) {
      const assignmentIds = await prisma.transportAssignment.findMany({
        where: { tenantId, routeId: query.routeId, isDeleted: false, status: "ACTIVE" },
        select: { id: true },
      });
      where.assignmentId = { in: assignmentIds.map((a) => a.id) };
    }

    return prisma.transportAttendance.findMany({
      where,
      include: {
        assignment: {
          include: { route: true, stop: true, vehicle: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAttendanceReport(
    tenantId: string,
    query: { startDate: string; endDate: string; routeId?: string }
  ) {
    const startDate = new Date(query.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(query.endDate);
    endDate.setHours(23, 59, 59, 999);

    const where: any = {
      tenantId,
      isDeleted: false,
      date: { gte: startDate, lte: endDate },
    };

    if (query.routeId) {
      const assignmentIds = await prisma.transportAssignment.findMany({
        where: { tenantId, routeId: query.routeId, isDeleted: false },
        select: { id: true },
      });
      where.assignmentId = { in: assignmentIds.map((a) => a.id) };
    }

    const attendances = await prisma.transportAttendance.findMany({
      where,
      include: {
        assignment: { include: { route: true } },
      },
    });

    const totalRecords = attendances.length;
    const presentCount = attendances.filter((a) => a.status === "PRESENT").length;
    const absentCount = attendances.filter((a) => a.status === "ABSENT").length;
    //const lateCount = attendances.filter((a) => a.status === "LATE").length;

    return {
      totalRecords,
      presentCount,
      absentCount,
      //lateCount,
      attendancePercentage: totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0,
      records: attendances,
    };
  }

  // ─────────────────────────────────────────────
  // REPORTS
  // ─────────────────────────────────────────────

  async getRouteWiseStudentReport(tenantId: string) {
    const routes = await prisma.route.findMany({
      where: { tenantId, isDeleted: false },
      include: {
        stops: { where: { isDeleted: false }, orderBy: { sequence: "asc" } },
        assignments: {
          where: { isDeleted: false, status: "ACTIVE" },
          include: { stop: true, vehicle: true },
        },
        _count: { select: { assignments: { where: { isDeleted: false, status: "ACTIVE" } } } },
      },
    });

    return routes.map((route) => ({
      routeId: route.id,
      routeName: route.name,
      routeCode: route.code,
      totalStudents: route._count.assignments,
      monthlyFee: route.monthlyFee,
      totalRevenue: route._count.assignments * route.monthlyFee,
      stops: route.stops.map((stop) => ({
        stopName: stop.name,
        students: route.assignments.filter((a) => a.stopId === stop.id).length,
      })),
    }));
  }

  async getVehicleUtilizationReport(tenantId: string) {
    const vehicles = await prisma.vehicle.findMany({
      where: { tenantId, isDeleted: false },
      include: {
        _count: { select: { assignments: { where: { isDeleted: false, status: "ACTIVE" } } } },
      },
    });

    return vehicles.map((vehicle) => ({
      vehicleId: vehicle.id,
      vehicleNo: vehicle.vehicleNo,
      type: vehicle.type,
      capacity: vehicle.capacity,
      assigned: vehicle._count.assignments,
      utilization: Math.round((vehicle._count.assignments / vehicle.capacity) * 100),
      available: vehicle.capacity - vehicle._count.assignments,
      status: vehicle.status,
    }));
  }

  async getFeeCollectionReport(tenantId: string, query: { month?: string }) {
    const where: any = { tenantId, isDeleted: false, status: "ACTIVE" };

    const assignments = await prisma.transportAssignment.findMany({
      where,
      include: { route: true, vehicle: true },
    });

    const routeWiseFees: Record<string, { routeName: string; students: number; totalFee: number }> = {};

    assignments.forEach((assignment) => {
      const routeKey = assignment.routeId;
      if (!routeWiseFees[routeKey]) {
        routeWiseFees[routeKey] = {
          routeName: assignment.route.name,
          students: 0,
          totalFee: 0,
        };
      }
      routeWiseFees[routeKey].students += 1;
      routeWiseFees[routeKey].totalFee += assignment.monthlyFee;
    });

    const totalFee = assignments.reduce((sum, a) => sum + a.monthlyFee, 0);

    return {
      totalStudents: assignments.length,
      totalMonthlyFee: totalFee,
      routeWise: Object.values(routeWiseFees),
    };
  }

  async getReport(tenantId: string, type: string, query: any) {
    switch (type) {
      case "route-students":
        return this.getRouteWiseStudentReport(tenantId);
      case "vehicle-utilization":
        return this.getVehicleUtilizationReport(tenantId);
      case "fee-collection":
        return this.getFeeCollectionReport(tenantId, query);
      case "attendance":
        return this.getAttendanceReport(tenantId, query);
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  }

  // ─────────────────────────────────────────────
  // SETTINGS
  // ─────────────────────────────────────────────

  async getSettings(tenantId: string) {
    let settings = await prisma.transportSetting.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      settings = await prisma.transportSetting.create({
        data: {
          tenantId,
          lateFinePerDay: 0,
          absentNotification: true,
          gpsTrackingEnabled: false,
          smsAlertEnabled: false,
          maxStudentsPerVehicle: 50,
        },
      });
    }

    return settings;
  }

  async updateSettings(tenantId: string, data: any) {
    let settings = await prisma.transportSetting.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      return prisma.transportSetting.create({
        data: {
          tenantId,
          lateFinePerDay: data.lateFinePerDay ?? 0,
          absentNotification: data.absentNotification ?? true,
          gpsTrackingEnabled: data.gpsTrackingEnabled ?? false,
          smsAlertEnabled: data.smsAlertEnabled ?? false,
          maxStudentsPerVehicle: data.maxStudentsPerVehicle ?? 50,
        },
      });
    }

    return prisma.transportSetting.update({
      where: { tenantId },
      data: {
        lateFinePerDay: data.lateFinePerDay,
        absentNotification: data.absentNotification,
        gpsTrackingEnabled: data.gpsTrackingEnabled,
        smsAlertEnabled: data.smsAlertEnabled,
        maxStudentsPerVehicle: data.maxStudentsPerVehicle,
      },
    });
  }
}

export default new TransportService();

