import { Router } from 'express';
import { userVerificationController } from '../controllers/UserVerificationController';
import { authMiddleware, adminMiddleware } from '../utils/auth';

const router = Router();

router.get('/my', authMiddleware, userVerificationController.getMyVerification.bind(userVerificationController));
router.post('/submit', authMiddleware, userVerificationController.submitVerification.bind(userVerificationController));
router.get('/list', authMiddleware, adminMiddleware, userVerificationController.getVerificationList.bind(userVerificationController));
router.get('/:id', authMiddleware, adminMiddleware, userVerificationController.getVerificationById.bind(userVerificationController));
router.put('/:id/review', authMiddleware, adminMiddleware, userVerificationController.reviewVerification.bind(userVerificationController));

export default router;
