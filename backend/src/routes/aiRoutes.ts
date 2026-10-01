import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { aiRateLimiter } from '../middleware/rateLimiter';
import {
  summarizeSchema,
  chatSchema,
  generateQuizSchema,
  generateFlashcardsSchema,
  studyPlanSchema,
} from '../utils/schemas';
import {
  summarize,
  chat,
  getChatHistory,
  clearChatHistory,
  generateQuiz,
  generateFlashcards,
  generateStudyPlan,
  analyzePerformance,
} from '../controllers/aiController';

const router = Router();
router.use(requireAuth);
router.use(aiRateLimiter);

router.post('/summarize', validate(summarizeSchema), summarize);
router.post('/chat', validate(chatSchema), chat);
router.get('/chat/:materialId', getChatHistory);
router.delete('/chat/:materialId', clearChatHistory);
router.post('/generate-quiz', validate(generateQuizSchema), generateQuiz);
router.post('/generate-flashcards', validate(generateFlashcardsSchema), generateFlashcards);
router.post('/generate-study-plan', validate(studyPlanSchema), generateStudyPlan);
router.post('/analyze-performance', analyzePerformance);

export default router;
