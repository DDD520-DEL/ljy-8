import { exchangeItemRepository } from '../repositories/ExchangeItemRepository';
import { exchangeRecordRepository } from '../repositories/ExchangeRecordRepository';
import { transactionRepository } from '../repositories/TransactionRepository';
import { userRepository } from '../repositories/UserRepository';
import { timeCoinService } from './TimeCoinService';
import {
  ExchangeItem,
  ExchangeItemCategory,
  ExchangeRecord,
  ExchangeRecordWithItem,
  ExchangeRecordStatus,
} from '../types';

export class ExchangeService {
  public getExchangeItems(category?: ExchangeItemCategory | 'all', keyword?: string): ExchangeItem[] {
    if (category === 'all') {
      category = undefined;
    }
    return exchangeItemRepository.search(keyword, category as ExchangeItemCategory | undefined);
  }

  public getAllExchangeItems(): ExchangeItem[] {
    return exchangeItemRepository.findAll();
  }

  public getExchangeItemById(id: string): ExchangeItem | undefined {
    return exchangeItemRepository.findById(id);
  }

  public createExchangeItem(data: {
    name: string;
    description: string;
    category: ExchangeItemCategory;
    images?: string[];
    coinPrice: number;
    stock: number;
    status?: 'active' | 'inactive' | 'sold_out';
    terms?: string;
    validDays?: number;
  }): ExchangeItem {
    if (!data.name || data.name.trim() === '') {
      throw new Error('商品名称不能为空');
    }
    if (data.coinPrice <= 0) {
      throw new Error('兑换价格必须大于0');
    }
    if (data.stock < 0) {
      throw new Error('库存不能为负数');
    }
    const finalStatus = data.status || (data.stock > 0 ? 'active' : 'sold_out');
    return exchangeItemRepository.create({
      name: data.name.trim(),
      description: data.description || '',
      category: data.category,
      images: data.images || [],
      coinPrice: data.coinPrice,
      stock: data.stock,
      status: finalStatus,
      terms: data.terms,
      validDays: data.validDays,
    });
  }

  public updateExchangeItem(id: string, data: Partial<ExchangeItem>): ExchangeItem | undefined {
    const item = exchangeItemRepository.findById(id);
    if (!item) {
      return undefined;
    }
    if (data.stock !== undefined) {
      if (data.stock < 0) {
        throw new Error('库存不能为负数');
      }
    }
    if (data.coinPrice !== undefined && data.coinPrice <= 0) {
      throw new Error('兑换价格必须大于0');
    }
    return exchangeItemRepository.update(id, data);
  }

  public deleteExchangeItem(id: string): boolean {
    return exchangeItemRepository.delete(id);
  }

  public restockItem(id: string, quantity: number): ExchangeItem | undefined {
    if (quantity <= 0) {
      throw new Error('补货数量必须大于0');
    }
    return exchangeItemRepository.increaseStock(id, quantity);
  }

  public exchange(userId: string, itemId: string, quantity: number = 1, remark?: string): ExchangeRecord {
    if (!userId) {
      throw new Error('用户未登录');
    }
    if (quantity <= 0) {
      throw new Error('兑换数量必须大于0');
    }

    const user = userRepository.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const item = exchangeItemRepository.findById(itemId);
    if (!item) {
      throw new Error('兑换商品不存在');
    }
    if (item.status !== 'active') {
      throw new Error('该商品暂不可兑换');
    }
    if (item.stock < quantity) {
      throw new Error(`库存不足，当前库存: ${item.stock}`);
    }

    const totalCoins = item.coinPrice * quantity;
    if (user.timeCoins < totalCoins) {
      throw new Error(`时间币不足，需要 ${totalCoins} 时间币，当前余额: ${user.timeCoins}`);
    }

    const deductSuccess = timeCoinService.deductCoins(userId, totalCoins);
    if (!deductSuccess) {
      throw new Error('扣减时间币失败');
    }

    exchangeItemRepository.decreaseStock(itemId, quantity);

    const voucherCode = item.category === 'service_voucher' ? exchangeRecordRepository.generateVoucherCode() : undefined;
    const status: ExchangeRecordStatus = item.category === 'service_voucher' ? 'pending' : 'pending';

    const record = exchangeRecordRepository.create({
      userId,
      itemId,
      itemName: item.name,
      itemImage: item.images[0] || '',
      coinPrice: item.coinPrice,
      quantity,
      totalCoins,
      status,
      voucherCode,
      remark,
    });

    transactionRepository.createTimeCoinTransaction({
      userId,
      relatedId: record.id,
      relatedType: 'exchange',
      type: 'expenditure',
      amount: totalCoins,
      source: 'exchange_shop',
      description: `兑换商品: ${item.name} x ${quantity}`,
    });

    return record;
  }

  public getMyExchangeRecords(userId: string): ExchangeRecordWithItem[] {
    return exchangeRecordRepository.getMyRecordsWithDetail(userId);
  }

  public getExchangeRecordById(id: string): ExchangeRecord | undefined {
    return exchangeRecordRepository.findById(id);
  }

  public getExchangeRecordDetail(id: string): ExchangeRecordWithItem | undefined {
    const record = exchangeRecordRepository.findById(id);
    if (!record) return undefined;
    return exchangeRecordRepository.toExchangeRecordWithItem(record);
  }

  public getAllExchangeRecords(): ExchangeRecordWithItem[] {
    return exchangeRecordRepository.getAllRecordsWithDetail();
  }

  public completeExchange(recordId: string): ExchangeRecord | undefined {
    const record = exchangeRecordRepository.findById(recordId);
    if (!record) return undefined;
    if (record.status !== 'pending') {
      throw new Error('该兑换记录状态不允许完成');
    }
    return exchangeRecordRepository.update(recordId, {
      status: 'completed',
      redeemedAt: new Date().toISOString(),
    });
  }

  public cancelExchange(recordId: string): ExchangeRecord | undefined {
    const record = exchangeRecordRepository.findById(recordId);
    if (!record) return undefined;
    if (record.status !== 'pending') {
      throw new Error('该兑换记录状态不允许取消');
    }

    const refundSuccess = timeCoinService.addCoins(record.userId, record.totalCoins);
    if (refundSuccess) {
      exchangeItemRepository.increaseStock(record.itemId, record.quantity);
      transactionRepository.createTimeCoinTransaction({
        userId: record.userId,
        relatedId: record.id,
        relatedType: 'exchange',
        type: 'income',
        amount: record.totalCoins,
        source: 'exchange_refund',
        description: `取消兑换，退还时间币: ${record.itemName}`,
      });
    }

    return exchangeRecordRepository.update(recordId, {
      status: 'cancelled',
    });
  }

  public getExchangeStats(): {
    totalItems: number;
    activeItems: number;
    totalRecords: number;
    totalCoinsExchanged: number;
    categoryStats: Record<string, number>;
  } {
    const items = exchangeItemRepository.findAll();
    const records = exchangeRecordRepository.findAll();
    const categoryStats: Record<string, number> = {};

    items.forEach((item) => {
      if (!categoryStats[item.category]) {
        categoryStats[item.category] = 0;
      }
      categoryStats[item.category] += item.soldCount;
    });

    const completedRecords = records.filter((r) => r.status !== 'cancelled');
    const totalCoinsExchanged = completedRecords.reduce((sum, r) => sum + r.totalCoins, 0);

    return {
      totalItems: items.length,
      activeItems: items.filter((i) => i.status === 'active').length,
      totalRecords: records.length,
      totalCoinsExchanged,
      categoryStats,
    };
  }
}

export const exchangeService = new ExchangeService();
