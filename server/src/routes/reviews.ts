import { Router } from 'express';
import { reviewController } from '../controllers/ReviewController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.get('/user/:userId', reviewController.getReviewsByUser.bind(reviewController));
router.get('/my-posted', authMiddleware, reviewController.getMyPostedReviews.bind(reviewController));
router.get('/order', reviewController.getReviewsByOrder.bind(reviewController));
router.get('/:reviewId/replies', reviewController.getReviewReplies.bind(reviewController));
router.post('/', authMiddleware, reviewController.createReview.bind(reviewController));
router.post('/:reviewId/replies', authMiddleware, reviewController.createReply.bind(reviewController));

export default router;
