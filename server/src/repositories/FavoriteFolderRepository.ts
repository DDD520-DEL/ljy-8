import { db } from '../utils/db';
import { FavoriteFolder } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';

export class FavoriteFolderRepository {
  private collection = 'favoriteFolders';

  public findAll(): FavoriteFolder[] {
    return db.getAll<FavoriteFolder>(this.collection);
  }

  public findById(id: string): FavoriteFolder | undefined {
    return db.getById<FavoriteFolder>(this.collection, id);
  }

  public findByUserId(userId: string): FavoriteFolder[] {
    return db
      .findMany<FavoriteFolder>(this.collection, (f) => f.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public findByUserAndName(userId: string, name: string): FavoriteFolder | undefined {
    return db.findOne<FavoriteFolder>(this.collection, (f) => f.userId === userId && f.name === name);
  }

  public create(
    userId: string,
    name: string,
    description?: string,
    icon?: string,
  ): FavoriteFolder {
    const now = getCurrentTime();
    const folder: FavoriteFolder = {
      id: generateId(),
      userId,
      name,
      description,
      icon,
      itemCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    return db.insert<FavoriteFolder>(this.collection, folder);
  }

  public update(id: string, updates: Partial<FavoriteFolder>): FavoriteFolder | undefined {
    return db.update<FavoriteFolder>(this.collection, id, {
      ...updates,
      updatedAt: getCurrentTime(),
    });
  }

  public incrementItemCount(id: string, increment: number = 1): FavoriteFolder | undefined {
    const folder = this.findById(id);
    if (!folder) return undefined;
    return this.update(id, { itemCount: Math.max(0, folder.itemCount + increment) });
  }

  public delete(id: string): boolean {
    return db.delete(this.collection, id);
  }
}

export const favoriteFolderRepository = new FavoriteFolderRepository();
