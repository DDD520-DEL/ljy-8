import { favoriteRepository } from '../repositories/FavoriteRepository';
import { itemRepository } from '../repositories/ItemRepository';
import { FavoriteItem, FavoriteItemWithDetail } from '../types';

export class FavoriteService {
  public getFavorites(userId: string): FavoriteItemWithDetail[] {
    const favorites = favoriteRepository.findByUserId(userId);
    return favorites.filter((f) => itemRepository.findById(f.itemId)).map((f) => favoriteRepository.toFavoriteWithDetail(f));
  }
  public isFavorited(userId: string, itemId: string): boolean { return favoriteRepository.isFavorited(userId, itemId); }
  public addFavorite(userId: string, itemId: string): FavoriteItem {
    const item = itemRepository.findById(itemId);
    if (!item) throw new Error('物品不存在');
    if (favoriteRepository.isFavorited(userId, itemId)) throw new Error('已收藏该物品');
    return favoriteRepository.create(userId, itemId);
  }
  public removeFavorite(userId: string, itemId: string): boolean {
    if (!favoriteRepository.isFavorited(userId, itemId)) throw new Error('未收藏该物品');
    return favoriteRepository.deleteByUserAndItem(userId, itemId);
  }
  public toggleFavorite(userId: string, itemId: string): { favorited: boolean } {
    if (favoriteRepository.isFavorited(userId, itemId)) { favoriteRepository.deleteByUserAndItem(userId, itemId); return { favorited: false }; }
    const item = itemRepository.findById(itemId);
    if (!item) throw new Error('物品不存在');
    favoriteRepository.create(userId, itemId);
    return { favorited: true };
  }
  public getItemFavoriteCount(itemId: string): number { return favoriteRepository.countByItemId(itemId); }
}
export const favoriteService = new FavoriteService();
