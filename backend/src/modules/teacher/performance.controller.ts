

import { Request, Response } from "express";
import {
  createPerformance,
  getPerformanceByTeacher,
  getAllPerformances,
} from "./performance.service";

// ✅ CREATE / UPDATE PERFORMANCE
export const create = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await createPerformance(
      { ...req.body, evaluatedBy: req.user?.id },
      tenantId
    );
    return res.status(201).json({ success: true, data });
  } catch (e: any) {
    console.error("CREATE PERFORMANCE ERROR:", e);
    return res.status(400).json({ success: false, message: e.message });
  }
};

// ✅ GET BY TEACHER
export const getByTeacher = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { teacherId } = req.params;
    const { academicYearId } = req.query;

    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!academicYearId) {
      return res.status(400).json({ success: false, message: "Academic year required" });
    }

    const data = await getPerformanceByTeacher(teacherId, academicYearId as string, tenantId);
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("GET PERFORMANCE ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ GET ALL
export const getAll = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getAllPerformances(req.query, tenantId);
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("GET ALL PERFORMANCES ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

