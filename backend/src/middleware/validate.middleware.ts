import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: any) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use passthrough to allow extra fields not in the schema
      const parsed = schema.passthrough ? schema.passthrough().parse(req.body) : schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (err: any) {
      console.error("[Validation Error]", JSON.stringify(err.errors, null, 2));
      return res.status(400).json({
        message: "Validation failed",
        errors: err.errors,
      });
    }
  };
