import { Router } from 'express';
import { demandController } from '../controllers/DemandController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.get('/', demandController.getDemands.bind(demandController));
router.get('/my', authMiddleware, demandController.getMyDemands.bind(demandController));
router.get('/my/responded', authMiddleware, demandController.getMyRespondedDemands.bind(demandController));
router.get('/my/orders', authMiddleware, demandController.getMyOrders.bind(demandController));
router.get('/orders/:id', authMiddleware, demandController.getOrderById.bind(demandController));
router.get('/:id', demandController.getDemandById.bind(demandController));
router.post('/', authMiddleware, demandController.createDemand.bind(demandController));
router.put('/:id', authMiddleware, demandController.updateDemand.bind(demandController));
router.put('/:id/cancel', authMiddleware, demandController.cancelDemand.bind(demandController));
router.post('/:id/respond', authMiddleware, demandController.createResponse.bind(demandController));
router.put('/responses/:responseId/withdraw', authMiddleware, demandController.withdrawResponse.bind(demandController));
router.put('/:id/accept', authMiddleware, demandController.acceptResponse.bind(demandController));
router.put('/orders/:id/start', authMiddleware, demandController.startOrder.bind(demandController));
router.put('/orders/:id/complete', authMiddleware, demandController.completeOrder.bind(demandController));

export default router;
