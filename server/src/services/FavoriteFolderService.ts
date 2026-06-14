import { favoriteFolderRepository } from '../repositories/FavoriteFolderRepository';
import { favoriteRepository } from '../repositories/FavoriteRepository';
import { itemRepository } from '../repositories/ItemRepository';
import { skillRepository } from '../repositories/SkillRepository';
import {
  FavoriteFolder,
  FavoriteItemWithDetail,
  FavoriteTargetType,
} from '../types';

export class FavoriteFolderService {
  public getFoldersByUserId(userId: string): FavoriteFolder[] {
    return favoriteFolderRepository.findByUserId(userId);
  }

  public getFolderById(userId: string, folderId: string): FavoriteFolder | undefined {
    const folder = favoriteFolderRepository.findById(folderId);
    if (!folder || folder.userId !== userId) return undefined;
    return folder;
  }

  public createFolder(
    userId: string,
    name: string,
    description?: string,
    icon?: string,
  ): FavoriteFolder {
    if (!name || name.trim().length === 0) {
      throw new Error('收藏夹名称不能为空');
    }
    const existing = favoriteFolderRepository.findByUserAndName(userId, name.trim());
    if (existing) {
      throw new Error('收藏夹名称已存在');
    }
    return favoriteFolderRepository.create(userId, name.trim(), description, icon);
  }

  public updateFolder(
    userId: string,
    folderId: string,
    updates: { name?: string; description?: string; icon?: string },
  ): FavoriteFolder | undefined {
    const folder = favoriteFolderRepository.findById(folderId);
    if (!folder || folder.userId !== userId) {
      return undefined;
    }
    if (updates.name && updates.name.trim().length === 0) {
      throw new Error('收藏夹名称不能为空');
    }
    if (updates.name && updates.name.trim() !== folder.name) {
      const existing = favoriteFolderRepository.findByUserAndName(userId, updates.name.trim());
      if (existing) {
        throw new Error('收藏夹名称已存在');
      }
      updates.name = updates.name.trim();
    }
    return favoriteFolderRepository.update(folderId, updates);
  }

  public deleteFolder(userId: string, folderId: string): boolean {
    const folder = favoriteFolderRepository.findById(folderId);
    if (!folder || folder.userId !== userId) {
      return false;
    }
    favoriteRepository.deleteByFolderId(folderId);
    return favoriteFolderRepository.delete(folderId);
  }

  public getFolderItems(
    userId: string,
    folderId: string,
  ): FavoriteItemWithDetail[] {
    const folder = favoriteFolderRepository.findById(folderId);
    if (!folder || folder.userId !== userId) {
      throw new Error('收藏夹不存在');
    }
    const favorites = favoriteRepository.findByUserIdAndFolderId(userId, folderId);
    return favorites
      .filter((f) => {
        if (f.targetType === 'item') {
          return !!itemRepository.findById(f.targetId);
        } else if (f.targetType === 'skill') {
          return !!skillRepository.findById(f.targetId);
        }
        return false;
      })
      .map((f) => favoriteRepository.toFavoriteWithDetail(f));
  }

  public addToFolder(
    userId: string,
    folderId: string,
    targetId: string,
    targetType: FavoriteTargetType,
  ): FavoriteItemWithDetail {
    const folder = favoriteFolderRepository.findById(folderId);
    if (!folder || folder.userId !== userId) {
      throw new Error('收藏夹不存在');
    }
    if (targetType === 'item') {
      const item = itemRepository.findById(targetId);
      if (!item) throw new Error('物品不存在');
    } else if (targetType === 'skill') {
      const skill = skillRepository.findById(targetId);
      if (!skill) throw new Error('技能不存在');
    }
    if (favoriteRepository.isFavoritedInFolder(userId, targetId, targetType, folderId)) {
      throw new Error('已在该收藏夹中');
    }
    const favorite = favoriteRepository.create(userId, targetId, targetType, folderId);
    favoriteFolderRepository.incrementItemCount(folderId, 1);
    return favoriteRepository.toFavoriteWithDetail(favorite);
  }

  public removeFromFolder(
    userId: string,
    folderId: string,
    favoriteId: string,
  ): boolean {
    const folder = favoriteFolderRepository.findById(folderId);
    if (!folder || folder.userId !== userId) {
      throw new Error('收藏夹不存在');
    }
    const favorite = favoriteRepository.findById(favoriteId);
    if (!favorite || favorite.userId !== userId || favorite.folderId !== folderId) {
      throw new Error('收藏记录不存在');
    }
    const result = favoriteRepository.delete(favoriteId);
    if (result) {
      favoriteFolderRepository.incrementItemCount(folderId, -1);
    }
    return result;
  }

  public batchRemoveFromFolder(
    userId: string,
    folderId: string,
    favoriteIds: string[],
  ): { success: number; failed: number } {
    const folder = favoriteFolderRepository.findById(folderId);
    if (!folder || folder.userId !== userId) {
      throw new Error('收藏夹不存在');
    }
    let success = 0;
    let failed = 0;
    favoriteIds.forEach((id) => {
      const favorite = favoriteRepository.findById(id);
      if (favorite && favorite.userId === userId && favorite.folderId === folderId) {
        if (favoriteRepository.delete(id)) {
          success++;
        } else {
          failed++;
        }
      } else {
        failed++;
      }
    });
    if (success > 0) {
      favoriteFolderRepository.incrementItemCount(folderId, -success);
    }
    return { success, failed };
  }

  public checkFavoriteStatus(
    userId: string,
    targetId: string,
    targetType: FavoriteTargetType,
  ): { favorited: boolean; folderIds: string[] } {
    const favorites = favoriteRepository
      .findByUserId(userId)
      .filter((f) => f.targetId === targetId && f.targetType === targetType);
    return {
      favorited: favorites.length > 0,
      folderIds: favorites.map((f) => f.folderId),
    };
  }
}

export const favoriteFolderService = new FavoriteFolderService();
