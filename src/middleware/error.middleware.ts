import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isDev = process.env.NODE_ENV !== "production";

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors: any = null;

  /////////////////////////
  // PRISMA ERRORS
  /////////////////////////

  if (err.code === "P2002") {
    statusCode = 400;
    const field = err.meta?.target?.join(", ");
    message = `${field} already exists`;
  }

  if (err.code === "P2025") {
    statusCode = 404;
    message = "Record not found";
  }

  /////////////////////////
  // ZOD VALIDATION ERROR
  /////////////////////////

  if (err.name === "ZodError") {
    statusCode = 400;

    errors = err.errors.map((e: any) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    message = "Validation failed";
  }

  /////////////////////////
  // LOGGER
  /////////////////////////

  if (statusCode >= 500) {
    logger.error({
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn({
      message: err.message,
      path: req.path,
      method: req.method,
    });
  }

  /////////////////////////
  // SAFE MESSAGE
  /////////////////////////

  if (!isDev && statusCode === 500) {
    message = "Something went wrong"; // ✅ only production
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString(),

    ...(isDev && {
      error: err.message, // 🔥 real error visible
      stack: err.stack,
    }),
  });
};