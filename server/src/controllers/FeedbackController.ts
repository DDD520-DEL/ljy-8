import { Request, Response } from 'express';
import { feedbackService } from '../services/FeedbackService';
import { AuthRequest } from '../utils/auth';
import { FeedbackType, FeedbackStatus, FeedbackFilterParams } from '../types';

export class FeedbackController {
  public async getMyFeedbacks(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { type, status, keyword } = req.query;
      const feedbacks = feedbackService.getMyFeedbacks(req.user.id, {
        type: type as FeedbackType | undefined,
        status: status as FeedbackStatus | undefined,
        keyword: keyword as string | undefined,
      });

      res.json({ success: true, data: feedbacks });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getAllFeedbacks(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type, status, keyword, page, pageSize } = req.query;

      const params: FeedbackFilterParams = {
        type: type as FeedbackType | undefined,
        status: status as FeedbackStatus | undefined,
        keyword: keyword as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
      };

      const result = feedbackService.getAllFeedbacks(params);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getFeedbackById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.role === 'admin' ? undefined : req.user?.id;
      const feedback = feedbackService.getFeedbackById(id, userId);

      if (!feedback) {
        res.status(404).json({ success: false, message: '反馈不存在或无权查看' });
        return;
      }

      res.json({ success: true, data: feedback });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async createFeedback(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { type, title, description, images, contact } = req.body;

      if (!type || !['suggestion', 'bug', 'experience'].includes(type)) {
        res.status(400).json({ success: false, message: '请选择有效的反馈类型' });
        return;
      }

      const feedback = feedbackService.createFeedback(req.user.id, {
        type,
        title,
        description,
        images,
        contact,
      });

      res.status(201).json({ success: true, data: feedback });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async updateFeedbackStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { id } = req.params;
      const { status, adminReply } = req.body;

      if (!status || !['pending', 'processing', 'resolved', 'rejected'].includes(status)) {
        res.status(400).json({ success: false, message: '请选择有效的状态' });
        return;
      }

      const feedback = feedbackService.updateFeedbackStatus(
        id,
        req.user.id,
        status as FeedbackStatus,
        adminReply
      );

      if (!feedback) {
        res.status(404).json({ success: false, message: '反馈不存在' });
        return;
      }

      res.json({ success: true, data: feedback });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = feedbackService.getStatistics();
      res.json({ success: true, data: stats });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const feedbackController = new FeedbackController();
