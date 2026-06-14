import { Router } from 'express';
import { feedbackController } from '../controllers/FeedbackController';
import { authMiddleware, adminMiddleware } from '../utils/auth';

const router = Router();

router.get('/my', authMiddleware, feedbackController.getMyFeedbacks.bind(feedbackController));
router.get('/all', authMiddleware, adminMiddleware, feedbackController.getAllFeedbacks.bind(feedbackController));
router.get('/statistics', authMiddleware, adminMiddleware, feedbackController.getStatistics.bind(feedbackController));
router.get('/:id', authMiddleware, feedbackController.getFeedbackById.bind(feedbackController));
router.post('/', authMiddleware, feedbackController.createFeedback.bind(feedbackController));
router.put('/:id/status', authMiddleware, adminMiddleware, feedbackController.updateFeedbackStatus.bind(feedbackController));

export default router;
