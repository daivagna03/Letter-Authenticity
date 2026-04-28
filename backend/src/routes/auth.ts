import { Router } from 'express';
import { login, getMe, updateProfile, register, createOperator, getOperators, deleteOperator } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

// Operator Management
router.post('/operators', authenticate, createOperator);
router.get('/operators', authenticate, getOperators);
router.delete('/operators/:id', authenticate, deleteOperator);

export default router;
