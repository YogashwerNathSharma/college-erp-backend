import { Request, Response } from "express";
import * as service from "./fees.service";

export const getDefaulters = async (req: Request, res: Response) => {
  try {
    const data = await service.getDefaulters(req.query, req.user);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching defaulters",
      error,
    });
  }
};