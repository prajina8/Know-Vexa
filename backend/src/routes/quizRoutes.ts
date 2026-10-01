import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { submitQuizSchema } from '../utils/schemas';
import { listQuizzes, getQuiz, submitQuiz, getQuizAttempt } from '../controllers/quizController';

const router = Router();
router.use(requireAuth);

router.get('/', listQuizzes);
router.get('/attempts/:id', getQuizAttempt);
router.get('/:id', getQuiz);
router.post('/:id/submit', validate(submitQuizSchema), submitQuiz);

export default router;
