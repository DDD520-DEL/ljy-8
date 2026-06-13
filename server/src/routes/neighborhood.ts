import { Router } from 'express';
import { neighborhoodController } from '../controllers/NeighborhoodController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.get('/members', authMiddleware, neighborhoodController.getMembers.bind(neighborhoodController));
router.get('/items', authMiddleware, neighborhoodController.getItems.bind(neighborhoodController));
router.get('/skills', authMiddleware, neighborhoodController.getSkills.bind(neighborhoodController));
router.get('/stats', authMiddleware, neighborhoodController.getStats.bind(neighborhoodController));

export default router;
