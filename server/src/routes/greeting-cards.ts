import { Router } from 'express';
import { greetingCardController } from '../controllers/GreetingCardController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.get('/templates', authMiddleware, greetingCardController.getTemplates.bind(greetingCardController));
router.get('/received', authMiddleware, greetingCardController.getReceivedCards.bind(greetingCardController));
router.get('/sent', authMiddleware, greetingCardController.getSentCards.bind(greetingCardController));
router.get('/stats', authMiddleware, greetingCardController.getStats.bind(greetingCardController));
router.get('/check-order/:orderId', authMiddleware, greetingCardController.checkHasSentForOrder.bind(greetingCardController));
router.get('/:id', authMiddleware, greetingCardController.getCardById.bind(greetingCardController));
router.post('/send', authMiddleware, greetingCardController.sendCard.bind(greetingCardController));

export default router;
