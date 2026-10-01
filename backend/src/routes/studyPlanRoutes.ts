import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { taskUpdateSchema } from '../utils/schemas';
import { listStudyPlans, getLatestStudyPlan, updateTask } from '../controllers/studyPlanController';

const router = Router();
router.use(requireAuth);

router.get('/', listStudyPlans);
router.get('/latest', getLatestStudyPlan);
router.put('/:planId/tasks/:taskId', validate(taskUpdateSchema), updateTask);

export default router;
