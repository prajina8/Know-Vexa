import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { updateProfile, getAchievements } from '../controllers/userController';

const router = Router();
router.use(requireAuth);

router.put('/profile', updateProfile);
router.get('/achievements', getAchievements);

export default router;
