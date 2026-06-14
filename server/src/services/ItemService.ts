import { itemRepository } from '../repositories/ItemRepository';
import { Item, ItemWithOwner, ItemFilterParams, ItemSortParams, ItemPaginationParams, PaginatedResult } from '../types';

export class ItemService {
  public getItems(category?: string, keyword?: string): ItemWithOwner[] {
    const result = itemRepository.findWithFilters(
      { category, keyword },
      { sortBy: 'createdAt', sortOrder: 'desc' },
      { page: 1, pageSize: 100 }
    );
    return result.items.map(item => itemRepository.toItemWithOwner(item));
  }

  public searchItems(
    filters: ItemFilterParams,
    sort: ItemSortParams,
    pagination: ItemPaginationParams
  ): PaginatedResult<ItemWithOwner> {
    const result = itemRepository.findWithFilters(filters, sort, pagination);
    return {
      ...result,
      items: result.items.map(item => itemRepository.toItemWithOwner(item)),
    };
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

  public createItem(ownerId: string, itemData: Omit<Item, 'id' | 'ownerId' | 'createdAt' | 'viewCount' | 'status' | 'borrowCount' | 'minCreditLevel'> & { minCreditLevel?: string }): ItemWithOwner {
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
