import { Router } from 'express';
import { orderController } from '../controllers/OrderController';
import { authMiddleware } from '../utils/auth';

const router = Router();

// Borrow Orders
router.get('/borrow', authMiddleware, orderController.getBorrowOrders.bind(orderController));
router.get('/borrow/:id', authMiddleware, orderController.getBorrowOrderById.bind(orderController));
router.post('/borrow', authMiddleware, orderController.createBorrowOrder.bind(orderController));
router.put('/borrow/:id/approve', authMiddleware, orderController.approveBorrowOrder.bind(orderController));
router.put('/borrow/:id/reject', authMiddleware, orderController.rejectBorrowOrder.bind(orderController));
router.put('/borrow/:id/lend', authMiddleware, orderController.confirmLend.bind(orderController));
router.put('/borrow/:id/return', authMiddleware, orderController.confirmReturn.bind(orderController));
router.put('/borrow/:id/return-damage', authMiddleware, orderController.confirmReturnWithDamage.bind(orderController));

// Service Orders
router.get('/service', authMiddleware, orderController.getServiceOrders.bind(orderController));
router.get('/service/:id', authMiddleware, orderController.getServiceOrderById.bind(orderController));
router.post('/service', authMiddleware, orderController.createServiceOrder.bind(orderController));
router.put('/service/:id/approve', authMiddleware, orderController.approveServiceOrder.bind(orderController));
router.put('/service/:id/reject', authMiddleware, orderController.rejectServiceOrder.bind(orderController));
router.put('/service/:id/start', authMiddleware, orderController.startService.bind(orderController));
router.put('/service/:id/complete', authMiddleware, orderController.completeService.bind(orderController));

export default router;
