import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation error.',
      errors: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  // Mongoose duplicate key
  const mongoErr = err as NodeJS.ErrnoException & { code?: number };
  if (mongoErr.code === 11000) {
    res.status(409).json({ success: false, message: 'A record with this value already exists.' });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : config.nodeEnv === 'production'
    ? 'An unexpected error occurred.'
    : err.message || 'An unexpected error occurred.';

  if (statusCode >= 500) {
    console.error('[ERROR]', err);
  }

  res.status(statusCode).json({ success: false, message });
}

export function createError(message: string, statusCode: number): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}
