import { reviewRepository } from '../repositories/ReviewRepository';
import { userRepository } from '../repositories/UserRepository';
import { orderRepository } from '../repositories/OrderRepository';
import { Review, ReviewWithUser, ReviewReplyWithUser } from '../types';
import { creditService } from './CreditService';
import { notificationService } from './NotificationService';

export class ReviewService {
  public getReviewsByUser(userId: string): ReviewWithUser[] {
    const reviews = reviewRepository.findByRevieweeId(userId);
    return reviews
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(review => reviewRepository.toReviewWithUser(review));
  }

  public getReviewsByReviewer(userId: string): ReviewWithUser[] {
    const reviews = reviewRepository.findByReviewerId(userId);
    return reviews
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(review => reviewRepository.toReviewWithUser(review));
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

    if (reviewerId === reviewData.revieweeId) {
      throw new Error('不能评价自己');
    }

    const order = reviewData.orderType === 'borrow'
      ? orderRepository.findBorrowOrderById(reviewData.orderId)
      : orderRepository.findServiceOrderById(reviewData.orderId);

    if (!order) {
      throw new Error('订单不存在');
    }

    const isParticipant = reviewData.orderType === 'borrow'
      ? (order as any).borrowerId === reviewerId || (order as any).lenderId === reviewerId
      : (order as any).clientId === reviewerId || (order as any).providerId === reviewerId;

    if (!isParticipant) {
      throw new Error('您不是该订单的参与者');
    }

    const orderStatus = reviewData.orderType === 'borrow'
      ? (order as any).status
      : (order as any).status;

    const canReviewStatus = reviewData.orderType === 'borrow'
      ? ['returned']
      : ['completed'];

    if (!canReviewStatus.includes(orderStatus)) {
      throw new Error('订单未完成，暂时无法评价');
    }

    if (reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error('评分必须在1-5星之间');
    }

    if (!reviewData.content || reviewData.content.trim().length === 0) {
      throw new Error('评价内容不能为空');
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

  public createReply(
    replierId: string,
    reviewId: string,
    content: string
  ): ReviewReplyWithUser | null {
    const review = reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('评价不存在');
    }

    if (replierId !== review.revieweeId && replierId !== review.reviewerId) {
      throw new Error('只有评价相关方可以回复');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('回复内容不能为空');
    }

    const reply = reviewRepository.createReply({
      reviewId,
      replierId,
      content: content.trim(),
    });

    const replier = userRepository.findById(replierId);
    const notifyUserId = replierId === review.revieweeId ? review.reviewerId : review.revieweeId;

    let orderTitle = '';
    if (review.orderType === 'borrow') {
      const order = orderRepository.findBorrowOrderById(review.orderId);
      if (order) {
        const item = orderRepository.toBorrowOrderWithDetails(order).item;
        orderTitle = item?.title || '';
      }
    } else {
      const order = orderRepository.findServiceOrderById(review.orderId);
      if (order) {
        const skill = orderRepository.toServiceOrderWithDetails(order).skill;
        orderTitle = skill?.title || '';
      }
    }

    notificationService.sendReviewReplyNotification(
      notifyUserId,
      replier?.nickname || '匿名用户',
      orderTitle
    );

    return reviewRepository.toReviewReplyWithUser(reply);
  }

  public getReviewReplies(reviewId: string): ReviewReplyWithUser[] {
    return reviewRepository
      .findRepliesByReviewId(reviewId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map(reply => reviewRepository.toReviewReplyWithUser(reply));
  }
}

export const reviewService = new ReviewService();
