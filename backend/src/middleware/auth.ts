import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthedRequest, AuthPayload } from '../types';
import { unauthorized } from '../utils/AppError';

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(unauthorized('Missing or invalid Authorization header'));
  }
  const token = header.slice('Bearer '.length);
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}
