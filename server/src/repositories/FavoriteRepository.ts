import { db } from '../utils/db';
import { FavoriteItem, FavoriteItemWithDetail, FavoriteTargetType } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';
import { itemRepository } from './ItemRepository';
import { skillRepository } from './SkillRepository';

export class FavoriteRepository {
  private collection = 'favorites';

  public findAll(): FavoriteItem[] {
    return db.getAll<FavoriteItem>(this.collection);
  }

  public findById(id: string): FavoriteItem | undefined {
    return db.getById<FavoriteItem>(this.collection, id);
  }

  public findByUserId(userId: string): FavoriteItem[] {
    return db
      .findMany<FavoriteItem>(this.collection, (f) => f.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public findByUserIdAndFolderId(userId: string, folderId: string): FavoriteItem[] {
    return db
      .findMany<FavoriteItem>(this.collection, (f) => f.userId === userId && f.folderId === folderId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public findByUserAndTarget(
    userId: string,
    targetId: string,
    targetType: FavoriteTargetType,
  ): FavoriteItem | undefined {
    return db.findOne<FavoriteItem>(
      this.collection,
      (f) => f.userId === userId && f.targetId === targetId && f.targetType === targetType,
    );
  }

  public findByUserTargetAndFolder(
    userId: string,
    targetId: string,
    targetType: FavoriteTargetType,
    folderId: string,
  ): FavoriteItem | undefined {
    return db.findOne<FavoriteItem>(
      this.collection,
      (f) =>
        f.userId === userId &&
        f.targetId === targetId &&
        f.targetType === targetType &&
        f.folderId === folderId,
    );
  }

  public isFavorited(userId: string, targetId: string, targetType: FavoriteTargetType): boolean {
    return !!this.findByUserAndTarget(userId, targetId, targetType);
  }

  public isFavoritedInFolder(
    userId: string,
    targetId: string,
    targetType: FavoriteTargetType,
    folderId: string,
  ): boolean {
    return !!this.findByUserTargetAndFolder(userId, targetId, targetType, folderId);
  }

  public countByTargetId(targetId: string, targetType: FavoriteTargetType): number {
    return db.findMany<FavoriteItem>(
      this.collection,
      (f) => f.targetId === targetId && f.targetType === targetType,
    ).length;
  }

  public countByFolderId(folderId: string): number {
    return db.findMany<FavoriteItem>(this.collection, (f) => f.folderId === folderId).length;
  }

  public create(
    userId: string,
    targetId: string,
    targetType: FavoriteTargetType,
    folderId: string,
  ): FavoriteItem {
    const favorite: FavoriteItem = {
      id: generateId(),
      userId,
      folderId,
      targetId,
      targetType,
      createdAt: getCurrentTime(),
    };
    return db.insert<FavoriteItem>(this.collection, favorite);
  }

  public delete(id: string): boolean {
    return db.delete(this.collection, id);
  }

  public deleteByUserAndTarget(
    userId: string,
    targetId: string,
    targetType: FavoriteTargetType,
  ): boolean {
    const favorite = this.findByUserAndTarget(userId, targetId, targetType);
    if (!favorite) return false;
    return this.delete(favorite.id);
  }

  public deleteByFolderId(folderId: string): number {
    const items = db.findMany<FavoriteItem>(this.collection, (f) => f.folderId === folderId);
    let count = 0;
    items.forEach((item) => {
      if (this.delete(item.id)) count++;
    });
    return count;
  }

  public batchDelete(ids: string[]): number {
    let count = 0;
    ids.forEach((id) => {
      if (this.delete(id)) count++;
    });
    return count;
  }

  public toFavoriteWithDetail(favorite: FavoriteItem): FavoriteItemWithDetail {
    const result: FavoriteItemWithDetail = { ...favorite };
    if (favorite.targetType === 'item') {
      const item = itemRepository.findById(favorite.targetId);
      if (item) {
        result.item = itemRepository.toItemWithOwner(item);
      }
    } else if (favorite.targetType === 'skill') {
      const skill = skillRepository.findById(favorite.targetId);
      if (skill) {
        result.skill = skillRepository.toSkillWithProvider(skill);
      }
    }
    return result;
  }
}

export const favoriteRepository = new FavoriteRepository();
