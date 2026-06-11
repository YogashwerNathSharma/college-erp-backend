

import { Request, Response } from "express";
import {
  createSalary,
  getSalaries,
  getPayslip,
  updateSalary,
} from "./salary.service";

// ✅ CREATE SALARY
export const create = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const salary = await createSalary(req.body, tenantId);
    return res.status(201).json({ success: true, data: salary });
  } catch (e: any) {
    console.error("CREATE SALARY ERROR:", e);
    return res.status(400).json({ success: false, message: e.message });
  }
};

// ✅ GET ALL SALARIES
export const getAll = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getSalaries(req.query, tenantId);
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("GET SALARIES ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ GET PAYSLIP
export const slip = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { teacherId } = req.params;
    const { month, year } = req.query;

    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!month || !year) {
      return res.status(400).json({ success: false, message: "Month and year required" });
    }

    const data = await getPayslip(teacherId, parseInt(month), parseInt(year), tenantId);
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("GET PAYSLIP ERROR:", e);
    return res.status(400).json({ success: false, message: e.message });
  }
};

// ✅ UPDATE SALARY
export const update = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await updateSalary(id, req.body, tenantId);
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("UPDATE SALARY ERROR:", e);
    return res.status(400).json({ success: false, message: e.message });
  }
};

