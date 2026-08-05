import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ success: false, error: 'Route not found' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    return void res.status(err.statusCode).json({ success: false, error: err.message, ...(err.details ? { details: err.details } : {}) });
  }
  if (err instanceof ZodError) {
    return void res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof SyntaxError) {
    return void res.status(400).json({ success: false, error: 'Malformed JSON payload' });
  }
  logger.error('[http] unhandled error', err);
  res.status(500).json({
    success: false,
    error: config.isDev ? (err instanceof Error ? err.message : 'Internal server error') : 'Internal server error',
  });
}
