import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { uploadPdf } from '../middleware/upload';
import {
  uploadMaterial,
  listMaterials,
  getMaterial,
  deleteMaterial,
} from '../controllers/materialController';

const router = Router();
router.use(requireAuth);

router.post('/upload', uploadPdf.single('file'), uploadMaterial);
router.get('/', listMaterials);
router.get('/:id', getMaterial);
router.delete('/:id', deleteMaterial);

export default router;
