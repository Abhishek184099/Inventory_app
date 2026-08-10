import { Request, Response, NextFunction } from "express";
import { z } from "zod";

type ValidateTarget = "body" | "query" | "params";

export const validate =
  (schema: z.ZodType, target: ValidateTarget = "body") =>
  (req: Request, res: Response, next: NextFunction) => {

    console.error("TARGET:", target);
console.error("DATA:", req[target]);

    const result = schema.safeParse(req[target]);
   

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: z.flattenError(result.error).fieldErrors,
      });
    }

       if (target === 'body') {
      req.body = result.data; 
    } else {
      (req as any).validated = { ...(req as any).validated, [target]: result.data };
    }
    next();
  };