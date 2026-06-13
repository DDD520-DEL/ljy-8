import { transactionRepository } from '../repositories/TransactionRepository';
import { DepositTransaction, TimeCoinTransaction, DepositTransactionType, TimeCoinTransactionType } from '../types';

export class TransactionService {
  public getDepositTransactions(userId: string, type?: DepositTransactionType): DepositTransaction[] {
    return transactionRepository.findDepositTransactionsByUserId(userId, type);
  }

  public getTimeCoinTransactions(userId: string, type?: TimeCoinTransactionType): TimeCoinTransaction[] {
    return transactionRepository.findTimeCoinTransactionsByUserId(userId, type);
  }

  public recordDepositPayment(userId: string, orderId: string, amount: number, description: string): DepositTransaction {
    return transactionRepository.createDepositTransaction({
      userId,
      orderId,
      type: 'payment',
      amount,
      description,
    });
  }

  public recordDepositRefund(userId: string, orderId: string, amount: number, description: string): DepositTransaction {
    return transactionRepository.createDepositTransaction({
      userId,
      orderId,
      type: 'refund',
      amount,
      description,
    });
  }

  public recordDepositDeduction(userId: string, orderId: string, amount: number, description: string): DepositTransaction {
    return transactionRepository.createDepositTransaction({
      userId,
      orderId,
      type: 'deduction',
      amount,
      description,
    });
  }

  public recordTimeCoinIncome(userId: string, relatedId: string, relatedType: 'borrow_order' | 'service_order' | 'system', amount: number, source: string, description: string): TimeCoinTransaction {
    return transactionRepository.createTimeCoinTransaction({
      userId,
      relatedId,
      relatedType,
      type: 'income',
      amount,
      source,
      description,
    });
  }

  public recordTimeCoinExpenditure(userId: string, relatedId: string, relatedType: 'borrow_order' | 'service_order' | 'system', amount: number, source: string, description: string): TimeCoinTransaction {
    return transactionRepository.createTimeCoinTransaction({
      userId,
      relatedId,
      relatedType,
      type: 'expenditure',
      amount,
      source,
      description,
    });
  }
}

export const transactionService = new TransactionService();
