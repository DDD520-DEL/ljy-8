import { db } from '../utils/db';
import { UserVerification, UserVerificationWithUser, VerificationStatus, VerificationPaginationParams, PaginatedResult } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';
import { userRepository } from './UserRepository';

export class UserVerificationRepository {
  private collection = 'userVerifications';

  public findAll(): UserVerification[] {
    return db.getAll<UserVerification>(this.collection);
  }

  public findById(id: string): UserVerification | undefined {
    return db.getById<UserVerification>(this.collection, id);
  }

  public findByUserId(userId: string): UserVerification | undefined {
    const verifications = db.findMany<UserVerification>(this.collection, (v) => v.userId === userId);
    if (verifications.length === 0) return undefined;

    const pending = verifications.find((v) => v.status === 'pending');
    if (pending) return pending;

    verifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return verifications[0];
  }

  public findPendingByUserId(userId: string): UserVerification | undefined {
    return db.findOne<UserVerification>(
      this.collection,
      (v) => v.userId === userId && v.status === 'pending'
    );
  }

  public findWithFilters(
    filters: { status?: VerificationStatus },
    pagination: VerificationPaginationParams
  ): PaginatedResult<UserVerification> {
    let verifications = this.findAll();

    if (filters.status) {
      verifications = verifications.filter((v) => v.status === filters.status);
    }

    verifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = verifications.length;
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 10;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = verifications.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  public create(data: Omit<UserVerification, 'id' | 'createdAt' | 'status'>): UserVerification {
    const verification: UserVerification = {
      id: generateId(),
      ...data,
      status: 'pending',
      createdAt: getCurrentTime(),
    };
    return db.insert<UserVerification>(this.collection, verification);
  }

  public update(id: string, updates: Partial<UserVerification>): UserVerification | undefined {
    return db.update<UserVerification>(this.collection, id, updates);
  }

  public toVerificationWithUser(verification: UserVerification): UserVerificationWithUser {
    const user = userRepository.findById(verification.userId);
    return {
      ...verification,
      user: user ? userRepository.toPublicUser(user) : {} as any,
    };
  }
}

export const userVerificationRepository = new UserVerificationRepository();
