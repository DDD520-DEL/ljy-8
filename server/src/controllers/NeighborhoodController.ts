import { Request, Response } from 'express';
import { neighborhoodService } from '../services/NeighborhoodService';
import { userRepository } from '../repositories/UserRepository';
import { AuthRequest } from '../utils/auth';

export class NeighborhoodController {
  public async getMembers(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const currentUser = userRepository.findById(req.user.id);
      if (!currentUser) {
        res.status(404).json({ success: false, message: '用户不存在' });
        return;
      }
      const members = neighborhoodService.getNeighborhoodMembers(
        currentUser.neighborhood,
        req.user.id
      );
      res.json({ success: true, data: members });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getItems(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const currentUser = userRepository.findById(req.user.id);
      if (!currentUser) {
        res.status(404).json({ success: false, message: '用户不存在' });
        return;
      }
      const { category, keyword } = req.query;
      const items = neighborhoodService.getNeighborhoodItems(
        currentUser.neighborhood,
        category as string | undefined,
        keyword as string | undefined
      );
      res.json({ success: true, data: items });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getSkills(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const currentUser = userRepository.findById(req.user.id);
      if (!currentUser) {
        res.status(404).json({ success: false, message: '用户不存在' });
        return;
      }
      const { category, keyword } = req.query;
      const skills = neighborhoodService.getNeighborhoodSkills(
        currentUser.neighborhood,
        category as string | undefined,
        keyword as string | undefined
      );
      res.json({ success: true, data: skills });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const currentUser = userRepository.findById(req.user.id);
      if (!currentUser) {
        res.status(404).json({ success: false, message: '用户不存在' });
        return;
      }
      const stats = neighborhoodService.getNeighborhoodStats(currentUser.neighborhood);
      res.json({ success: true, data: { ...stats, neighborhood: currentUser.neighborhood } });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const neighborhoodController = new NeighborhoodController();
