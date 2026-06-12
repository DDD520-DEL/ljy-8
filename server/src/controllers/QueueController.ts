import { Request, Response } from 'express';
import { queueService } from '../services/QueueService';
import { AuthRequest } from '../utils/auth';

export class QueueController {
  public async joinQueue(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const result = queueService.joinQueue(req.user.id, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async cancelQueue(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const result = queueService.cancelQueue(id, req.user.id);
      if (!result) {
        res.status(404).json({ success: false, message: '排队记录不存在' });
        return;
      }
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getMyQueues(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const result = queueService.getMyQueues(req.user.id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getItemQueues(req: Request, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      const result = queueService.getItemActiveQueues(itemId);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getQueueById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = queueService.getQueueById(id);
      if (!result) {
        res.status(404).json({ success: false, message: '排队记录不存在' });
        return;
      }
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async confirmQueueBorrow(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const result = queueService.confirmQueueBorrow(id, req.user.id, req.body);
      if (!result) {
        res.status(404).json({ success: false, message: '排队记录不存在' });
        return;
      }
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const result = queueService.getNotifications(req.user.id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getUnreadNotificationCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const count = queueService.getUnreadNotificationsCount(req.user.id);
      res.json({ success: true, data: { count } });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async markNotificationAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const result = queueService.markNotificationAsRead(id, req.user.id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async markAllNotificationsAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      queueService.markAllNotificationsAsRead(req.user.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const queueController = new QueueController();
