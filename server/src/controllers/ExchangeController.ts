import { Request, Response } from 'express';
import { exchangeService } from '../services/ExchangeService';
import { AuthRequest } from '../utils/auth';
import { ExchangeItemCategory } from '../types';

export class ExchangeController {
  public async getExchangeItems(req: Request, res: Response): Promise<void> {
    try {
      const { category, keyword } = req.query;
      const items = exchangeService.getExchangeItems(
        (category as ExchangeItemCategory | 'all') || 'all',
        keyword as string | undefined
      );
      res.json({ success: true, data: items });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getAllExchangeItems(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ success: false, message: '需要管理员权限' });
        return;
      }
      const items = exchangeService.getAllExchangeItems();
      res.json({ success: true, data: items });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getExchangeItemById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = exchangeService.getExchangeItemById(id);
      if (!item) {
        res.status(404).json({ success: false, message: '兑换商品不存在' });
        return;
      }
      res.json({ success: true, data: item });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async createExchangeItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ success: false, message: '需要管理员权限' });
        return;
      }
      const item = exchangeService.createExchangeItem(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async updateExchangeItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ success: false, message: '需要管理员权限' });
        return;
      }
      const { id } = req.params;
      const item = exchangeService.updateExchangeItem(id, req.body);
      if (!item) {
        res.status(404).json({ success: false, message: '兑换商品不存在' });
        return;
      }
      res.json({ success: true, data: item });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async deleteExchangeItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ success: false, message: '需要管理员权限' });
        return;
      }
      const { id } = req.params;
      const result = exchangeService.deleteExchangeItem(id);
      if (!result) {
        res.status(404).json({ success: false, message: '兑换商品不存在' });
        return;
      }
      res.json({ success: true, message: '删除成功' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async restockItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ success: false, message: '需要管理员权限' });
        return;
      }
      const { id } = req.params;
      const { quantity } = req.body;
      const item = exchangeService.restockItem(id, Number(quantity));
      if (!item) {
        res.status(404).json({ success: false, message: '兑换商品不存在' });
        return;
      }
      res.json({ success: true, data: item });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async exchange(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { itemId, quantity, remark } = req.body;
      if (!itemId) {
        res.status(400).json({ success: false, message: '缺少商品ID' });
        return;
      }
      const record = exchangeService.exchange(
        req.user.id,
        itemId,
        Number(quantity) || 1,
        remark as string | undefined
      );
      res.status(201).json({ success: true, data: record });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getMyExchangeRecords(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const records = exchangeService.getMyExchangeRecords(req.user.id);
      res.json({ success: true, data: records });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getExchangeRecordDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const record = exchangeService.getExchangeRecordDetail(id);
      if (!record) {
        res.status(404).json({ success: false, message: '兑换记录不存在' });
        return;
      }
      if (record.userId !== req.user.id && req.user.role !== 'admin') {
        res.status(403).json({ success: false, message: '无权查看该记录' });
        return;
      }
      res.json({ success: true, data: record });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getAllExchangeRecords(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ success: false, message: '需要管理员权限' });
        return;
      }
      const records = exchangeService.getAllExchangeRecords();
      res.json({ success: true, data: records });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async completeExchange(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ success: false, message: '需要管理员权限' });
        return;
      }
      const { id } = req.params;
      const record = exchangeService.completeExchange(id);
      if (!record) {
        res.status(404).json({ success: false, message: '兑换记录不存在' });
        return;
      }
      res.json({ success: true, data: record });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async cancelExchange(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const record = exchangeService.getExchangeRecordById(id);
      if (!record) {
        res.status(404).json({ success: false, message: '兑换记录不存在' });
        return;
      }
      if (record.userId !== req.user.id && req.user.role !== 'admin') {
        res.status(403).json({ success: false, message: '无权操作该记录' });
        return;
      }
      const updated = exchangeService.cancelExchange(id);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getExchangeStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ success: false, message: '需要管理员权限' });
        return;
      }
      const stats = exchangeService.getExchangeStats();
      res.json({ success: true, data: stats });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const exchangeController = new ExchangeController();
