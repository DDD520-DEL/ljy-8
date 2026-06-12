import { db } from '../utils/db';
import { Review, ReviewWithUser } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';
import { userRepository } from './UserRepository';

export class ReviewRepository {
  private collection = 'reviews';

  public findAll(): Review[] {
    return db.getAll<Review>(this.collection);
  }

  public findById(id: string): Review | undefined {
    return db.getById<Review>(this.collection, id);
  }

  public findByRevieweeId(revieweeId: string): Review[] {
    return db.findMany<Review>(this.collection, (review) => review.revieweeId === revieweeId);
  }

  public findByReviewerId(reviewerId: string): Review[] {
    return db.findMany<Review>(this.collection, (review) => review.reviewerId === reviewerId);
  }

  public findByOrderId(orderId: string): Review[] {
    return db.findMany<Review>(this.collection, (review) => review.orderId === orderId);
  }

  public create(reviewData: Omit<Review, 'id' | 'createdAt'>): Review {
    const review: Review = {
      id: generateId(),
      ...reviewData,
      createdAt: getCurrentTime(),
    };
    return db.insert<Review>(this.collection, review);
  }

  public toReviewWithUser(review: Review): ReviewWithUser {
    const reviewer = userRepository.findById(review.reviewerId);
    const reviewee = userRepository.findById(review.revieweeId);
    
    return {
      ...review,
      reviewer: reviewer ? userRepository.toPublicUser(reviewer) : {} as any,
      reviewee: reviewee ? userRepository.toPublicUser(reviewee) : {} as any,
    };
  }
}

export const reviewRepository = new ReviewRepository();
