import { db } from '../utils/db';
import { FavoriteItem, FavoriteItemWithDetail } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';
import { itemRepository } from './ItemRepository';

export class FavoriteRepository {
  private collection = 'favorites';
  public findAll(): FavoriteItem[] { return db.getAll<FavoriteItem>(this.collection); }
  public findById(id: string): FavoriteItem | undefined { return db.getById<FavoriteItem>(this.collection, id); }
  public findByUserId(userId: string): FavoriteItem[] { return db.findMany<FavoriteItem>(this.collection, (f) => f.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }
  public findByUserAndItem(userId: string, itemId: string): FavoriteItem | undefined { return db.findOne<FavoriteItem>(this.collection, (f) => f.userId === userId && f.itemId === itemId); }
  public isFavorited(userId: string, itemId: string): boolean { return !!this.findByUserAndItem(userId, itemId); }
  public countByItemId(itemId: string): number { return db.findMany<FavoriteItem>(this.collection, (f) => f.itemId === itemId).length; }
  public create(userId: string, itemId: string): FavoriteItem { const favorite: FavoriteItem = { id: generateId(), userId, itemId, createdAt: getCurrentTime() }; return db.insert<FavoriteItem>(this.collection, favorite); }
  public delete(id: string): boolean { return db.delete(this.collection, id); }
  public deleteByUserAndItem(userId: string, itemId: string): boolean { const favorite = this.findByUserAndItem(userId, itemId); if (!favorite) return false; return this.delete(favorite.id); }
  public toFavoriteWithDetail(favorite: FavoriteItem): FavoriteItemWithDetail { const item = itemRepository.findById(favorite.itemId); return { ...favorite, item: item ? itemRepository.toItemWithOwner(item) : {} as any }; }
}
export const favoriteRepository = new FavoriteRepository();
