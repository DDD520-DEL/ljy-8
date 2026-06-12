import { reviewRepository } from '../repositories/ReviewRepository';
import { Review, ReviewWithUser } from '../types';
import { creditService } from './CreditService';

export class ReviewService {
  public getReviewsByUser(userId: string): ReviewWithUser[] {
    const reviews = reviewRepository.findByRevieweeId(userId);
    return reviews.map(review => reviewRepository.toReviewWithUser(review));
  }

  public getReviewByOrderId(orderId: string, orderType?: string): ReviewWithUser[] {
    let reviews = reviewRepository.findByOrderId(orderId);
    if (orderType) {
      reviews = reviews.filter(r => r.orderType === orderType);
    }
    return reviews.map(review => reviewRepository.toReviewWithUser(review));
  }

  public createReview(
    reviewerId: string,
    reviewData: Omit<Review, 'id' | 'reviewerId' | 'createdAt'>
  ): ReviewWithUser | null {
    const existingReview = reviewRepository
      .findByOrderId(reviewData.orderId)
      .find(r => r.reviewerId === reviewerId);
    
    if (existingReview) {
      throw new Error('已评价过该订单');
    }

    const review = reviewRepository.create({
      ...reviewData,
      reviewerId,
    });

    creditService.updateCreditScore(reviewData.revieweeId, reviewData.rating);

    return reviewRepository.toReviewWithUser(review);
  }
}

export const reviewService = new ReviewService();
