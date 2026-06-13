import { db } from '../utils/db';
import { Review, ReviewWithUser, ReviewReply, ReviewReplyWithUser } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';
import { userRepository } from './UserRepository';

export class ReviewRepository {
  private collection = 'reviews';
  private replyCollection = 'review_replies';

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

  public findRepliesByReviewId(reviewId: string): ReviewReply[] {
    return db.findMany<ReviewReply>(this.replyCollection, (reply) => reply.reviewId === reviewId);
  }

  public findReplyById(id: string): ReviewReply | undefined {
    return db.getById<ReviewReply>(this.replyCollection, id);
  }

  public createReply(replyData: Omit<ReviewReply, 'id' | 'createdAt'>): ReviewReply {
    const reply: ReviewReply = {
      id: generateId(),
      ...replyData,
      createdAt: getCurrentTime(),
    };
    return db.insert<ReviewReply>(this.replyCollection, reply);
  }

  public toReviewReplyWithUser(reply: ReviewReply): ReviewReplyWithUser {
    const replier = userRepository.findById(reply.replierId);
    return {
      ...reply,
      replier: replier ? userRepository.toPublicUser(replier) : {} as any,
    };
  }

  public toReviewWithUser(review: Review): ReviewWithUser {
    const reviewer = userRepository.findById(review.reviewerId);
    const reviewee = userRepository.findById(review.revieweeId);
    const replies = this.findRepliesByReviewId(review.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map(reply => this.toReviewReplyWithUser(reply));

    return {
      ...review,
      reviewer: reviewer ? userRepository.toPublicUser(reviewer) : {} as any,
      reviewee: reviewee ? userRepository.toPublicUser(reviewee) : {} as any,
      replies,
    };
  }
}

export const reviewRepository = new ReviewRepository();
