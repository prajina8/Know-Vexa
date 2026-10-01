import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getDashboard, getSubjectProgress, getOverallProgress } from '../controllers/progressController';

const router = Router();
router.use(requireAuth);

router.get('/', getOverallProgress);
router.get('/dashboard', getDashboard);
router.get('/subjects/:id', getSubjectProgress);

export default router;
