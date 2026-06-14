import { db } from '../utils/db';
import { ExchangeItem, ExchangeItemCategory, ExchangeItemStatus } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';

export class ExchangeItemRepository {
  private collection = 'exchangeItems';

  public findAll(): ExchangeItem[] {
    return db.getAll<ExchangeItem>(this.collection);
  }

  public findActive(): ExchangeItem[] {
    return db.findMany<ExchangeItem>(this.collection, (item) => item.status === 'active' && item.stock > 0);
  }

  public findById(id: string): ExchangeItem | undefined {
    return db.getById<ExchangeItem>(this.collection, id);
  }

  public findByCategory(category: ExchangeItemCategory): ExchangeItem[] {
    return db.findMany<ExchangeItem>(this.collection, (item) => item.category === category && item.status === 'active');
  }

  public search(keyword?: string, category?: ExchangeItemCategory): ExchangeItem[] {
    let items = this.findAll();
    if (category && category !== 'all' as any) {
      items = items.filter((item) => item.category === category);
    }
    if (keyword) {
      const lower = keyword.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(lower) ||
          item.description.toLowerCase().includes(lower)
      );
    }
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public create(data: Omit<ExchangeItem, 'id' | 'createdAt' | 'updatedAt' | 'soldCount'>): ExchangeItem {
    const now = getCurrentTime();
    const item: ExchangeItem = {
      id: generateId(),
      ...data,
      soldCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    return db.insert<ExchangeItem>(this.collection, item);
  }

  public update(id: string, updates: Partial<ExchangeItem>): ExchangeItem | undefined {
    const updateData = { ...updates, updatedAt: getCurrentTime() };
    return db.update<ExchangeItem>(this.collection, id, updateData);
  }

  public delete(id: string): boolean {
    return db.delete(this.collection, id);
  }

  public decreaseStock(id: string, quantity: number): ExchangeItem | undefined {
    const item = this.findById(id);
    if (!item) return undefined;
    const newStock = Math.max(0, item.stock - quantity);
    const newStatus: ExchangeItemStatus = newStock <= 0 ? 'sold_out' : item.status;
    return this.update(id, {
      stock: newStock,
      soldCount: item.soldCount + quantity,
      status: newStatus,
    });
  }

  public increaseStock(id: string, quantity: number): ExchangeItem | undefined {
    const item = this.findById(id);
    if (!item) return undefined;
    const newStock = item.stock + quantity;
    const newStatus: ExchangeItemStatus = item.status === 'sold_out' && newStock > 0 ? 'active' : item.status;
    return this.update(id, {
      stock: newStock,
      status: newStatus,
    });
  }
}

export const exchangeItemRepository = new ExchangeItemRepository();
