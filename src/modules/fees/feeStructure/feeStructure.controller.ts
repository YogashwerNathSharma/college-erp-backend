// feeStructure.controller.ts

import { Request, Response } from "express";
import * as feeService from "./feeStructure.service";

export const createFeeStructure = async (req: Request, res: Response) => {
  try {
    const data = await feeService.createFeeStructure(req.body, req.user);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error creating fee structure", error });
  }
};

export const getFeeStructures = async (req: Request, res: Response) => {
  try {
    const data = await feeService.getFeeStructures(req.query, req.user);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching fee structures", error });
  }
};