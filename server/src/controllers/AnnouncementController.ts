import { Response } from 'express';
import { announcementService } from '../services/AnnouncementService';
import { AuthRequest } from '../utils/auth';
import { CreateAnnouncementRequest, UpdateAnnouncementRequest, AnnouncementPaginationParams } from '../types';

export class AnnouncementController {
  public async getAnnouncements(req: AuthRequest, res: Response): Promise<void> {
    try {
      const params: AnnouncementPaginationParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 10,
        category: req.query.category as any,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };
      const result = announcementService.getAnnouncements(params);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getLatestAnnouncements(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const result = announcementService.getLatestAnnouncements(limit);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getAnnouncementById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = announcementService.getAnnouncementById(id);
      if (!result) {
        res.status(404).json({ success: false, message: '公告不存在' });
        return;
      }
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async createAnnouncement(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const data: CreateAnnouncementRequest = req.body;
      if (!data.title || !data.content || !data.category || !data.priority) {
        res.status(400).json({ success: false, message: '参数不完整' });
        return;
      }
      const result = announcementService.createAnnouncement(req.user.id, data);
      res.json({ success: true, data: result, message: '发布成功' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async updateAnnouncement(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const data: UpdateAnnouncementRequest = req.body;
      const result = announcementService.updateAnnouncement(id, data);
      if (!result) {
        res.status(404).json({ success: false, message: '公告不存在' });
        return;
      }
      res.json({ success: true, data: result, message: '更新成功' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async deleteAnnouncement(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const success = announcementService.deleteAnnouncement(id);
      if (!success) {
        res.status(404).json({ success: false, message: '公告不存在' });
        return;
      }
      res.json({ success: true, message: '删除成功' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getAllAnnouncementsAdmin(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const params: AnnouncementPaginationParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 10,
        category: req.query.category as any,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };
      const result = announcementService.getAllAnnouncementsAdmin(params);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const announcementController = new AnnouncementController();
