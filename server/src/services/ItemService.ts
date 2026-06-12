import { itemRepository } from '../repositories/ItemRepository';
import { Item, ItemWithOwner } from '../types';

export class ItemService {
  public getItems(category?: string, keyword?: string): ItemWithOwner[] {
    let items = itemRepository.findAll();
    
    if (category && category !== 'all') {
      items = items.filter(item => item.category === category);
    }
    
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(lowerKeyword) ||
        item.description.toLowerCase().includes(lowerKeyword)
      );
    }
    
    return items.map(item => itemRepository.toItemWithOwner(item));
  }

  public getItemById(id: string): ItemWithOwner | null {
    const item = itemRepository.findById(id);
    if (!item) return null;
    itemRepository.incrementViewCount(id);
    return itemRepository.toItemWithOwner(item);
  }

  public getItemsByOwner(ownerId: string): ItemWithOwner[] {
    const items = itemRepository.findByOwnerId(ownerId);
    return items.map(item => itemRepository.toItemWithOwner(item));
  }

  public createItem(ownerId: string, itemData: Omit<Item, 'id' | 'ownerId' | 'createdAt' | 'viewCount' | 'status'>): ItemWithOwner {
    const item = itemRepository.create({ ...itemData, ownerId });
    return itemRepository.toItemWithOwner(item);
  }

  public updateItem(id: string, ownerId: string, updates: Partial<Item>): ItemWithOwner | null {
    const item = itemRepository.findById(id);
    if (!item || item.ownerId !== ownerId) return null;
    
    const updated = itemRepository.update(id, updates);
    return updated ? itemRepository.toItemWithOwner(updated) : null;
  }

  public updateItemStatus(id: string, ownerId: string, status: Item['status']): ItemWithOwner | null {
    return this.updateItem(id, ownerId, { status });
  }
}

export const itemService = new ItemService();
