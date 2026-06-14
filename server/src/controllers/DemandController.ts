import { Request, Response } from 'express';
import { demandService } from '../services/DemandService';
import { AuthRequest } from '../utils/auth';
import {
  DemandFilterParams,
  DemandSortParams,
  DemandPaginationParams,
  CreateDemandRequest,
  UpdateDemandRequest,
  CreateDemandResponseRequest,
  AcceptDemandResponseRequest,
} from '../types';

export class DemandController {
  public async getDemands(req: Request, res: Response): Promise<void> {
    try {
      const {
        type,
        category,
        keyword,
        userNeighborhood,
        status,
        urgency,
        sortBy,
        sortOrder,
        page,
        pageSize,
      } = req.query;

      const filters: DemandFilterParams = {
        type: type as any,
        category: category as string | undefined,
        keyword: keyword as string | undefined,
        userNeighborhood: userNeighborhood as string | undefined,
        status: status as any,
        urgency: urgency as string | undefined,
      };

      const sort: DemandSortParams = {
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      };

      const pagination: DemandPaginationParams = {
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      };

      const result = demandService.getDemands(filters, sort, pagination);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getDemandById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const demand = demandService.getDemandById(id);
      if (!demand) {
        res.status(404).json({ success: false, message: '需求不存在' });
        return;
      }
      res.json({ success: true, data: demand });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getMyDemands(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const demands = demandService.getMyDemands(req.user.id);
      res.json({ success: true, data: demands });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getMyRespondedDemands(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const demands = demandService.getMyRespondedDemands(req.user.id);
      res.json({ success: true, data: demands });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getMyOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { role } = req.query;
      const roleValue = role === 'responder' ? 'responder' : 'requester';
      const orders = demandService.getMyDemandOrders(req.user.id, roleValue);
      res.json({ success: true, data: orders });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getOrderById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const order = demandService.getDemandOrderById(id);
      if (!order) {
        res.status(404).json({ success: false, message: '订单不存在' });
        return;
      }
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async createDemand(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { title, description, type, category, images, timeCoinReward, urgency, contactPhone, contactAddress, validUntil } = req.body;
      if (!title || !description || !type || !category || timeCoinReward === undefined) {
        res.status(400).json({ success: false, message: '请填写完整信息' });
        return;
      }
      const request: CreateDemandRequest = {
        title,
        description,
        type,
        category,
        images,
        timeCoinReward,
        urgency,
        contactPhone,
        contactAddress,
        validUntil,
      };
      const demand = demandService.createDemand(req.user.id, request);
      if (!demand) {
        res.status(400).json({ success: false, message: '创建需求失败' });
        return;
      }
      res.status(201).json({ success: true, data: demand });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async updateDemand(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const request: UpdateDemandRequest = req.body;
      const demand = demandService.updateDemand(req.user.id, id, request);
      if (!demand) {
        res.status(400).json({ success: false, message: '更新失败' });
        return;
      }
      res.json({ success: true, data: demand });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async cancelDemand(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const { reason } = req.body;
      const demand = demandService.cancelDemand(req.user.id, id, reason);
      if (!demand) {
        res.status(400).json({ success: false, message: '取消失败' });
        return;
      }
      res.json({ success: true, data: demand });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async createResponse(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const { message, estimatedTime, priceOffer } = req.body;
      if (!message) {
        res.status(400).json({ success: false, message: '请输入响应说明' });
        return;
      }
      const request: CreateDemandResponseRequest = {
        message,
        estimatedTime,
        priceOffer,
      };
      const demand = demandService.createResponse(req.user.id, id, request);
      if (!demand) {
        res.status(400).json({ success: false, message: '响应失败' });
        return;
      }
      res.json({ success: true, data: demand });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async withdrawResponse(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { responseId } = req.params;
      const demand = demandService.withdrawResponse(req.user.id, responseId);
      if (!demand) {
        res.status(400).json({ success: false, message: '撤销失败' });
        return;
      }
      res.json({ success: true, data: demand });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async acceptResponse(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const { responseId } = req.body as AcceptDemandResponseRequest;
      if (!responseId) {
        res.status(400).json({ success: false, message: '请选择要确认的响应' });
        return;
      }
      const order = demandService.acceptResponse(req.user.id, id, responseId);
      if (!order) {
        res.status(400).json({ success: false, message: '确认失败' });
        return;
      }
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async startOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const order = demandService.startOrder(req.user.id, id);
      if (!order) {
        res.status(400).json({ success: false, message: '操作失败' });
        return;
      }
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async completeOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const order = demandService.completeOrder(req.user.id, id);
      if (!order) {
        res.status(400).json({ success: false, message: '操作失败' });
        return;
      }
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const demandController = new DemandController();
