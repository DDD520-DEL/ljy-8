import { Router } from 'express';
import { disputeController } from '../controllers/DisputeController';
import { authMiddleware, adminMiddleware } from '../utils/auth';

const router = Router();

router.get('/', authMiddleware, disputeController.getDisputes.bind(disputeController));
router.get('/all', authMiddleware, adminMiddleware, disputeController.getAllDisputes.bind(disputeController));
router.get('/:id', authMiddleware, disputeController.getDisputeById.bind(disputeController));
router.post('/', authMiddleware, disputeController.createDispute.bind(disputeController));
router.put('/:id/review', authMiddleware, adminMiddleware, disputeController.startReview.bind(disputeController));
router.put('/:id/resolve', authMiddleware, adminMiddleware, disputeController.resolveDispute.bind(disputeController));

export default router;
