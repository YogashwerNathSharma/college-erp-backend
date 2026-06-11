

import { Request, Response } from "express";
import {
  createCommunication,
  getCommunications,
  deleteCommunication,
} from "./communication.service";

// ✅ CREATE COMMUNICATION
export const create = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await createCommunication(
      { ...req.body, senderName: req.user?.name || "Admin" },
      tenantId
    );
    return res.status(201).json({ success: true, data });
  } catch (e: any) {
    console.error("CREATE COMMUNICATION ERROR:", e);
    return res.status(400).json({ success: false, message: e.message });
  }
};

// ✅ GET ALL
export const getAll = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getCommunications(req.query, tenantId);
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("GET COMMUNICATIONS ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ DELETE
export const remove = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await deleteCommunication(id, tenantId);
    return res.json({ success: true, message: "Deleted successfully" });
  } catch (e: any) {
    console.error("DELETE COMMUNICATION ERROR:", e);
    return res.status(400).json({ success: false, message: e.message });
  }
};

