/**
 * Application error with an HTTP status code.
 * Thrown from services/controllers and translated by the error middleware.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) => new AppError(400, message, details);
export const unauthorized = (message = 'Authentication required') => new AppError(401, message);
export const forbidden = (message = 'You do not have permission to perform this action') => new AppError(403, message);
export const notFound = (message = 'Resource not found') => new AppError(404, message);
export const conflict = (message: string) => new AppError(409, message);
