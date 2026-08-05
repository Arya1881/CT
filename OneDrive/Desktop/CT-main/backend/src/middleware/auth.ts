import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../models/types';
import { unauthorized, forbidden } from '../utils/errors';
import { verifyToken } from '../utils/jwt';

/** Attach the authenticated user to `req.user`. */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(unauthorized('Authentication token missing'));
  }
  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = { sub: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    return next(unauthorized('Invalid or expired token'));
  }
}

/** Restrict a route to one or more roles. Must run after `authenticate`. */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };
}
