import { Request, Response } from "express";
import { getReportsDataService } from "./reports.service";

//////////////////////////////////////////////////////
// GET REPORTS
//////////////////////////////////////////////////////

export const getReports = async (req: Request, res: Response) => {
  try {
    const data = await getReportsDataService();

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (error: any) {
    console.error("REPORTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};