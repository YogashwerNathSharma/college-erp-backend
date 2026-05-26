import { Response } from "express";

/////////////////////////
// SUCCESS RESPONSE
/////////////////////////
export const successResponse = (
  res: Response,
  data: any = null,
  message: string = "Success",
  statusCode: number = 200,
  meta: any = null
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString(),
  });
};

/////////////////////////
// ERROR RESPONSE (OPTIONAL)
/////////////////////////
export const errorResponse = (
  res: Response,
  message: string = "Error",
  statusCode: number = 500
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
  });
};