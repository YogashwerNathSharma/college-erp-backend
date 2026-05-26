import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";
import { AnyZodObject } from "zod/v3";


export const validate = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // 🔥 overwrite clean data
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next({
          statusCode: 400,
          name: "ZodError",
          errors: error.issues,
        });
      }

      next(error);
    }
  };