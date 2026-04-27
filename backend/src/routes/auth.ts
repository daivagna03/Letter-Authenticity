import { Router } from 'express';
import { login, getMe, updateProfile, register } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

export default router;
