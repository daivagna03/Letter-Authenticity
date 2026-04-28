import { Router } from 'express';
import { createLetter, getLetters, getLetterById, verifyLetter, getLetterPDF, deleteLetter, getAnalytics } from '../controllers/letterController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createLetter);
router.get('/', authenticate, getLetters);
router.get('/analytics', authenticate, getAnalytics);
router.get('/verify/public', verifyLetter);
router.get('/:id', authenticate, getLetterById);
router.get('/:id/pdf', authenticate, getLetterPDF);
router.delete('/:id', authenticate, deleteLetter);

export default router;
