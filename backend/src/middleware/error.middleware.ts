import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Global Error:", err);

  // Prisma errors
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists.",
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Record not found.",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired. Please login again.",
    });
  }

  // Multer errors (file upload)
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size is 5MB.",
    });
  }

  // Default
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" 
    ? "Internal server error" 
    : err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};
