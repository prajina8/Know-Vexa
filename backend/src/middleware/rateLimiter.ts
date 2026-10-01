import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const aiRateLimiter = rateLimit({
  windowMs: env.aiRateLimitWindowMin * 60 * 1000,
  max: env.aiRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI requests. Please wait a bit before trying again.',
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});
