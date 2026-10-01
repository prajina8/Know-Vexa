import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier';
  } else if ((err as { code?: number }).code === 11000) {
    statusCode = 409;
    message = 'A record with these details already exists';
  } else if (err.message) {
    message = err.message;
  }

  if (env.nodeEnv !== 'production') {
    // Only dump the full stack for genuine server errors. Expected client
    // errors (401/400/404/409...) are logged as a single quiet line so a
    // normal request cycle doesn't flood the console with stack traces.
    if (statusCode >= 500) {
      // eslint-disable-next-line no-console
      console.error(err);
    } else {
      // eslint-disable-next-line no-console
      console.warn(`[${statusCode}] ${req.method} ${req.originalUrl} — ${message}`);
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.nodeEnv !== 'production' && statusCode === 500 ? { stack: err.stack } : {}),
  });
}
