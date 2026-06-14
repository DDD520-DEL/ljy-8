import { Response } from 'express';
import { favoriteFolderService } from '../services/FavoriteFolderService';
import { AuthRequest } from '../utils/auth';

export class FavoriteFolderController {
  async getFolders(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      res.json({
        success: true,
        data: favoriteFolderService.getFoldersByUserId(req.user.id),
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getFolder(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const folder = favoriteFolderService.getFolderById(req.user.id, req.params.folderId);
      if (!folder) {
        res.status(404).json({ success: false, message: '收藏夹不存在' });
        return;
      }
      res.json({ success: true, data: folder });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async createFolder(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { name, description, icon } = req.body;
      res.status(201).json({
        success: true,
        data: favoriteFolderService.createFolder(req.user.id, name, description, icon),
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async updateFolder(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { name, description, icon } = req.body;
      const folder = favoriteFolderService.updateFolder(req.user.id, req.params.folderId, {
        name,
        description,
        icon,
      });
      if (!folder) {
        res.status(404).json({ success: false, message: '收藏夹不存在' });
        return;
      }
      res.json({ success: true, data: folder });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async deleteFolder(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const result = favoriteFolderService.deleteFolder(req.user.id, req.params.folderId);
      if (!result) {
        res.status(404).json({ success: false, message: '收藏夹不存在' });
        return;
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getFolderItems(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      res.json({
        success: true,
        data: favoriteFolderService.getFolderItems(req.user.id, req.params.folderId),
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async addToFolder(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { targetId, targetType } = req.body;
      res.status(201).json({
        success: true,
        data: favoriteFolderService.addToFolder(
          req.user.id,
          req.params.folderId,
          targetId,
          targetType,
        ),
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async removeFromFolder(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      favoriteFolderService.removeFromFolder(
        req.user.id,
        req.params.folderId,
        req.params.favoriteId,
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async batchRemoveFromFolder(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { favoriteIds } = req.body;
      if (!Array.isArray(favoriteIds) || favoriteIds.length === 0) {
        res.status(400).json({ success: false, message: '请选择要移除的收藏项' });
        return;
      }
      const result = favoriteFolderService.batchRemoveFromFolder(
        req.user.id,
        req.params.folderId,
        favoriteIds,
      );
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async checkFavoriteStatus(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { targetId, targetType } = req.query;
      res.json({
        success: true,
        data: favoriteFolderService.checkFavoriteStatus(
          req.user.id,
          targetId as string,
          targetType as 'item' | 'skill',
        ),
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const favoriteFolderController = new FavoriteFolderController();
