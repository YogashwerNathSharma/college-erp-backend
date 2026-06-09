import { Request, Response } from "express";
import { getDefaultersService } from "./defaulters.service";

export const getDefaultersController = async (
  req: Request,
  res: Response
) => {
  try {
    const tenantId = (req as any).tenantId;

    const { classId, sectionId, academicYearId } = req.query;

    const data = await getDefaultersService({
      tenantId,
      classId: classId as string,
      sectionId: sectionId as string,
      academicYearId: academicYearId as string,
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });

  } catch (error: any) {
    console.error("DEFAULTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};