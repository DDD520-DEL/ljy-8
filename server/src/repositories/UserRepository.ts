import { db } from '../utils/db';
import { User, PublicUser } from '../types';
import { generateId, getCurrentTime, getCreditLevel } from '../utils/helpers';
import * as bcrypt from 'bcryptjs';

export class UserRepository {
  private collection = 'users';

  public findAll(): User[] {
    return db.getAll<User>(this.collection);
  }

  public findByNeighborhood(neighborhood: string, excludeUserId?: string): User[] {
    let users = db.findMany<User>(this.collection, (user) => user.neighborhood === neighborhood);
    if (excludeUserId) {
      users = users.filter((user) => user.id !== excludeUserId);
    }
    return users.sort((a, b) => b.creditScore - a.creditScore);
  }

  public findById(id: string): User | undefined {
    return db.getById<User>(this.collection, id);
  }

  public findByPhone(phone: string): User | undefined {
    return db.findOne<User>(this.collection, (user) => user.phone === phone);
  }

  public findByEmail(email: string): User | undefined {
    return db.findOne<User>(this.collection, (user) => user.email === email);
  }

  public create(userData: Omit<User, 'id' | 'createdAt' | 'creditScore' | 'creditLevel' | 'role' | 'avatar' | 'timeCoins'>): User {
    const hashedPassword = bcrypt.hashSync(userData.password, 10);
    const user: User = {
      id: generateId(),
      ...userData,
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.nickname}`,
      creditScore: 80,
      creditLevel: getCreditLevel(80),
      timeCoins: 10,
      role: 'user',
      createdAt: getCurrentTime(),
    };
    return db.insert<User>(this.collection, user);
  }

  public update(id: string, updates: Partial<User>): User | undefined {
    if (updates.password) {
      updates.password = bcrypt.hashSync(updates.password, 10);
    }
    if (updates.creditScore) {
      updates.creditLevel = getCreditLevel(updates.creditScore);
    }
    return db.update<User>(this.collection, id, updates);
  }

  public toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      creditScore: user.creditScore,
      creditLevel: user.creditLevel,
      neighborhood: user.neighborhood,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  public toPublicUserWithCoins(user: User): PublicUser {
    return {
      ...this.toPublicUser(user),
      timeCoins: user.timeCoins,
    };
  }
}

export const userRepository = new UserRepository();
