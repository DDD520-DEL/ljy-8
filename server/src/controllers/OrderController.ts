import { Request, Response } from 'express';
import { orderService } from '../services/OrderService';
import { AuthRequest } from '../utils/auth';

export class OrderController {
  // Borrow Orders
  public async getBorrowOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { role = 'all' } = req.query;
      const orders = orderService.getBorrowOrders(req.user.id, role as any);
      res.json({ success: true, data: orders });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getBorrowOrderById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const order = orderService.getBorrowOrderById(id);
      if (!order) {
        res.status(404).json({ success: false, message: '订单不存在' });
        return;
      }
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async createBorrowOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const order = orderService.createBorrowOrder(req.user.id, req.body);
      res.status(201).json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async approveBorrowOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const order = orderService.approveBorrowOrder(id, req.user.id);
      if (!order) {
        res.status(404).json({ success: false, message: '订单不存在或无权限操作' });
        return;
      }
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async rejectBorrowOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const { reason } = req.body;
      const order = orderService.rejectBorrowOrder(id, req.user.id, reason);
      if (!order) {
        res.status(404).json({ success: false, message: '订单不存在或无权限操作' });
        return;
      }
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async confirmLend(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const order = orderService.confirmLend(id, req.user.id);
      if (!order) {
        res.status(404).json({ success: false, message: '订单不存在或无权限操作' });
        return;
      }
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async confirmReturn(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const order = orderService.confirmReturn(id, req.user.id);
      if (!order) {
        res.status(404).json({ success: false, message: '订单不存在或无权限操作' });
        return;
      }
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async confirmReturnWithDamage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const { description, photos } = req.body;
      const order = orderService.confirmReturnWithDamage(id, req.user.id, { description, photos });
      if (!order) {
        res.status(404).json({ success: false, message: '订单不存在或无权限操作' });
        return;
      }
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // Service Orders
  public async getServiceOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { role = 'all' } = req.query;
      const orders = orderService.getServiceOrders(req.user.id, role as any);
      res.json({ success: true, data: orders });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getServiceOrderById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const order = orderService.getServiceOrderById(id);
      if (!order) {
        res.status(404).json({ success: false, message: '订单不存在' });
        return;
      }
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async createServiceOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const order = orderService.createServiceOrder(req.user.id, req.body);
      res.status(201).json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async approveServiceOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const order = orderService.approveServiceOrder(id, req.user.id);
      if (!order) {
        res.status(404).json({ success: false, message: '订单不存在或无权限操作' });
        return;
      }
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async rejectServiceOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const { reason } = req.body;
      const order = orderService.rejectServiceOrder(id, req.user.id, reason);
      if (!order) {
        res.status(404).json({ success: false, message: '订单不存在或无权限操作' });
        return;
      }
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async startService(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const order = orderService.startService(id, req.user.id);
      if (!order) {
        res.status(404).json({ success: false, message: '订单不存在或无权限操作' });
        return;
      }
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async completeService(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const order = orderService.completeService(id, req.user.id);
      if (!order) {
        res.status(404).json({ success: false, message: '订单不存在或无权限操作' });
        return;
      }
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const orderController = new OrderController();
