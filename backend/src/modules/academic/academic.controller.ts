import { Request, Response } from "express";
import {
  createAcademicYear,
  getAcademicYears,
  setActiveYear,
} from "./academic.service";

// ✅ Create
export const create = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    const year = await createAcademicYear(req.body, tenantId);

    return res.status(201).json({
      success: true,
      data: year,
    });
  } catch (e: any) {
    console.error("CREATE ACADEMIC ERROR:", e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ✅ Get All
export const getAll = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    const data = await getAcademicYears(tenantId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (e: any) {
    console.error("GET ACADEMIC ERROR:", e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// ✅ Set Active
export const setActive = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    const id = req.params.id as string;

    const year = await setActiveYear(id, tenantId);

    return res.status(200).json({
      success: true,
      data: year,
    });
  } catch (e: any) {
    console.error("SET ACTIVE ERROR:", e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};