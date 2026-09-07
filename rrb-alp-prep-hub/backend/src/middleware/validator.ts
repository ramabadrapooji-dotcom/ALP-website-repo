import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export interface ValidationSchema {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export function validateRequest(schema: ValidationSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        // Query params come in as strings, we often need to let Zod coerce them
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Pass to error handler
        return next(error);
      }
      return next(error);
    }
  };
}
