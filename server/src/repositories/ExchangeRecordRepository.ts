import { db } from '../utils/db';
import { ExchangeRecord, ExchangeRecordWithItem, PublicUser } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';
import { exchangeItemRepository } from './ExchangeItemRepository';
import { userRepository } from './UserRepository';

export class ExchangeRecordRepository {
  private collection = 'exchangeRecords';

  public findAll(): ExchangeRecord[] {
    return db.getAll<ExchangeRecord>(this.collection);
  }

  public findById(id: string): ExchangeRecord | undefined {
    return db.getById<ExchangeRecord>(this.collection, id);
  }

  public findByUserId(userId: string): ExchangeRecord[] {
    const records = db.findMany<ExchangeRecord>(this.collection, (r) => r.userId === userId);
    return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public findByItemId(itemId: string): ExchangeRecord[] {
    return db.findMany<ExchangeRecord>(this.collection, (r) => r.itemId === itemId);
  }

  public create(data: Omit<ExchangeRecord, 'id' | 'createdAt'>): ExchangeRecord {
    const record: ExchangeRecord = {
      id: generateId(),
      ...data,
      createdAt: getCurrentTime(),
    };
    return db.insert<ExchangeRecord>(this.collection, record);
  }

  public update(id: string, updates: Partial<ExchangeRecord>): ExchangeRecord | undefined {
    return db.update<ExchangeRecord>(this.collection, id, updates);
  }

  public delete(id: string): boolean {
    return db.delete(this.collection, id);
  }

  public toExchangeRecordWithItem(record: ExchangeRecord): ExchangeRecordWithItem {
    const item = exchangeItemRepository.findById(record.itemId);
    const user = userRepository.findById(record.userId);
    return {
      ...record,
      item: item || undefined,
      user: user ? userRepository.toPublicUser(user) : undefined,
    };
  }

  public getMyRecordsWithDetail(userId: string): ExchangeRecordWithItem[] {
    return this.findByUserId(userId).map((r) => this.toExchangeRecordWithItem(r));
  }

  public getAllRecordsWithDetail(): ExchangeRecordWithItem[] {
    return this.findAll()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r) => this.toExchangeRecordWithItem(r));
  }

  public generateVoucherCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

export const exchangeRecordRepository = new ExchangeRecordRepository();
