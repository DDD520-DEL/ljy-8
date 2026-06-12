import { db } from '../utils/db';
import { Item, ItemWithOwner } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';
import { userRepository } from './UserRepository';

export class ItemRepository {
  private collection = 'items';

  public findAll(): Item[] {
    return db.getAll<Item>(this.collection);
  }

  public findById(id: string): Item | undefined {
    return db.getById<Item>(this.collection, id);
  }

  public findByOwnerId(ownerId: string): Item[] {
    return db.findMany<Item>(this.collection, (item) => item.ownerId === ownerId);
  }

  public findByCategory(category: string): Item[] {
    if (category === 'all') return this.findAll();
    return db.findMany<Item>(this.collection, (item) => item.category === category && item.status === 'available');
  }

  public create(itemData: Omit<Item, 'id' | 'createdAt' | 'viewCount' | 'status'>): Item {
    const item: Item = {
      id: generateId(),
      ...itemData,
      status: 'available',
      viewCount: 0,
      createdAt: getCurrentTime(),
    };
    return db.insert<Item>(this.collection, item);
  }

  public update(id: string, updates: Partial<Item>): Item | undefined {
    return db.update<Item>(this.collection, id, updates);
  }

  public incrementViewCount(id: string): void {
    const item = this.findById(id);
    if (item) {
      this.update(id, { viewCount: item.viewCount + 1 });
    }
  }

  public toItemWithOwner(item: Item): ItemWithOwner {
    const owner = userRepository.findById(item.ownerId);
    return {
      ...item,
      owner: owner ? userRepository.toPublicUser(owner) : {} as any,
    };
  }
}

export const itemRepository = new ItemRepository();
