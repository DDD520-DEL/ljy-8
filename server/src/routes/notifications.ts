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
.4016937876353100:8c86a8f7d67447433f992311e0e38bc0_6a2e64ba9f33f71e7752fc75.6a2e64cf9f33f71e7752fc77.6a2e64cf53fb30c5e9e7981e:Trae CN.T(2026/6/14 16:22:39)