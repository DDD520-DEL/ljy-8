import { Router } from 'express';
import { statsController } from '../controllers/StatsController';
import { authMiddleware, adminMiddleware } from '../utils/auth';

const router = Router();

router.get('/dashboard', authMiddleware, adminMiddleware, statsController.getDashboardStats.bind(statsController));
router.get('/leaderboard', statsController.getLeaderboard.bind(statsController));

export default router;
