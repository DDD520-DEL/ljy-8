import { Response } from 'express';
import { notificationService } from '../services/NotificationService';
import { AuthRequest } from '../utils/auth';

export class NotificationController {
  public async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const result = notificationService.getNotifications(req.user.id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const count = notificationService.getUnreadCount(req.user.id);
      res.json({ success: true, data: { count } });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const result = notificationService.markAsRead(id, req.user.id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      notificationService.markAllAsRead(req.user.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async deleteNotification(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const result = notificationService.deleteNotification(id, req.user.id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async deleteMany(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        res.status(400).json({ success: false, message: '参数错误' });
        return;
      }
      const count = notificationService.deleteMany(req.user.id, ids);
      res.json({ success: true, data: { count } });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const notificationController = new NotificationController();
