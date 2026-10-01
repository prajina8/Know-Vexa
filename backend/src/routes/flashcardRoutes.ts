import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rateFlashcardSchema } from '../utils/schemas';
import { listFlashcards, rateFlashcard, deleteFlashcard } from '../controllers/flashcardController';

const router = Router();
router.use(requireAuth);

router.get('/', listFlashcards);
router.put('/:id/rate', validate(rateFlashcardSchema), rateFlashcard);
router.delete('/:id', deleteFlashcard);

export default router;
