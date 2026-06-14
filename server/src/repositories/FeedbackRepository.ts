import { db } from '../utils/db';
import { Feedback, FeedbackWithUser, FeedbackFilterParams, PaginatedResult } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';
import { userRepository } from './UserRepository';

export class FeedbackRepository {
  private collection = 'feedbacks';

  public findAll(): Feedback[] {
    return db.getAll<Feedback>(this.collection);
  }

  public findById(id: string): Feedback | undefined {
    return db.getById<Feedback>(this.collection, id);
  }

  public findByUserId(userId: string): Feedback[] {
    return db.findMany<Feedback>(this.collection, (feedback) => feedback.userId === userId);
  }

  public findByFilter(params: FeedbackFilterParams): PaginatedResult<Feedback> {
    let feedbacks = this.findAll();

    if (params.type) {
      feedbacks = feedbacks.filter((f) => f.type === params.type);
    }

    if (params.status) {
      feedbacks = feedbacks.filter((f) => f.status === params.status);
    }

    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      feedbacks = feedbacks.filter(
        (f) =>
          f.title.toLowerCase().includes(keyword) ||
          f.description.toLowerCase().includes(keyword)
      );
    }

    feedbacks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const total = feedbacks.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const items = feedbacks.slice(start, start + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  public create(
    feedbackData: Omit<Feedback, 'id' | 'status' | 'createdAt' | 'updatedAt'> & {
      status?: Feedback['status'];
    }
  ): Feedback {
    const now = getCurrentTime();
    const feedback: Feedback = {
      id: generateId(),
      ...feedbackData,
      status: feedbackData.status || 'pending',
      createdAt: now,
      updatedAt: now,
    };
    return db.insert<Feedback>(this.collection, feedback);
  }

  public update(id: string, updates: Partial<Feedback>): Feedback | undefined {
    updates.updatedAt = getCurrentTime();
    if (updates.status && updates.status !== 'pending' && !updates.handledAt) {
      updates.handledAt = getCurrentTime();
    }
    return db.update<Feedback>(this.collection, id, updates);
  }

  public delete(id: string): boolean {
    return db.delete(this.collection, id);
  }

  public toFeedbackWithUser(feedback: Feedback): FeedbackWithUser {
    const user = userRepository.findById(feedback.userId);
    const handler = feedback.handledBy ? userRepository.findById(feedback.handledBy) : undefined;

    return {
      ...feedback,
      user: user ? userRepository.toPublicUser(user) : ({} as any),
      handler: handler ? userRepository.toPublicUser(handler) : undefined,
    };
  }
}

export const feedbackRepository = new FeedbackRepository();
