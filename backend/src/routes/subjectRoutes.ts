import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { subjectSchema } from '../utils/schemas';
import {
  listSubjects,
  createSubject,
  getSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subjectController';

const router = Router();
router.use(requireAuth);

router.get('/', listSubjects);
router.post('/', validate(subjectSchema), createSubject);
router.get('/:id', getSubject);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

export default router;
