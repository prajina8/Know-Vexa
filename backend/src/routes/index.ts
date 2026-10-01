import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import subjectRoutes from './subjectRoutes';
import materialRoutes from './materialRoutes';
import aiRoutes from './aiRoutes';
import quizRoutes from './quizRoutes';
import flashcardRoutes from './flashcardRoutes';
import progressRoutes from './progressRoutes';
import studyPlanRoutes from './studyPlanRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/subjects', subjectRoutes);
router.use('/materials', materialRoutes);
router.use('/ai', aiRoutes);
router.use('/quizzes', quizRoutes);
router.use('/flashcards', flashcardRoutes);
router.use('/progress', progressRoutes);
router.use('/study-plans', studyPlanRoutes);

export default router;
