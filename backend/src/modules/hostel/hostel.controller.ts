import { Request, Response } from "express";
import * as hostelService from "./hostel.service";

// ============================================
// HOSTEL CRUD
// ============================================

export const createHostelHandler = async (req: any, res: Response) => {
  try {
    const result = await hostelService.createHostel(req.body, req.tenantId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAllHostelsHandler = async (req: any, res: Response) => {
  try {
    const { type, search } = req.query;
    const result = await hostelService.getAllHostels(req.tenantId, { type, search });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getHostelByIdHandler = async (req: any, res: Response) => {
  try {
    const hostel = await hostelService.getHostelById(req.params.id, req.tenantId);
    if (!hostel) return res.status(404).json({ success: false, message: "Hostel not found" });
    res.json({ success: true, data: hostel });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateHostelHandler = async (req: any, res: Response) => {
  try {
    const result = await hostelService.updateHostel(req.params.id, req.body, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteHostelHandler = async (req: any, res: Response) => {
  try {
    await hostelService.deleteHostel(req.params.id, req.tenantId);
    res.json({ success: true, message: "Hostel deleted successfully" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================================
// ROOM CRUD
// ============================================

export const createRoomHandler = async (req: any, res: Response) => {
  try {
    const result = await hostelService.createRoom(req.body, req.tenantId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getRoomsByHostelHandler = async (req: any, res: Response) => {
  try {
    const result = await hostelService.getRoomsByHostel(req.params.hostelId, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateRoomHandler = async (req: any, res: Response) => {
  try {
    const result = await hostelService.updateRoom(req.params.id, req.body, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteRoomHandler = async (req: any, res: Response) => {
  try {
    await hostelService.deleteRoom(req.params.id, req.tenantId);
    res.json({ success: true, message: "Room deleted successfully" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ============================================
// ALLOCATION
// ============================================

export const allocateRoomHandler = async (req: any, res: Response) => {
  try {
    const result = await hostelService.allocateRoom(req.body, req.tenantId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deallocateRoomHandler = async (req: any, res: Response) => {
  try {
    const { allocationId, reason } = req.body;
    const result = await hostelService.deallocateRoom(allocationId, req.tenantId, reason);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAllocationsHandler = async (req: any, res: Response) => {
  try {
    const { hostelId, isActive } = req.query;
    const result = await hostelService.getAllocations(req.tenantId, {
      hostelId,
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// MESS MANAGEMENT
// ============================================

export const createMessHandler = async (req: any, res: Response) => {
  try {
    const result = await hostelService.createMess(req.body, req.tenantId);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getMessByHostelHandler = async (req: any, res: Response) => {
  try {
    const result = await hostelService.getMessByHostel(req.params.hostelId, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateMessHandler = async (req: any, res: Response) => {
  try {
    const result = await hostelService.updateMess(req.params.id, req.body, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const setMessMenuHandler = async (req: any, res: Response) => {
  try {
    const result = await hostelService.setMessMenu(req.body, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getMessMenuHandler = async (req: any, res: Response) => {
  try {
    const result = await hostelService.getMessMenu(req.params.messId, req.tenantId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
