import { Request, Response } from "express";
import { createTeacher, getTeachers } from "./teacher.service";

// ✅ CREATE
export const create = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

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
export const getAll = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

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