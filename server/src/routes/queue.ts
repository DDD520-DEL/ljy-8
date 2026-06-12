import { Router } from 'express';
import { queueController } from '../controllers/QueueController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.post('/', authMiddleware, queueController.joinQueue.bind(queueController));
router.delete('/:id', authMiddleware, queueController.cancelQueue.bind(queueController));
router.get('/my', authMiddleware, queueController.getMyQueues.bind(queueController));
router.get('/item/:itemId', queueController.getItemQueues.bind(queueController));
router.get('/:id', queueController.getQueueById.bind(queueController));
router.put('/:id/confirm', authMiddleware, queueController.confirmQueueBorrow.bind(queueController));

router.get('/notifications/list', authMiddleware, queueController.getNotifications.bind(queueController));
router.get('/notifications/unread-count', authMiddleware, queueController.getUnreadNotificationCount.bind(queueController));
router.put('/notifications/:id/read', authMiddleware, queueController.markNotificationAsRead.bind(queueController));
router.put('/notifications/read-all', authMiddleware, queueController.markAllNotificationsAsRead.bind(queueController));

export default router;
