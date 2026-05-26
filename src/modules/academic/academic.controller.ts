import { Request, Response } from "express";
import {
  createAcademicYear,
  getAcademicYears,
  setActiveYear,
} from "./academic.service";

// ✅ Create
export const create = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const year = await createAcademicYear(req.body, tenantId);

    res.status(201).json(year);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

// ✅ Get All
export const getAll = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const data = await getAcademicYears(tenantId);

    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

// ✅ Set Active
export const setActive = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const id = req.params.id as string; // ✅ YAHAN FIX

    const year = await setActiveYear(id, tenantId);

    res.json(year);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};