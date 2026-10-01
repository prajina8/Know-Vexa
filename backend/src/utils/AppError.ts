export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFound = (resource: string) => new AppError(`${resource} not found`, 404);
export const forbidden = (message = 'Forbidden') => new AppError(message, 403);
export const badRequest = (message: string) => new AppError(message, 400);
export const unauthorized = (message = 'Unauthorized') => new AppError(message, 401);
