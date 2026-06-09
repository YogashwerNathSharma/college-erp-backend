
import { Request, Response } from "express";
import {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} from "./teacher.service";

// ✅ CREATE
export const create = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const teacher = await createTeacher(req.body, tenantId);

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

// ✅ GET ALL
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

// ✅ GET BY ID
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

// ✅ UPDATE
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

    const teacher = await updateTeacher(id, req.body, tenantId);

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

// ✅ DELETE (soft)
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

