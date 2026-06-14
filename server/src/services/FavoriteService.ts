import { favoriteRepository } from '../repositories/FavoriteRepository';
import { favoriteFolderRepository } from '../repositories/FavoriteFolderRepository';
import { itemRepository } from '../repositories/ItemRepository';
import { FavoriteItem, FavoriteItemWithDetail, FavoriteTargetType } from '../types';

const DEFAULT_FOLDER_NAME = '默认收藏夹';

export class FavoriteService {
  private getOrCreateDefaultFolder(userId: string) {
    let folder = favoriteFolderRepository.findByUserAndName(userId, DEFAULT_FOLDER_NAME);
    if (!folder) {
      folder = favoriteFolderRepository.create(userId, DEFAULT_FOLDER_NAME, '系统默认收藏夹');
    }
    return folder;
  }

  public getFavorites(userId: string): FavoriteItemWithDetail[] {
    const favorites = favoriteRepository.findByUserId(userId);
    return favorites
      .filter((f) => {
        if (f.targetType === 'item') {
          return !!itemRepository.findById(f.targetId);
        }
        return true;
      })
      .map((f) => favoriteRepository.toFavoriteWithDetail(f));
  }

  public isFavorited(userId: string, itemId: string): boolean {
    return favoriteRepository.isFavorited(userId, itemId, 'item');
  }

  public addFavorite(userId: string, itemId: string): FavoriteItem {
    const item = itemRepository.findById(itemId);
    if (!item) throw new Error('物品不存在');
    const defaultFolder = this.getOrCreateDefaultFolder(userId);
    if (favoriteRepository.isFavoritedInFolder(userId, itemId, 'item', defaultFolder.id)) {
      throw new Error('已收藏该物品');
    }
    const favorite = favoriteRepository.create(userId, itemId, 'item', defaultFolder.id);
    favoriteFolderRepository.incrementItemCount(defaultFolder.id, 1);
    return favorite;
  }

  public removeFavorite(userId: string, itemId: string): boolean {
    const defaultFolder = favoriteFolderRepository.findByUserAndName(userId, DEFAULT_FOLDER_NAME);
    if (!defaultFolder) return false;
    const favorite = favoriteRepository.findByUserTargetAndFolder(userId, itemId, 'item', defaultFolder.id);
    if (!favorite) throw new Error('未收藏该物品');
    const result = favoriteRepository.delete(favorite.id);
    if (result) {
      favoriteFolderRepository.incrementItemCount(defaultFolder.id, -1);
    }
    return result;
  }

  public toggleFavorite(userId: string, itemId: string): { favorited: boolean } {
    const defaultFolder = this.getOrCreateDefaultFolder(userId);
    if (favoriteRepository.isFavoritedInFolder(userId, itemId, 'item', defaultFolder.id)) {
      const favorite = favoriteRepository.findByUserTargetAndFolder(userId, itemId, 'item', defaultFolder.id);
      if (favorite) {
        favoriteRepository.delete(favorite.id);
        favoriteFolderRepository.incrementItemCount(defaultFolder.id, -1);
      }
      return { favorited: false };
    }
    const item = itemRepository.findById(itemId);
    if (!item) throw new Error('物品不存在');
    favoriteRepository.create(userId, itemId, 'item', defaultFolder.id);
    favoriteFolderRepository.incrementItemCount(defaultFolder.id, 1);
    return { favorited: true };
  }

  public getItemFavoriteCount(itemId: string): number {
    return favoriteRepository.countByTargetId(itemId, 'item');
  }
}

export const favoriteService = new FavoriteService();
