import { db } from '../utils/db';
import { Item, ItemWithOwner, ItemFilterParams, ItemSortParams, ItemPaginationParams, PaginatedResult } from '../types';
import { generateId, getCurrentTime, getCreditLevel } from '../utils/helpers';
import { userRepository } from './UserRepository';

const CREDIT_LEVEL_ORDER: Record<string, number> = {
  'S': 6,
  'A': 5,
  'B': 4,
  'C': 3,
  'D': 2,
  'E': 1,
};

function compareCreditLevels(level1: string, level2: string): number {
  const l1 = CREDIT_LEVEL_ORDER[level1] || 0;
  const l2 = CREDIT_LEVEL_ORDER[level2] || 0;
  return l1 - l2;
}

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

  public findWithFilters(
    filters: ItemFilterParams,
    sort: ItemSortParams,
    pagination: ItemPaginationParams
  ): PaginatedResult<Item> {
    let items = this.findAll();

    if (filters.status) {
      items = items.filter(item => item.status === filters.status);
    }

    if (filters.category && filters.category !== 'all') {
      items = items.filter(item => item.category === filters.category);
    }

    if (filters.keyword) {
      const lowerKeyword = filters.keyword.toLowerCase();
      items = items.filter(item =>
        item.title.toLowerCase().includes(lowerKeyword) ||
        item.description.toLowerCase().includes(lowerKeyword)
      );
    }

    if (filters.minDeposit !== undefined) {
      items = items.filter(item => item.deposit >= filters.minDeposit!);
    }

    if (filters.maxDeposit !== undefined) {
      items = items.filter(item => item.deposit <= filters.maxDeposit!);
    }

    if (filters.minCreditLevel) {
      items = items.filter(item => {
        if (!item.minCreditLevel) return true;
        return compareCreditLevels(item.minCreditLevel, filters.minCreditLevel!) >= 0;
      });
    }

    if (filters.userNeighborhood) {
      items = items.filter(item => {
        const owner = userRepository.findById(item.ownerId);
        if (!owner) return false;
        return owner.neighborhood === filters.userNeighborhood;
      });
    }

    const sortBy = sort.sortBy || 'createdAt';
    const sortOrder = sort.sortOrder || 'desc';

    items.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'borrowCount':
          comparison = (a.borrowCount || 0) - (b.borrowCount || 0);
          break;
        case 'deposit':
          comparison = a.deposit - b.deposit;
          break;
        case 'viewCount':
          comparison = a.viewCount - b.viewCount;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const total = items.length;
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 10;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = items.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  public create(itemData: Omit<Item, 'id' | 'createdAt' | 'viewCount' | 'status' | 'borrowCount' | 'donateCount' | 'minCreditLevel' | 'isDonation'> & { minCreditLevel?: string; isDonation?: boolean }): Item {
    const item: Item = {
      id: generateId(),
      ...itemData,
      minCreditLevel: itemData.minCreditLevel || 'B',
      isDonation: itemData.isDonation || false,
      status: 'available',
      viewCount: 0,
      borrowCount: 0,
      donateCount: 0,
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

  public incrementBorrowCount(id: string): void {
    const item = this.findById(id);
    if (item) {
      this.update(id, { borrowCount: (item.borrowCount || 0) + 1 });
    }
  }

  public incrementDonateCount(id: string): void {
    const item = this.findById(id);
    if (item) {
      this.update(id, { donateCount: (item.donateCount || 0) + 1 });
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
