import { Router } from 'express';
import { register, login, me } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../utils/schemas';
import { requireAuth } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.get('/me', requireAuth, me);

export default router;
