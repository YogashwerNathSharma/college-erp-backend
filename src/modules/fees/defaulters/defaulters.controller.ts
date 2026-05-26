import { Request, Response } from "express";
import { getDefaultersService } from "./defaulters.service";

export const getDefaultersController = async (
  req: Request,
  res: Response
) => {
  try {
    const { classId, sectionId, academicYearId } = req.query;

    const data = await getDefaultersService({
      user: req.user as any,
      classId: classId as string,
      sectionId: sectionId as string,
      academicYearId: academicYearId as string,
    });

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};