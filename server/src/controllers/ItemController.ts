import { Request, Response } from 'express';
import { itemService } from '../services/ItemService';
import { AuthRequest } from '../utils/auth';
import { ItemFilterParams, ItemSortParams, ItemPaginationParams, ItemSortField, ItemSortOrder } from '../types';

export class ItemController {
  public async getItems(req: Request, res: Response): Promise<void> {
    try {
      const { category, keyword } = req.query;
      const items = itemService.getItems(
        category as string | undefined,
        keyword as string | undefined
      );
      res.json({ success: true, data: items });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async searchItems(req: Request, res: Response): Promise<void> {
    try {
      const {
        category,
        keyword,
        minDeposit,
        maxDeposit,
        minCreditLevel,
        userNeighborhood,
        status,
        sortBy,
        sortOrder,
        page,
        pageSize,
      } = req.query;

      const filters: ItemFilterParams = {
        category: category as string | undefined,
        keyword: keyword as string | undefined,
        minDeposit: minDeposit ? Number(minDeposit) : undefined,
        maxDeposit: maxDeposit ? Number(maxDeposit) : undefined,
        minCreditLevel: minCreditLevel as string | undefined,
        userNeighborhood: userNeighborhood as string | undefined,
        status: status as string | undefined,
      };

      const sort: ItemSortParams = {
        sortBy: sortBy as ItemSortField | undefined,
        sortOrder: sortOrder as ItemSortOrder | undefined,
      };

      const pagination: ItemPaginationParams = {
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      };

      const result = itemService.searchItems(filters, sort, pagination);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getItemById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = itemService.getItemById(id);
      if (!item) {
        res.status(404).json({ success: false, message: '物品不存在' });
        return;
      }
      res.json({ success: true, data: item });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async createItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const item = itemService.createItem(req.user.id, req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async updateItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const item = itemService.updateItem(id, req.user.id, req.body);
      if (!item) {
        res.status(404).json({ success: false, message: '物品不存在或无权限修改' });
        return;
      }
      res.json({ success: true, data: item });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getMyItems(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const items = itemService.getItemsByOwner(req.user.id);
      res.json({ success: true, data: items });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const itemController = new ItemController();
