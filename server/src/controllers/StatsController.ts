import { Request, Response } from 'express';
import { statsService } from '../services/StatsService';
import { AuthRequest } from '../utils/auth';

export class StatsController {
  public async getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      if (req.user.role !== 'admin') {
        res.status(403).json({ success: false, message: '无权限访问' });
        return;
      }
      const stats = statsService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const statsController = new StatsController();
