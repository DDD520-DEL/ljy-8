import { Router } from 'express';
import { exchangeController } from '../controllers/ExchangeController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.get('/items', exchangeController.getExchangeItems.bind(exchangeController));
router.get('/items/:id', exchangeController.getExchangeItemById.bind(exchangeController));

router.post('/exchange', authMiddleware, exchangeController.exchange.bind(exchangeController));
router.get('/records/my', authMiddleware, exchangeController.getMyExchangeRecords.bind(exchangeController));
router.get('/records/:id', authMiddleware, exchangeController.getExchangeRecordDetail.bind(exchangeController));
router.put('/records/:id/cancel', authMiddleware, exchangeController.cancelExchange.bind(exchangeController));

router.get('/admin/items', authMiddleware, exchangeController.getAllExchangeItems.bind(exchangeController));
router.post('/admin/items', authMiddleware, exchangeController.createExchangeItem.bind(exchangeController));
router.put('/admin/items/:id', authMiddleware, exchangeController.updateExchangeItem.bind(exchangeController));
router.delete('/admin/items/:id', authMiddleware, exchangeController.deleteExchangeItem.bind(exchangeController));
router.put('/admin/items/:id/restock', authMiddleware, exchangeController.restockItem.bind(exchangeController));
router.get('/admin/records', authMiddleware, exchangeController.getAllExchangeRecords.bind(exchangeController));
router.put('/admin/records/:id/complete', authMiddleware, exchangeController.completeExchange.bind(exchangeController));
router.get('/admin/stats', authMiddleware, exchangeController.getExchangeStats.bind(exchangeController));

export default router;
