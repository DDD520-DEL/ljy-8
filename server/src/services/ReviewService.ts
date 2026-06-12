import { reviewRepository } from '../repositories/ReviewRepository';
import { userRepository } from '../repositories/UserRepository';
import { orderRepository } from '../repositories/OrderRepository';
import { Review, ReviewWithUser } from '../types';
import { creditService } from './CreditService';
import { notificationService } from './NotificationService';

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

    const reviewer = userRepository.findById(reviewerId);
    let orderTitle = '';
    if (reviewData.orderType === 'borrow') {
      const order = orderRepository.findBorrowOrderById(reviewData.orderId);
      if (order) {
        const item = orderRepository.toBorrowOrderWithDetails(order).item;
        orderTitle = item?.title || '';
      }
    } else {
      const order = orderRepository.findServiceOrderById(reviewData.orderId);
      if (order) {
        const skill = orderRepository.toServiceOrderWithDetails(order).skill;
        orderTitle = skill?.title || '';
      }
    }

    notificationService.sendNewReviewNotification(
      reviewData.revieweeId,
      reviewer?.nickname || '匿名用户',
      reviewData.rating,
      orderTitle
    );

    return reviewRepository.toReviewWithUser(review);
  }
}

export const reviewService = new ReviewService();
