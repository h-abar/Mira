import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let status = 500;
  let message = 'Internal server error.';
  let errors: unknown;

  if (err instanceof ApiError) {
    status = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof ZodError) {
    status = 400;
    message = 'Validation failed.';
    errors = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        status = 409;
        message = 'Unique constraint violation. Record already exists.';
        break;
      case 'P2025':
        status = 404;
        message = 'Record not found.';
        break;
      case 'P2003':
        status = 400;
        message = 'Foreign key constraint failed.';
        break;
      default:
        status = 400;
        message = 'Database error.';
    }
    errors = { code: err.code };
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    success: false,
    status,
    message,
    errors,
  });
}