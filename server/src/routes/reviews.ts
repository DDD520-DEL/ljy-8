import { Router } from 'express';
import { reviewController } from '../controllers/ReviewController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.get('/user/:userId', reviewController.getReviewsByUser.bind(reviewController));
router.get('/order', reviewController.getReviewsByOrder.bind(reviewController));
router.post('/', authMiddleware, reviewController.createReview.bind(reviewController));

export default router;
