import { Request, Response } from 'express';
import { disputeService } from '../services/DisputeService';
import { AuthRequest } from '../utils/auth';

export class DisputeController {
  public async getDisputes(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { role } = req.query;
      const disputes = disputeService.getDisputes(req.user.id, role as any);
      res.json({ success: true, data: disputes });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getAllDisputes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      const disputes = disputeService.getAllDisputes(status as string | undefined);
      res.json({ success: true, data: disputes });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getDisputeById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dispute = disputeService.getDisputeById(id);
      if (!dispute) {
        res.status(404).json({ success: false, message: '纠纷不存在' });
        return;
      }
      res.json({ success: true, data: dispute });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async createDispute(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const dispute = disputeService.createDispute(req.user.id, req.body);
      res.status(201).json({ success: true, data: dispute });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async resolveDispute(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const { resolution, refundTimeCoins, refundDeposit } = req.body;
      const dispute = disputeService.resolveDispute(
        id,
        req.user.id,
        resolution,
        refundTimeCoins,
        refundDeposit
      );
      if (!dispute) {
        res.status(404).json({ success: false, message: '纠纷不存在或已处理' });
        return;
      }
      res.json({ success: true, data: dispute });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async startReview(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const dispute = disputeService.startReview(id, req.user.id);
      if (!dispute) {
        res.status(404).json({ success: false, message: '纠纷不存在或无法处理' });
        return;
      }
      res.json({ success: true, data: dispute });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const disputeController = new DisputeController();
