

import { Request, Response } from "express";
import multer from "multer";
import { uploadToCloudinary } from "../../config/cloudinary";
import path from "path";
import {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} from "./teacher.service";

//////////////////////////////////////////////////////
// MULTER CONFIG (photo upload)
//////////////////////////////////////////////////////
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpg, png, webp) are allowed"));
    }
  },
});

//////////////////////////////////////////////////////
// ✅ CREATE
//////////////////////////////////////////////////////
export const create = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Handle photo URL
    const data = { ...req.body };
    if (req.file) {
      data.photoUrl = await uploadToCloudinary(req.file.buffer, "teachers");
    }

    // Parse array fields from FormData
    if (typeof data["subjectIds[]"] === "string") {
      data.subjectIds = [data["subjectIds[]"]];
    } else if (Array.isArray(data["subjectIds[]"])) {
      data.subjectIds = data["subjectIds[]"];
    }

    if (typeof data["classIds[]"] === "string") {
      data.classIds = [data["classIds[]"]];
    } else if (Array.isArray(data["classIds[]"])) {
      data.classIds = data["classIds[]"];
    }

    const teacher = await createTeacher(data, tenantId);

    return res.status(201).json({
      success: true,
      data: teacher,
    });
  } catch (e: any) {
    console.error("CREATE TEACHER ERROR:", e);

    return res.status(400).json({
      success: false,
      message: e.message,
    });
  }
};

//////////////////////////////////////////////////////
// ✅ GET ALL
//////////////////////////////////////////////////////
export const getAll = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = await getTeachers(req.query, tenantId);

    return res.json({
      success: true,
      data,
    });
  } catch (e: any) {
    console.error("GET TEACHERS ERROR:", e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

//////////////////////////////////////////////////////
// ✅ GET BY ID
//////////////////////////////////////////////////////
export const getById = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const teacher = await getTeacherById(id, tenantId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    return res.json({
      success: true,
      data: teacher,
    });
  } catch (e: any) {
    console.error("GET TEACHER BY ID ERROR:", e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

//////////////////////////////////////////////////////
// ✅ UPDATE
//////////////////////////////////////////////////////
export const update = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Handle photo URL
    const data = { ...req.body };
    if (req.file) {
      data.photoUrl = await uploadToCloudinary(req.file.buffer, "teachers");
    }

    // Parse array fields from FormData
    if (typeof data["subjectIds[]"] === "string") {
      data.subjectIds = [data["subjectIds[]"]];
    } else if (Array.isArray(data["subjectIds[]"])) {
      data.subjectIds = data["subjectIds[]"];
    }

    if (typeof data["classIds[]"] === "string") {
      data.classIds = [data["classIds[]"]];
    } else if (Array.isArray(data["classIds[]"])) {
      data.classIds = data["classIds[]"];
    }

    const teacher = await updateTeacher(id, data, tenantId);

    return res.json({
      success: true,
      data: teacher,
    });
  } catch (e: any) {
    console.error("UPDATE TEACHER ERROR:", e);

    return res.status(400).json({
      success: false,
      message: e.message,
    });
  }
};

//////////////////////////////////////////////////////
// ✅ DELETE (soft)
//////////////////////////////////////////////////////
export const remove = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await deleteTeacher(id, tenantId);

    return res.json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (e: any) {
    console.error("DELETE TEACHER ERROR:", e);

    return res.status(400).json({
      success: false,
      message: e.message,
    });
  }
};



//////////////////////////////////////////////////////
// DASHBOARD
//////////////////////////////////////////////////////
export const dashboard = async (req: any, res: any) => {
  try {
    const tenantId = req.tenantId;
    const prisma = (await import("../../utils/prisma")).default;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Base counts
    const [total, active, onLeaveCount, newJoinings, maleCount, femaleCount] = await Promise.all([
      prisma.teacher.count({ where: { tenantId, isDeleted: false } }),
      prisma.teacher.count({ where: { tenantId, isDeleted: false } }), // all non-deleted are active
      prisma.leave.count({ where: { tenantId, status: "Approved", toDate: { gte: now }, fromDate: { lte: now } } }).catch(() => 0),
      prisma.teacher.count({ where: { tenantId, isDeleted: false, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.teacher.count({ where: { tenantId, isDeleted: false, gender: "MALE" } }),
      prisma.teacher.count({ where: { tenantId, isDeleted: false, gender: "FEMALE" } }),
    ]);

    // Department distribution
    const teachers = await prisma.teacher.findMany({
      where: { tenantId, isDeleted: false },
      select: { departmentId: true, createdAt: true, dob: true },
    });

    // Get department names
    const deptIds = [...new Set(teachers.map(t => t.departmentId).filter(Boolean))];
    let deptMap = new Map<string, string>();
    if (deptIds.length > 0) {
      try {
        const depts = await (prisma as any).department?.findMany?.({
          where: { id: { in: deptIds } },
          select: { id: true, name: true },
        });
        if (depts) deptMap = new Map(depts.map((d: any) => [d.id, d.name]));
      } catch {}
    }

    const deptCount: Record<string, number> = {};
    teachers.forEach(t => {
      const deptName = t.departmentId ? (deptMap.get(t.departmentId) || "Other") : "Not Assigned";
      deptCount[deptName] = (deptCount[deptName] || 0) + 1;
    });
    const departmentDistribution = Object.entries(deptCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Experience distribution (based on createdAt as join date)
    const expBuckets = { "0-5 yrs": 0, "5-10 yrs": 0, "10-15 yrs": 0, "15+ yrs": 0 };
    teachers.forEach(t => {
      const years = (now.getTime() - new Date(t.createdAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (years < 5) expBuckets["0-5 yrs"]++;
      else if (years < 10) expBuckets["5-10 yrs"]++;
      else if (years < 15) expBuckets["10-15 yrs"]++;
      else expBuckets["15+ yrs"]++;
    });
    const experienceDistribution = Object.entries(expBuckets).map(([range, count]) => ({ range, count }));

    // Unique departments count
    const departmentsCount = new Set(teachers.map(t => t.departmentId).filter(Boolean)).size || departmentDistribution.length;

    const stats = {
      totalTeachers: total,
      activeTeachers: active - onLeaveCount,
      onLeave: onLeaveCount,
      newJoinings,
      departments: departmentsCount,
      maleTeachers: maleCount,
      femaleTeachers: femaleCount,
    };

    res.json({
      success: true,
      data: {
        stats,
        departmentDistribution,
        experienceDistribution,
        attendanceTrend: [],
        qualificationDistribution: [],
        teachersOnLeave: [],
        upcomingSalary: [],
      },
    });
  } catch (err: any) {
    console.error("Teacher dashboard error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
