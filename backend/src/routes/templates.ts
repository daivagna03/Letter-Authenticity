import { Router } from 'express';
import { getTemplates, getTemplateById } from '../controllers/templateController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getTemplates);
router.get('/:id', authenticate, getTemplateById);

export default router;
