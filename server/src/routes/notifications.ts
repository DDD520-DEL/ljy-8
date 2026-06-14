import { Router } from 'express';
import { notificationController } from '../controllers/NotificationController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.get('/list', authMiddleware, notificationController.getNotifications.bind(notificationController));
router.get('/unread-count', authMiddleware, notificationController.getUnreadCount.bind(notificationController));
router.put('/:id/read', authMiddleware, notificationController.markAsRead.bind(notificationController));
router.put('/read-all', authMiddleware, notificationController.markAllAsRead.bind(notificationController));
router.delete('/batch', authMiddleware, notificationController.deleteMany.bind(notificationController));
router.delete('/:id', authMiddleware, notificationController.deleteNotification.bind(notificationController));

export default router;