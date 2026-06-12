import { Request, Response } from 'express';
import { reviewService } from '../services/ReviewService';
import { AuthRequest } from '../utils/auth';

export class ReviewController {
  public async getReviewsByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const reviews = reviewService.getReviewsByUser(userId);
      res.json({ success: true, data: reviews });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getReviewsByOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, orderType } = req.query;
      const reviews = reviewService.getReviewByOrderId(
        orderId as string,
        orderType as string | undefined
      );
      res.json({ success: true, data: reviews });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async createReview(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const review = reviewService.createReview(req.user.id, req.body);
      res.status(201).json({ success: true, data: review });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const reviewController = new ReviewController();
