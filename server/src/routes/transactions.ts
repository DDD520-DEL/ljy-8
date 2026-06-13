import { Router } from 'express';
import { transactionController } from '../controllers/TransactionController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.get('/deposit', authMiddleware, transactionController.getDepositTransactions.bind(transactionController));
router.get('/time-coin', authMiddleware, transactionController.getTimeCoinTransactions.bind(transactionController));

export default router;
