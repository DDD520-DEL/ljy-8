import { db } from '../utils/db';
import { DepositTransaction, TimeCoinTransaction, DepositTransactionType, TimeCoinTransactionType } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';

export class TransactionRepository {
  private depositCollection = 'depositTransactions';
  private timeCoinCollection = 'timeCoinTransactions';

  public createDepositTransaction(data: Omit<DepositTransaction, 'id' | 'createdAt'>): DepositTransaction {
    const transaction: DepositTransaction = {
      id: generateId(),
      ...data,
      createdAt: getCurrentTime(),
    };
    return db.insert<DepositTransaction>(this.depositCollection, transaction);
  }

  public findDepositTransactionsByUserId(userId: string, type?: DepositTransactionType): DepositTransaction[] {
    const transactions = db.findMany<DepositTransaction>(this.depositCollection, (t) => t.userId === userId);
    if (type) {
      return transactions.filter(t => t.type === type);
    }
    return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createTimeCoinTransaction(data: Omit<TimeCoinTransaction, 'id' | 'createdAt'>): TimeCoinTransaction {
    const transaction: TimeCoinTransaction = {
      id: generateId(),
      ...data,
      createdAt: getCurrentTime(),
    };
    return db.insert<TimeCoinTransaction>(this.timeCoinCollection, transaction);
  }

  public findTimeCoinTransactionsByUserId(userId: string, type?: TimeCoinTransactionType): TimeCoinTransaction[] {
    const transactions = db.findMany<TimeCoinTransaction>(this.timeCoinCollection, (t) => t.userId === userId);
    if (type) {
      return transactions.filter(t => t.type === type);
    }
    return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const transactionRepository = new TransactionRepository();
