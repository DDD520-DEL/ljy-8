import { Request, Response } from 'express';
import { transactionService } from '../services/TransactionService';
import { AuthRequest } from '../utils/auth';
import { DepositTransactionType, TimeCoinTransactionType } from '../types';

export class TransactionController {
  public async getDepositTransactions(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { type } = req.query;
      const transactions = transactionService.getDepositTransactions(
        req.user.id,
        type as DepositTransactionType | undefined
      );
      res.json({ success: true, data: transactions });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getTimeCoinTransactions(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { type } = req.query;
      const transactions = transactionService.getTimeCoinTransactions(
        req.user.id,
        type as TimeCoinTransactionType | undefined
      );
      res.json({ success: true, data: transactions });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const transactionController = new TransactionController();
