import { Request, Response } from 'express';
import { activityService } from '../services/ActivityService';
import { AuthRequest } from '../utils/auth';
import {
  ActivityFilterParams,
  ActivitySortParams,
  ActivityPaginationParams,
  CreateActivityRequest,
  UpdateActivityRequest,
} from '../types';

export class ActivityController {
  public async getActivities(req: Request, res: Response): Promise<void> {
    try {
      const {
        category,
        keyword,
        userNeighborhood,
        status,
        sortBy,
        sortOrder,
        page,
        pageSize,
      } = req.query;

      const filters: ActivityFilterParams = {
        category: category as any,
        keyword: keyword as string | undefined,
        userNeighborhood: userNeighborhood as string | undefined,
        status: status as any,
      };

      const sort: ActivitySortParams = {
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      };

      const pagination: ActivityPaginationParams = {
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      };

      const authReq = req as AuthRequest;
      const currentUserId = authReq.user?.id;

      const result = activityService.getActivities(filters, sort, pagination, currentUserId);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getActivityById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const authReq = req as AuthRequest;
      const currentUserId = authReq.user?.id;
      const activity = activityService.getActivityById(id, currentUserId);
      if (!activity) {
        res.status(404).json({ success: false, message: '活动不存在' });
        return;
      }
      res.json({ success: true, data: activity });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getMyOrganizedActivities(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const activities = activityService.getMyOrganizedActivities(req.user.id);
      res.json({ success: true, data: activities });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getMyRegisteredActivities(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const activities = activityService.getMyRegisteredActivities(req.user.id);
      res.json({ success: true, data: activities });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async createActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const data = req.body as CreateActivityRequest;
      const activity = activityService.createActivity(req.user.id, data);
      if (!activity) {
        res.status(400).json({ success: false, message: '创建活动失败' });
        return;
      }
      res.status(201).json({ success: true, data: activity });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async updateActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const data = req.body as UpdateActivityRequest;
      const activity = activityService.updateActivity(req.user.id, id, data);
      if (!activity) {
        res.status(400).json({ success: false, message: '更新活动失败' });
        return;
      }
      res.json({ success: true, data: activity });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async registerActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const activity = activityService.registerActivity(req.user.id, id);
      if (!activity) {
        res.status(400).json({ success: false, message: '报名失败' });
        return;
      }
      res.json({ success: true, data: activity });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async cancelRegistration(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const activity = activityService.cancelRegistration(req.user.id, id);
      if (!activity) {
        res.status(400).json({ success: false, message: '取消报名失败' });
        return;
      }
      res.json({ success: true, data: activity });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async startActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const activity = activityService.startActivity(req.user.id, id);
      if (!activity) {
        res.status(400).json({ success: false, message: '操作失败' });
        return;
      }
      res.json({ success: true, data: activity });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async completeActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const activity = activityService.completeActivity(req.user.id, id);
      if (!activity) {
        res.status(400).json({ success: false, message: '操作失败' });
        return;
      }
      res.json({ success: true, data: activity });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async cancelActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const { reason } = req.body;
      const activity = activityService.cancelActivity(req.user.id, id, reason);
      if (!activity) {
        res.status(400).json({ success: false, message: '取消活动失败' });
        return;
      }
      res.json({ success: true, data: activity });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async uploadPhoto(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const { imageUrl, description } = req.body;
      if (!imageUrl) {
        res.status(400).json({ success: false, message: '请上传图片' });
        return;
      }
      const photo = activityService.uploadPhoto(req.user.id, id, imageUrl, description);
      if (!photo) {
        res.status(400).json({ success: false, message: '上传照片失败' });
        return;
      }
      res.status(201).json({ success: true, data: photo });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async deletePhoto(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { photoId } = req.params;
      const success = activityService.deletePhoto(req.user.id, photoId);
      if (!success) {
        res.status(400).json({ success: false, message: '删除照片失败' });
        return;
      }
      res.json({ success: true, message: '删除成功' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const activityController = new ActivityController();
