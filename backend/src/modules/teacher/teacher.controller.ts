import { Request, Response } from "express";
import multer from "multer";
import { uploadToCloudinary } from "../../config/cloudinary";
import path from "path";
import prisma from "../../utils/prisma";
import {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} from "./teacher.service";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error("Only image files (jpg, png, webp) are allowed"));
  },
});

/** Normalize multipart arrays and exact class/subject assignment pairs. */
function parseFormArrays(data: any): any {
  const subjectField = data["subjectIds[]"];
  const classField = data["classIds[]"];

  if (typeof subjectField === "string") data.subjectIds = [subjectField].filter(Boolean);
  else if (Array.isArray(subjectField)) data.subjectIds = subjectField.filter(Boolean);

  if (typeof classField === "string") data.classIds = [classField].filter(Boolean);
  else if (Array.isArray(classField)) data.classIds = classField.filter(Boolean);

  if (typeof data.subjectIds === "string") {
    try {
      const parsed = JSON.parse(data.subjectIds);
      if (Array.isArray(parsed)) data.subjectIds = parsed.filter(Boolean);
    } catch {}
  }
  if (typeof data.classIds === "string") {
    try {
      const parsed = JSON.parse(data.classIds);
      if (Array.isArray(parsed)) data.classIds = parsed.filter(Boolean);
    } catch {}
  }

  if (typeof data.assignments === "string") {
    try {
      const parsed = JSON.parse(data.assignments);
      if (Array.isArray(parsed)) {
        data.assignments = parsed
          .filter((a: any) => a && a.classId && a.subjectId)
          .map((a: any) => ({ classId: String(a.classId), subjectId: String(a.subjectId) }));
      } else data.assignments = undefined;
    } catch {
      data.assignments = undefined;
    }
  }

  // IMPORTANT: Do not manufacture subjectIds/classIds = [] for PUT.
  // The teacher edit flow updates assignments through /:id/assignments first,
  // then sends a profile-only multipart PUT. Injecting empty arrays here caused
  // that profile PUT to interpret "no assignment fields" as "remove all
  // assignments", wiping the subjects that were just saved.
  // If a caller explicitly sends an empty array, it remains intentional and is
  // handled by updateTeacher as a real request to clear that relation.

  delete data["subjectIds[]"];
  delete data["classIds[]"];
  return data;
}

export const create = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const data = parseFormArrays({ ...req.body });
    data.academicYearId = data.academicYearId || (req as any).academicYearId;

    if (req.file) data.photoUrl = await uploadToCloudinary(req.file.buffer, "teachers");

    const teacher = await createTeacher(data, tenantId);
    return res.status(201).json({ success: true, data: teacher });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const getAll = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const data = await getTeachers(
      { ...req.query, academicYearId: (req as any).academicYearId || req.query.academicYearId },
      tenantId
    );
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const getById = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    if (!tenantId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const academicYearId = (req as any).academicYearId || req.query.academicYearId;
    const teacher = await getTeacherById(id, tenantId, academicYearId);
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });

    return res.json({ success: true, data: teacher });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const update = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    if (!tenantId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const data = parseFormArrays({ ...req.body });
    data.academicYearId = data.academicYearId || (req as any).academicYearId;

    if (req.file) data.photoUrl = await uploadToCloudinary(req.file.buffer, "teachers");

    const teacher = await updateTeacher(id, data, tenantId);
    return res.json({ success: true, data: teacher });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const partialUpdate = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    if (!tenantId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const data = parseFormArrays({ ...req.body });
    data.academicYearId = data.academicYearId || (req as any).academicYearId;

    if (req.file) data.photoUrl = await uploadToCloudinary(req.file.buffer, "teachers");

    const teacher = await updateTeacher(id, data, tenantId);
    return res.json({ success: true, data: teacher });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const remove = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    if (!tenantId) return res.status(401).json({ success: false, message: "Unauthorized" });

    await deleteTeacher(id, tenantId, (req as any).academicYearId);
    return res.json({ success: true, message: "Teacher deleted successfully" });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const dashboard = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId || (req as any).tenantId;
    if (!tenantId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const academicYearId = (req as any).academicYearId as string | undefined;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, onLeaveCount, newJoinings, maleCount, femaleCount] = await Promise.all([
      prisma.teacher.count({ where: { tenantId, isDeleted: false, ...(academicYearId ? { academicYearId } : {}) } }),
      prisma.leave.count({ where: { tenantId, isDeleted: false, ...(academicYearId ? { academicYearId } : {}), status: "APPROVED", endDate: { gte: now }, startDate: { lte: now } } }).catch(() => 0),
      prisma.teacher.count({ where: { tenantId, isDeleted: false, ...(academicYearId ? { academicYearId } : {}), createdAt: { gte: startOfMonth } } }),
      prisma.teacher.count({ where: { tenantId, isDeleted: false, ...(academicYearId ? { academicYearId } : {}), gender: "MALE" } }),
      prisma.teacher.count({ where: { tenantId, isDeleted: false, ...(academicYearId ? { academicYearId } : {}), gender: "FEMALE" } }),
    ]);

    const teachers = await prisma.teacher.findMany({
      where: { tenantId, isDeleted: false, ...(academicYearId ? { academicYearId } : {}) },
      select: { departmentId: true, createdAt: true },
    }) as any[];

    const deptIds = [...new Set(teachers.map(t => t.departmentId).filter(Boolean))];
    let deptMap = new Map<string, string>();
    if (deptIds.length > 0) {
      try {
        const depts = await prisma.department?.findMany?.({ where: { id: { in: deptIds } }, select: { id: true, name: true } });
        if (depts) deptMap = new Map(depts.map((d: any) => [d.id, d.name]));
      } catch {}
    }

    const deptCount: Record<string, number> = {};
    teachers.forEach((t: any) => {
      const deptName = t.departmentId ? (deptMap.get(t.departmentId) || "Other") : "Unassigned";
      deptCount[deptName] = (deptCount[deptName] || 0) + 1;
    });
    const departmentDistribution = Object.entries(deptCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const expBuckets: Record<string, number> = { "0-5 yrs": 0, "5-10 yrs": 0, "10-15 yrs": 0, "15+ yrs": 0 };
    teachers.forEach(t => {
      const years = (now.getTime() - new Date(t.createdAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (years < 5) expBuckets["0-5 yrs"]++;
      else if (years < 10) expBuckets["5-10 yrs"]++;
      else if (years < 15) expBuckets["10-15 yrs"]++;
      else expBuckets["15+ yrs"]++;
    });
    const experienceDistribution = Object.entries(expBuckets).map(([range, count]) => ({ range, count }));

    const genderDistribution = [
      { name: "Male", value: maleCount },
      { name: "Female", value: femaleCount },
      { name: "Other", value: total - maleCount - femaleCount },
    ].filter(g => g.value > 0);

    const departmentsCount = new Set(teachers.map((t: any) => t.departmentId).filter(Boolean)).size || departmentDistribution.length;

    let teachersOnLeave: any[] = [];
    try {
      const onLeaveTeachers = await prisma.teacher.findMany({
        where: {
          tenantId, isDeleted: false, ...(academicYearId ? { academicYearId } : {}),
          leaves: { some: { status: "APPROVED", startDate: { lte: now }, endDate: { gte: now } } },
        },
        select: {
          id: true, name: true, departmentId: true,
          leaves: {
            where: { isDeleted: false, ...(academicYearId ? { academicYearId } : {}), status: "APPROVED", startDate: { lte: now }, endDate: { gte: now } },
            select: { leaveType: true, startDate: true, endDate: true, status: true },
            take: 1,
          },
        },
        take: 10,
      });
      teachersOnLeave = onLeaveTeachers.map((t) => ({
        id: t.id, name: t.name,
        department: t.departmentId ? (deptMap.get(t.departmentId) || "N/A") : "N/A",
        leaveType: t.leaves[0]?.leaveType || "Leave",
        fromDate: t.leaves[0]?.startDate, toDate: t.leaves[0]?.endDate,
        status: t.leaves[0]?.status || "APPROVED",
      }));
    } catch {}

    let upcomingSalary: any[] = [];
    try {
      const salaries = await prisma.teacherSalary.findMany({
        where: { tenantId, ...(academicYearId ? { academicYearId } : {}), month: now.getMonth() + 1, year: now.getFullYear(), status: "PENDING" },
        select: {
          id: true, basicSalary: true, totalDeductions: true, netSalary: true,
          teacher: { select: { name: true, departmentId: true } },
        },
        take: 10, orderBy: { netSalary: "desc" },
      });
      upcomingSalary = salaries.map((s) => ({
        id: s.id, name: s.teacher?.name || "N/A",
        department: s.teacher?.departmentId ? (deptMap.get(s.teacher.departmentId) || "N/A") : "N/A",
        gross: s.basicSalary, deductions: s.totalDeductions, net: s.netSalary,
      }));
    } catch {}

    return res.json({
      success: true,
      data: {
        stats: {
          totalTeachers: total, activeTeachers: total - onLeaveCount,
          onLeave: onLeaveCount, newJoinings,
          departments: departmentsCount, maleTeachers: maleCount, femaleTeachers: femaleCount,
        },
        departmentDistribution, experienceDistribution, genderDistribution,
        attendanceTrend: [], qualificationDistribution: [],
        teachersOnLeave, upcomingSalary,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
