import { Router } from 'express';
import {
  login, getMe, updateProfile, register,
  createOperator, getOperators, deleteOperator, toggleOperatorStatus
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

// Operator Management (main user only)
router.post('/operators', authenticate, createOperator);
router.get('/operators', authenticate, getOperators);
router.patch('/operators/:id/status', authenticate, toggleOperatorStatus);
router.delete('/operators/:id', authenticate, deleteOperator);

export default router;
