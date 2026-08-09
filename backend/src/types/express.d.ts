import type { Role } from '../models/types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email: string;
        role: Role;
      };
    }
  }
}

export {};
