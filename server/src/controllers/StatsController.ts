import { Request, Response } from 'express';
import { statsService } from '../services/StatsService';
import { AuthRequest } from '../utils/auth';
import { LeaderboardType, LeaderboardPeriod } from '../types';

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

  public async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const { type, period } = req.query;

      const validTypes: LeaderboardType[] = ['timeCoin', 'credit', 'sharing'];
      const validPeriods: LeaderboardPeriod[] = ['all', 'month'];

      if (!type || !validTypes.includes(type as LeaderboardType)) {
        res.status(400).json({ success: false, message: '无效的排行榜类型' });
        return;
      }

      if (!period || !validPeriods.includes(period as LeaderboardPeriod)) {
        res.status(400).json({ success: false, message: '无效的时间范围' });
        return;
      }

      const result = statsService.getLeaderboard(
        type as LeaderboardType,
        period as LeaderboardPeriod
      );
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const statsController = new StatsController();
