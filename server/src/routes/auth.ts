import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));
router.get('/profile', authMiddleware, authController.getProfile.bind(authController));

export default router;
