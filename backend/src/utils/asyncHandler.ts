import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wraps an async express handler so rejected promises are forwarded
 * to the central error middleware instead of crashing the process.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/** Send a standardised JSON success envelope. */
export function ok(res: Response, data: unknown, meta?: Record<string, unknown>) {
  return res.json({ success: true, data, ...(meta ? { meta } : {}) });
}
