import { Request, Response } from "express";
import { createTeacher, getTeachers } from "./teacher.service";

// ✅ CREATE
export const create = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const teacher = await createTeacher(req.body, tenantId);

    res.status(201).json({
      success: true,
      data: teacher,
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

// ✅ GET ALL
export const getAll = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const data = await getTeachers(tenantId);

    res.json({
      success: true,
      data,
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};